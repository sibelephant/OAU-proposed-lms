import { eq, and, inArray } from 'drizzle-orm';
import {
  releaseConditions,
  releaseConditionLatches,
  gradeEntries,
  gradeItems,
  enrollments,
  courseSections,
} from '@atlas-lms/database/schema';
import type { DrizzleDb } from '../types';

export type ConditionDomain =
  | 'quiz_score'
  | 'assignment_submitted'
  | 'discussion_posted'
  | 'content_viewed'
  | 'checklist_completed'
  | 'award_earned'
  | 'competency_met'
  | 'survey_completed'
  | 'grade_threshold'
  | 'manual';

export type ConditionOperator = 'gte' | 'gt' | 'lte' | 'lt' | 'eq' | 'completed';

export interface ReleaseConditionInput {
  shellId: string;
  targetResourceType: 'module' | 'assignment' | 'quiz' | 'discussion' | 'content';
  targetResourceId: string;
  conditionDomain: ConditionDomain;
  sourceEntityId: string;
  operator: ConditionOperator;
  thresholdValue?: number;
}

export class ReleaseConditionService {
  constructor(private readonly db: DrizzleDb) {}

  /**
   * Creates a new release condition
   */
  async createCondition(input: ReleaseConditionInput) {
    const [condition] = await this.db
      .insert(releaseConditions)
      .values({
        shellId: input.shellId,
        targetResourceType: input.targetResourceType,
        targetResourceId: input.targetResourceId,
        conditionDomain: input.conditionDomain,
        sourceEntityId: input.sourceEntityId,
        operator: input.operator,
        thresholdValue: input.thresholdValue?.toFixed(2),
      })
      .returning();

    return condition;
  }

  /**
   * Gets all release conditions for a shell
   */
  async getConditions(shellId: string) {
    return this.db
      .select()
      .from(releaseConditions)
      .where(eq(releaseConditions.shellId, shellId));
  }

  /**
   * Core evaluation logic - checks if a condition is satisfied for a student
   * This implements the 10-domain condition engine from UGA eLC
   */
  async evaluateCondition(
    conditionId: string,
    studentId: string
  ): Promise<boolean> {
    const [condition] = await this.db
      .select()
      .from(releaseConditions)
      .where(eq(releaseConditions.id, conditionId))
      .limit(1);

    if (!condition) return false;

    // Check latch first - UGA invariant: once latched, never revoked
    const [existingLatch] = await this.db
      .select()
      .from(releaseConditionLatches)
      .where(
        and(
          eq(releaseConditionLatches.conditionId, conditionId),
          eq(releaseConditionLatches.studentId, studentId)
        )
      )
      .limit(1);

    if (existingLatch) return true;

    // Evaluate based on domain
    let satisfied = false;

    switch (condition.conditionDomain) {
      case 'quiz_score':
      case 'grade_threshold':
        satisfied = await this.evaluateScoreCondition(condition, studentId);
        break;

      case 'assignment_submitted':
        satisfied = await this.evaluateSubmissionCondition(condition, studentId);
        break;

      case 'discussion_posted':
        satisfied = await this.evaluateDiscussionCondition(condition, studentId);
        break;

      case 'content_viewed':
        satisfied = await this.evaluateContentViewedCondition(condition, studentId);
        break;

      case 'checklist_completed':
        satisfied = await this.evaluateChecklistCondition(condition, studentId);
        break;

      case 'award_earned':
        satisfied = await this.evaluateAwardCondition(condition, studentId);
        break;

      case 'competency_met':
        satisfied = await this.evaluateCompetencyCondition(condition, studentId);
        break;

      case 'survey_completed':
        satisfied = await this.evaluateSurveyCondition(condition, studentId);
        break;

      case 'manual':
        // Manual conditions are satisfied by instructor action
        satisfied = false;
        break;
    }

    // If satisfied, create latch (historical invariant)
    if (satisfied) {
      await this.createLatch(conditionId, studentId);
    }

    return satisfied;
  }

  /**
   * Evaluates score-based conditions (quiz_score, grade_threshold)
   * UGA: "score >= 60% on quiz with 72%"
   */
  private async evaluateScoreCondition(
    condition: typeof releaseConditions.$inferSelect,
    studentId: string
  ): Promise<boolean> {
    // Get the grade entry for this student on the source item
    const [entry] = await this.db
      .select({
        pointsEarned: gradeEntries.pointsEarned,
        maxPoints: gradeItems.maxPoints,
      })
      .from(gradeEntries)
      .innerJoin(gradeItems, eq(gradeEntries.gradeItemId, gradeItems.id))
      .where(
        and(
          eq(gradeItems.id, condition.sourceEntityId),
          eq(gradeEntries.studentId, studentId)
        )
      )
      .limit(1);

    if (!entry || entry.pointsEarned === null) return false;

    const score = (Number(entry.pointsEarned) / Number(entry.maxPoints)) * 100;
    const threshold = Number(condition.thresholdValue ?? 0);

    return this.compareValues(score, threshold, condition.operator as ConditionOperator);
  }

  /**
   * Evaluates assignment submission condition
   */
  private async evaluateSubmissionCondition(
    condition: typeof releaseConditions.$inferSelect,
    studentId: string
  ): Promise<boolean> {
    const [entry] = await this.db
      .select({ pointsEarned: gradeEntries.pointsEarned })
      .from(gradeEntries)
      .where(
        and(
          eq(gradeEntries.gradeItemId, condition.sourceEntityId),
          eq(gradeEntries.studentId, studentId)
        )
      )
      .limit(1);

    // Submitted means there's a grade entry (even if 0 points)
    return entry !== undefined;
  }

  /**
   * Evaluates discussion posted condition
   */
  private async evaluateDiscussionCondition(
    condition: typeof releaseConditions.$inferSelect,
    studentId: string
  ): Promise<boolean> {
    // Would check discussion posts table - placeholder
    return false;
  }

  /**
   * Evaluates content viewed condition
   */
  private async evaluateContentViewedCondition(
    condition: typeof releaseConditions.$inferSelect,
    studentId: string
  ): Promise<boolean> {
    // Would check content analytics - placeholder
    return false;
  }

  /**
   * Evaluates checklist completed condition
   */
  private async evaluateChecklistCondition(
    condition: typeof releaseConditions.$inferSelect,
    studentId: string
  ): Promise<boolean> {
    // Would check checklist completion - placeholder
    return false;
  }

  /**
   * Evaluates award earned condition
   */
  private async evaluateAwardCondition(
    condition: typeof releaseConditions.$inferSelect,
    studentId: string
  ): Promise<boolean> {
    // Would check awards - placeholder
    return false;
  }

  /**
   * Evaluates competency met condition
   */
  private async evaluateCompetencyCondition(
    condition: typeof releaseConditions.$inferSelect,
    studentId: string
  ): Promise<boolean> {
    // Would check competencies - placeholder
    return false;
  }

  /**
   * Evaluates survey completed condition
   */
  private async evaluateSurveyCondition(
    condition: typeof releaseConditions.$inferSelect,
    studentId: string
  ): Promise<boolean> {
    // Would check surveys - placeholder
    return false;
  }

  /**
   * Comparison helper for numeric operators
   */
  private compareValues(value: number, threshold: number, operator: ConditionOperator): boolean {
    switch (operator) {
      case 'gte': return value >= threshold;
      case 'gt': return value > threshold;
      case 'lte': return value <= threshold;
      case 'lt': return value < threshold;
      case 'eq': return value === threshold;
      case 'completed': return true; // Handled separately
      default: return false;
    }
  }

  /**
   * Creates a latch - once created, never removed (UGA invariant)
   */
  async createLatch(conditionId: string, studentId: string) {
    await this.db
      .insert(releaseConditionLatches)
      .values({
        conditionId,
        studentId,
        satisfiedAt: new Date(),
      })
      .onConflictDoNothing(); // Unique index prevents duplicates
  }

  /**
   * Evaluates all conditions for a student and returns which resources they can access
   */
  async evaluateAllForStudent(shellId: string, studentId: string) {
    const conditions = await this.getConditions(shellId);
    const results: Record<string, boolean> = {};

    for (const condition of conditions) {
      const satisfied = await this.evaluateCondition(condition.id, studentId);
      results[condition.targetResourceId] = satisfied;
    }

    return results;
  }

  /**
   * Gets all latches for a student in a shell
   */
  async getStudentLatches(shellId: string, studentId: string) {
    const conditions = await this.db
      .select({ id: releaseConditions.id })
      .from(releaseConditions)
      .where(eq(releaseConditions.shellId, shellId));

    const conditionIds = conditions.map(c => c.id);

    if (conditionIds.length === 0) return [];

    return this.db
      .select()
      .from(releaseConditionLatches)
      .where(
        and(
          eq(releaseConditionLatches.studentId, studentId),
          inArray(releaseConditionLatches.conditionId, conditionIds)
        )
      );
  }

  /**
   * Checks if a student has access to a specific resource
   */
  async hasAccess(shellId: string, studentId: string, resourceType: string, resourceId: string): Promise<boolean> {
    const conditions = await this.db
      .select()
      .from(releaseConditions)
      .where(
        and(
          eq(releaseConditions.shellId, shellId),
          eq(releaseConditions.targetResourceType, resourceType),
          eq(releaseConditions.targetResourceId, resourceId)
        )
      );

    // If no conditions, access is granted
    if (conditions.length === 0) return true;

    // All conditions must be satisfied (AND logic)
    for (const condition of conditions) {
      const satisfied = await this.evaluateCondition(condition.id, studentId);
      if (!satisfied) return false;
    }

    return true;
  }
}