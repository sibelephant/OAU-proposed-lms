import { eq, and } from 'drizzle-orm';
import {
  courseSections,
  enrollments,
  authorizedUsers,
  authorizedToolPermissions,
  users,
} from '@atlas-lms/database/schema';
import type { DrizzleDb } from '../types';

export class CrosslistService {
  constructor(private readonly db: DrizzleDb) {}

  /**
   * Checks IU's 3-table authorization gate (AUTHORIZED_USERS -> AUTHORIZED_TOOL_PERMISSION)
   */
  async verifyToolPermission(
    loginId: string,
    requiredPermission: 'DECROSSLIST' | 'SIS_OVERRIDE' | 'GRADE_UNLOCK'
  ): Promise<boolean> {
    const records = await this.db
      .select({ permId: authorizedToolPermissions.id })
      .from(authorizedUsers)
      .innerJoin(
        authorizedToolPermissions,
        eq(authorizedUsers.id, authorizedToolPermissions.authorizedUserId)
      )
      .where(
        and(
          eq(authorizedUsers.loginId, loginId),
          eq(authorizedUsers.isActive, true),
          eq(authorizedToolPermissions.permissionKey, requiredPermission)
        )
      )
      .limit(1);

    return records.length > 0;
  }

  /**
   * Cross-lists a child section into a target primary CourseShell.
   * Preserves `originalShellId` so De-Cross-Listing can restore the exact prior state.
   */
  async crosslistSection(params: {
    childSectionId: string;
    targetPrimaryShellId: string;
    actorUserId: string;
  }) {
    return await this.db.transaction(async (tx: DrizzleDb) => {
      const [section] = await tx
        .select()
        .from(courseSections)
        .where(eq(courseSections.id, params.childSectionId))
        .limit(1);

      if (!section) {
        throw new Error(`Section ${params.childSectionId} not found.`);
      }

      // Verify actor is an active Instructor in the section or holds admin override
      const [actorEnrollment] = await tx
        .select()
        .from(enrollments)
        .where(
          and(
            eq(enrollments.userId, params.actorUserId),
            eq(enrollments.sectionId, params.childSectionId),
            eq(enrollments.role, 'Instructor'),
            eq(enrollments.status, 'active')
          )
        )
        .limit(1);

      if (!actorEnrollment) {
        // Check if they have SIS_OVERRIDE permission
        const [actorUser] = await tx
          .select({ loginId: users.loginId })
          .from(users)
          .where(eq(users.id, params.actorUserId))
          .limit(1);

        const hasOverride = actorUser
          ? await this.verifyToolPermission(actorUser.loginId, 'SIS_OVERRIDE')
          : false;

        if (!hasOverride) {
          throw new Error('Actor must be an active Instructor in the section or hold SIS_OVERRIDE permission.');
        }
      }

      await tx
        .update(courseSections)
        .set({
          primaryShellId: params.targetPrimaryShellId,
          crosslistedById: params.actorUserId,
          crosslistedAt: new Date(),
        })
        .where(eq(courseSections.id, params.childSectionId));

      return {
        sectionId: section.id,
        previousShellId: section.primaryShellId,
        newPrimaryShellId: params.targetPrimaryShellId,
      };
    });
  }

  /**
   * De-Cross-Lists a section back to its `originalShellId`.
   * Enforces IU's strict `DECROSSLIST` permission check.
   */
  async decrosslistSection(params: {
    sectionId: string;
    actorLoginId: string;
  }) {
    const isAuthorized = await this.verifyToolPermission(params.actorLoginId, 'DECROSSLIST');
    if (!isAuthorized) {
      throw new Error(
        `User ${params.actorLoginId} lacks explicit DECROSSLIST permission in AUTHORIZED_TOOL_PERMISSION.`
      );
    }

    return await this.db.transaction(async (tx: DrizzleDb) => {
      const [section] = await tx
        .select()
        .from(courseSections)
        .where(eq(courseSections.id, params.sectionId))
        .limit(1);

      if (!section) throw new Error('Section not found.');

      await tx
        .update(courseSections)
        .set({
          primaryShellId: section.originalShellId,
          crosslistedById: null,
          crosslistedAt: null,
        })
        .where(eq(courseSections.id, params.sectionId));

      return {
        sectionId: section.id,
        restoredShellId: section.originalShellId,
      };
    });
  }
}
