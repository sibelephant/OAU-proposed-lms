import { eq, and, inArray } from 'drizzle-orm';
import {
  enrollments,
  courseSections,
  courseShells,
  users,
} from '@atlas-lms/database/schema';
import type { DrizzleDb } from '../types';

export interface EnrollmentInput {
  sectionId: string;
  userId: string;
  role: 'Student' | 'Instructor' | 'TA' | 'Designer' | 'Auditor';
  status?: 'active' | 'dropped' | 'completed' | 'incomplete';
  isSisManaged?: boolean;
}

export class EnrollmentService {
  constructor(private readonly db: DrizzleDb) {}

  /**
   * Enrolls a user in a section
   */
  async enroll(input: EnrollmentInput) {
    // Verify section exists
    const [section] = await this.db
      .select()
      .from(courseSections)
      .where(eq(courseSections.id, input.sectionId))
      .limit(1);

    if (!section) throw new Error(`Section ${input.sectionId} not found`);

    // Verify user exists
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, input.userId))
      .limit(1);

    if (!user) throw new Error(`User ${input.userId} not found`);

    // Check if already enrolled
    const [existing] = await this.db
      .select()
      .from(enrollments)
      .where(
        and(
          eq(enrollments.sectionId, input.sectionId),
          eq(enrollments.userId, input.userId)
        )
      )
      .limit(1);

    if (existing) {
      // Update existing enrollment
      return this.updateEnrollment(existing.id, {
        role: input.role,
        status: input.status ?? 'active',
      });
    }

    const [enrollment] = await this.db
      .insert(enrollments)
      .values({
        sectionId: input.sectionId,
        userId: input.userId,
        role: input.role,
        status: input.status ?? 'active',
        isSisManaged: input.isSisManaged ?? false,
      })
      .returning();

    return enrollment;
  }

  /**
   * Updates an existing enrollment
   */
  async updateEnrollment(enrollmentId: string, updates: Partial<EnrollmentInput>) {
    const [enrollment] = await this.db
      .update(enrollments)
      .set({
        role: updates.role,
        status: updates.status,
        isSisManaged: updates.isSisManaged,
      })
      .where(eq(enrollments.id, enrollmentId))
      .returning();

    return enrollment;
  }

  /**
   * Unenrolls a user from a section
   */
  async unenroll(sectionId: string, userId: string) {
    await this.db
      .delete(enrollments)
      .where(
        and(
          eq(enrollments.sectionId, sectionId),
          eq(enrollments.userId, userId)
        )
      );
  }

  /**
   * Gets all enrollments for a section
   */
  async getSectionEnrollments(sectionId: string) {
    return this.db
      .select({
        id: enrollments.id,
        userId: enrollments.userId,
        role: enrollments.role,
        status: enrollments.status,
        isSisManaged: enrollments.isSisManaged,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        loginId: users.loginId,
        orgDefinedId: users.orgDefinedId,
      })
      .from(enrollments)
      .innerJoin(users, eq(enrollments.userId, users.id))
      .where(eq(enrollments.sectionId, sectionId));
  }

  /**
   * Gets all enrollments for a user across all sections
   */
  async getUserEnrollments(userId: string) {
    return this.db
      .select({
        id: enrollments.id,
        sectionId: enrollments.sectionId,
        role: enrollments.role,
        status: enrollments.status,
        isSisManaged: enrollments.isSisManaged,
        sectionCode: courseSections.sectionCode,
        shellId: courseSections.primaryShellId,
        courseCode: courseShells.courseCode,
        courseTitle: courseShells.title,
        termId: courseShells.termId,
      })
      .from(enrollments)
      .innerJoin(courseSections, eq(enrollments.sectionId, courseSections.id))
      .innerJoin(courseShells, eq(courseSections.primaryShellId, courseShells.id))
      .where(eq(enrollments.userId, userId));
  }

  /**
   * Bulk enrolls students from SIS data
   */
  async bulkEnrollFromSis(sectionId: string, studentUserIds: string[]) {
    return this.db.transaction(async (tx) => {
      const results = [];
      for (const userId of studentUserIds) {
        const [enrollment] = await tx
          .insert(enrollments)
          .values({
            sectionId,
            userId,
            role: 'Student',
            status: 'active',
            isSisManaged: true,
          })
          .onConflictDoUpdate({
            target: [enrollments.sectionId, enrollments.userId],
            set: { status: 'active' },
          })
          .returning();
        results.push(enrollment);
      }
      return results;
    });
  }

  /**
   * Transfers enrollments when cross-listing changes
   * Called when a section's primaryShellId changes
   */
  async transferEnrollmentsOnCrosslist(
    sectionId: string,
    oldShellId: string,
    newShellId: string
  ) {
    // Enrollments stay with the section - they don't need to move
    // The section's primaryShellId changed, so enrollments automatically
    // point to the new shell through the section relationship
    return this.getSectionEnrollments(sectionId);
  }

  /**
   * Drops a student (marks as dropped, preserves record)
   */
  async dropStudent(sectionId: string, userId: string) {
    return this.updateEnrollment(
      (await this.db
        .select({ id: enrollments.id })
        .from(enrollments)
        .where(and(eq(enrollments.sectionId, sectionId), eq(enrollments.userId, userId)))
        .limit(1))[0]?.id ?? '',
      { status: 'dropped' }
    );
  }

  /**
   * Completes a student enrollment
   */
  async completeStudent(sectionId: string, userId: string) {
    return this.updateEnrollment(
      (await this.db
        .select({ id: enrollments.id })
        .from(enrollments)
        .where(and(eq(enrollments.sectionId, sectionId), eq(enrollments.userId, userId)))
        .limit(1))[0]?.id ?? '',
      { status: 'completed' }
    );
  }
}