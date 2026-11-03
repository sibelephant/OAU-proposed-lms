import { eq, and, inArray } from 'drizzle-orm';
import {
  courseShells,
  gradeCategories,
  gradeItems,
  gradeEntries,
  finalCourseGrades,
  users,
  enrollments,
  courseSections,
} from '@atlas-lms/database/schema';
import type { DrizzleDb } from '../types';
import { UgaGradebookExporter, type StudentGradebookRow } from './uga-gradebook-export.service';

export interface CategoryCalculation {
  categoryId: string;
  categoryName: string;
  weightPercent: number;
  studentScores: Map<string, { earned: number; possible: number; count: number }>;
}

export interface StudentFinalGrade {
  studentId: string;
  orgDefinedId: string;
  username: string;
  firstName: string;
  lastName: string;
  calculatedNumeric: number;
  letterGrade: string;
  categoryBreakdown: Record<string, { score: number; weight: number; contribution: number }>;
}

export class GradebookService {
  constructor(private readonly db: DrizzleDb) {}

  /**
   * Computes final grades for all students in a course shell using the two-tier weighted system:
   * 1. Categories sum to 100% of course grade
   * 2. Items within category have weights summing to 100% of that category
   *
   * UGA eLC Weighted System:
   * - category_score = Σ(item_percent) / count (after drop-lowest), averaged across items
   * - category_contribution = category_score × (category_weight / 100)
   * - final = Σ(category_contribution) + bonus_points
   */
  async calculateFinalGrades(shellId: string): Promise<StudentFinalGrade[]> {
    // Get shell config
    const [shell] = await this.db
      .select()
      .from(courseShells)
      .where(eq(courseShells.id, shellId))
      .limit(1);

    if (!shell) throw new Error(`Shell ${shellId} not found`);

    // Get all sections in this shell
    const sections = await this.db
      .select({ id: courseSections.id })
      .from(courseSections)
      .where(eq(courseSections.primaryShellId, shellId));

    if (sections.length === 0) return [];

    const sectionIds = sections.map(s => s.id);

    // Get all enrolled active students in this shell's sections
    const studentEnrollmentRows = await this.db
      .select({ userId: enrollments.userId })
      .from(enrollments)
      .where(
        and(
          inArray(enrollments.sectionId, sectionIds),
          eq(enrollments.status, 'active'),
          eq(enrollments.role, 'Student')
        )
      );

    if (studentEnrollmentRows.length === 0) return [];

    // Deduplicate student IDs (student may be in multiple sections)
    const studentIds = [...new Set(studentEnrollmentRows.map(e => e.userId))];

    // Get student info
    const studentInfos = await this.db
      .select({
        id: users.id,
        orgDefinedId: users.orgDefinedId,
        loginId: users.loginId,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(users)
      .where(inArray(users.id, studentIds));

    // Get all grade entries for this shell's items (only for these students)
    const allGrades = await this.db
      .select({
        gradeItemId: gradeEntries.gradeItemId,
        studentId: gradeEntries.studentId,
        pointsEarned: gradeEntries.pointsEarned,
        isExempt: gradeEntries.isExempt,
        itemMaxPoints: gradeItems.maxPoints,
        itemWeightPercent: gradeItems.itemWeightPercent,
        itemIsBonus: gradeItems.isBonus,
        categoryId: gradeItems.categoryId,
        categoryName: gradeCategories.name,
        categoryWeightPercent: gradeCategories.weightPercent,
        categoryDropLowest: gradeCategories.dropLowestCount,
      })
      .from(gradeEntries)
      .innerJoin(gradeItems, eq(gradeEntries.gradeItemId, gradeItems.id))
      .leftJoin(gradeCategories, eq(gradeItems.categoryId, gradeCategories.id))
      .where(
        and(
          eq(gradeItems.shellId, shellId),
          inArray(gradeEntries.studentId, studentIds)
        )
      );

    // Group grades by student
    const studentGrades = new Map<string, typeof allGrades>();
    for (const g of allGrades) {
      if (!studentGrades.has(g.studentId)) studentGrades.set(g.studentId, []);
      studentGrades.get(g.studentId)!.push(g);
    }

    // Calculate for each student
    const results: StudentFinalGrade[] = [];

    for (const studentId of studentIds) {
      const grades = studentGrades.get(studentId) ?? [];
      const student = studentInfos.find(s => s.id === studentId);

      if (!student) continue;

      // Group by category
      const categoryMap = new Map<string, {
        name: string;
        weight: number;
        dropLowest: number;
        items: typeof grades;
      }>();

      let bonusPoints = 0;

      for (const g of grades) {
        if (g.itemIsBonus && g.pointsEarned !== null) {
          bonusPoints += Number(g.pointsEarned);
          continue;
        }

        const catId = g.categoryId ?? '__no_category__';
        if (!categoryMap.has(catId)) {
          categoryMap.set(catId, {
            name: g.categoryName ?? 'Uncategorized',
            weight: Number(g.categoryWeightPercent ?? 0),
            dropLowest: g.categoryDropLowest ?? 0,
            items: [],
          });
        }
        categoryMap.get(catId)!.items.push(g);
      }

      const categoryBreakdown: Record<string, { score: number; weight: number; contribution: number }> = {};
      let totalContribution = 0;

      for (const [, cat] of categoryMap) {
        if (cat.items.length === 0) {
          categoryBreakdown[cat.name] = { score: 0, weight: cat.weight, contribution: 0 };
          continue;
        }

        // Sort by percent ascending to drop lowest
        const scoredItems = cat.items
          .filter(i => i.pointsEarned !== null && !i.isExempt)
          .map(i => ({
            ...i,
            percent: (Number(i.pointsEarned) / Number(i.itemMaxPoints)) * 100,
          }))
          .sort((a, b) => a.percent - b.percent);

        // Apply drop-lowest
        const itemsToCount = scoredItems.slice(cat.dropLowest);

        if (itemsToCount.length === 0) {
          categoryBreakdown[cat.name] = { score: 0, weight: cat.weight, contribution: 0 };
          continue;
        }

        // Category score = average of item percentages
        const categoryScore = itemsToCount.reduce((sum, i) => sum + i.percent, 0) / itemsToCount.length;
        const contribution = categoryScore * (cat.weight / 100);

        categoryBreakdown[cat.name] = {
          score: Math.round(categoryScore * 100) / 100,
          weight: cat.weight,
          contribution: Math.round(contribution * 100) / 100,
        };

        totalContribution += contribution;
      }

      const calculatedNumeric = Math.round((totalContribution + bonusPoints) * 100) / 100;
      const letterGrade = UgaGradebookExporter.toPlusMinusLetterGrade(calculatedNumeric);

      results.push({
        studentId,
        orgDefinedId: student.orgDefinedId,
        username: student.loginId,
        firstName: student.firstName,
        lastName: student.lastName,
        calculatedNumeric,
        letterGrade,
        categoryBreakdown,
      });
    }

    return results;
  }

  /**
   * Persists calculated grades to final_course_grades table
   */
  async persistFinalGrades(shellId: string): Promise<void> {
    const calculated = await this.calculateFinalGrades(shellId);

    for (const grade of calculated) {
      await this.db
        .insert(finalCourseGrades)
        .values({
          shellId,
          studentId: grade.studentId,
          calculatedNumeric: grade.calculatedNumeric.toFixed(2),
          adjustedNumeric: null,
          letterGradeScheme: grade.letterGrade,
          isReleasedToStudent: false,
        })
        .onConflictDoUpdate({
          target: [finalCourseGrades.shellId, finalCourseGrades.studentId],
          set: {
            calculatedNumeric: grade.calculatedNumeric.toFixed(2),
            letterGradeScheme: grade.letterGrade,
          },
        });
    }
  }

  /**
   * Instructor overrides the adjusted grade (UGA Final Adjusted Grade)
   */
  async overrideAdjustedGrade(params: {
    shellId: string;
    studentId: string;
    adjustedNumeric: number;
    actorUserId: string;
  }): Promise<void> {
    const letterGrade = UgaGradebookExporter.toPlusMinusLetterGrade(params.adjustedNumeric);

    await this.db
      .update(finalCourseGrades)
      .set({
        adjustedNumeric: params.adjustedNumeric.toFixed(2),
        letterGradeScheme: letterGrade,
      })
      .where(
        and(
          eq(finalCourseGrades.shellId, params.shellId),
          eq(finalCourseGrades.studentId, params.studentId)
        )
      );
  }

  /**
   * Releases final grades to students (all or a subset)
   */
  async releaseGrades(shellId: string, studentIds?: string[]): Promise<void> {
    const whereClause = studentIds && studentIds.length > 0
      ? and(eq(finalCourseGrades.shellId, shellId), inArray(finalCourseGrades.studentId, studentIds))
      : eq(finalCourseGrades.shellId, shellId);

    await this.db
      .update(finalCourseGrades)
      .set({ isReleasedToStudent: true })
      .where(whereClause);
  }

  /**
   * Posts grades to SIS (marks posted timestamp)
   */
  async postToSis(shellId: string, studentIds: string[]): Promise<void> {
    await this.db
      .update(finalCourseGrades)
      .set({ postedToSisAt: new Date() })
      .where(
        and(
          eq(finalCourseGrades.shellId, shellId),
          inArray(finalCourseGrades.studentId, studentIds)
        )
      );
  }

  /**
   * Exports gradebook in UGA eLC CSV format
   */
  async exportElcCsv(shellId: string): Promise<string> {
    // Get all grade items for headers
    const items = await this.db
      .select({ id: gradeItems.id, title: gradeItems.title })
      .from(gradeItems)
      .where(eq(gradeItems.shellId, shellId))
      .orderBy(gradeItems.id);

    const itemIds = items.map(i => i.id);
    const itemTitles = items.map(i => i.title);

    // Get all final grades with student info
    const finalGrades = await this.db
      .select({
        studentId: finalCourseGrades.studentId,
        calculatedNumeric: finalCourseGrades.calculatedNumeric,
        adjustedNumeric: finalCourseGrades.adjustedNumeric,
        orgDefinedId: users.orgDefinedId,
        loginId: users.loginId,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(finalCourseGrades)
      .innerJoin(users, eq(finalCourseGrades.studentId, users.id))
      .where(eq(finalCourseGrades.shellId, shellId));

    if (finalGrades.length === 0) return UgaGradebookExporter.exportStandardElcCsv(itemTitles, []);

    const studentIds = finalGrades.map(g => g.studentId);

    // Fetch all grade entries for these students on this shell's items in one query
    const allEntries = itemIds.length > 0 && studentIds.length > 0
      ? await this.db
          .select({
            studentId: gradeEntries.studentId,
            itemTitle: gradeItems.title,
            pointsEarned: gradeEntries.pointsEarned,
          })
          .from(gradeEntries)
          .innerJoin(gradeItems, eq(gradeEntries.gradeItemId, gradeItems.id))
          .where(
            and(
              inArray(gradeEntries.gradeItemId, itemIds),
              inArray(gradeEntries.studentId, studentIds)
            )
          )
      : [];

    // Index entries by studentId -> itemTitle -> score
    const entryIndex = new Map<string, Map<string, number | null>>();
    for (const e of allEntries) {
      if (!entryIndex.has(e.studentId)) entryIndex.set(e.studentId, new Map());
      entryIndex.get(e.studentId)!.set(e.itemTitle, e.pointsEarned !== null ? Number(e.pointsEarned) : null);
    }

    const rows: StudentGradebookRow[] = finalGrades.map(g => {
      const scoreMap = entryIndex.get(g.studentId) ?? new Map();
      const itemScores: Record<string, number | null> = {};
      for (const title of itemTitles) {
        itemScores[title] = scoreMap.get(title) ?? null;
      }
      return {
        orgDefinedId: g.orgDefinedId,
        username: g.loginId,
        lastName: g.lastName,
        firstName: g.firstName,
        itemScores,
        calculatedFinalGrade: Number(g.calculatedNumeric),
        adjustedFinalGrade: g.adjustedNumeric !== null ? Number(g.adjustedNumeric) : null,
      };
    });

    return UgaGradebookExporter.exportStandardElcCsv(itemTitles, rows);
  }

  /**
   * Exports final grades for Athena SIS import
   */
  async exportAthenaCsv(shellId: string, sisTermCode: string, crn: string): Promise<string> {
    const finalGrades = await this.db
      .select({
        calculatedNumeric: finalCourseGrades.calculatedNumeric,
        adjustedNumeric: finalCourseGrades.adjustedNumeric,
        orgDefinedId: users.orgDefinedId,
        loginId: users.loginId,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(finalCourseGrades)
      .innerJoin(users, eq(finalCourseGrades.studentId, users.id))
      .where(eq(finalCourseGrades.shellId, shellId));

    const rows: StudentGradebookRow[] = finalGrades.map(g => ({
      orgDefinedId: g.orgDefinedId,
      username: g.loginId,
      lastName: g.lastName,
      firstName: g.firstName,
      itemScores: {},
      calculatedFinalGrade: Number(g.calculatedNumeric),
      adjustedFinalGrade: g.adjustedNumeric !== null ? Number(g.adjustedNumeric) : null,
    }));

    return UgaGradebookExporter.exportAthenaFinalGradesCsv(sisTermCode, crn, rows);
  }

  /**
   * Upserts a single grade entry
   */
  async upsertGrade(params: {
    gradeItemId: string;
    studentId: string;
    pointsEarned: number | null;
    isExempt?: boolean;
    publicFeedback?: string;
    privateGraderComments?: string;
    updatedById: string;
  }): Promise<void> {
    await this.db
      .insert(gradeEntries)
      .values({
        gradeItemId: params.gradeItemId,
        studentId: params.studentId,
        pointsEarned: params.pointsEarned !== null ? params.pointsEarned.toFixed(2) : null,
        isExempt: params.isExempt ?? false,
        publicFeedback: params.publicFeedback,
        privateGraderComments: params.privateGraderComments,
        updatedById: params.updatedById,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [gradeEntries.gradeItemId, gradeEntries.studentId],
        set: {
          pointsEarned: params.pointsEarned !== null ? params.pointsEarned.toFixed(2) : null,
          isExempt: params.isExempt ?? false,
          publicFeedback: params.publicFeedback,
          privateGraderComments: params.privateGraderComments,
          updatedById: params.updatedById,
          updatedAt: new Date(),
        },
      });
  }
}
