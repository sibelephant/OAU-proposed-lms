import type { Context, Next } from 'hono';
import { createMiddleware } from 'hono/factory';
import { eq, and } from 'drizzle-orm';
import { authorizedUsers, authorizedToolPermissions } from '@atlas-lms/database/schema';
import { db } from '@atlas-lms/database';

type PermissionKey = 'DECROSSLIST' | 'SIS_OVERRIDE' | 'GRADE_UNLOCK';

/**
 * requirePermission — checks IU's 3-table authorization gate before allowing
 * the request through. Must be used after requireAuth.
 *
 * Usage:
 *   app.post('/crosslist', requireAuth, requirePermission('DECROSSLIST'), handler)
 */
export const requirePermission = (permissionKey: PermissionKey) =>
  createMiddleware(async (c: Context, next: Next) => {
    const session = c.get('session');
    if (!session) {
      return c.json({ error: 'Unauthorized', message: 'No session' }, 401);
    }

    // SystemAdmins bypass tool-permission checks
    if (session.role === 'SystemAdmin') {
      await next();
      return;
    }

    const rows = await db
      .select({ id: authorizedToolPermissions.id })
      .from(authorizedUsers)
      .innerJoin(
        authorizedToolPermissions,
        eq(authorizedUsers.id, authorizedToolPermissions.authorizedUserId)
      )
      .where(
        and(
          eq(authorizedUsers.loginId, session.loginId),
          eq(authorizedUsers.isActive, true),
          eq(authorizedToolPermissions.permissionKey, permissionKey)
        )
      )
      .limit(1);

    if (rows.length === 0) {
      return c.json(
        {
          error: 'Forbidden',
          message: `Permission '${permissionKey}' not granted to user '${session.loginId}'`,
        },
        403
      );
    }

    await next();
  });
