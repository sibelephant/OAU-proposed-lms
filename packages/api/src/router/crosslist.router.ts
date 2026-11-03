import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '@atlas-lms/database';
import { CrosslistService } from '@atlas-lms/core-lms';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/permission.middleware';

const router = new Hono();
const crosslistService = new CrosslistService(db);

// ─── POST /crosslist ──────────────────────────────────────────────────────────
// Cross-list a child section into a target primary course shell.
// Actor must be an active Instructor in the section OR hold SIS_OVERRIDE.
const crosslistSchema = z.object({
  childSectionId: z.string().uuid(),
  targetPrimaryShellId: z.string().uuid(),
});

router.post(
  '/',
  requireAuth,
  requireRole('Instructor', 'SystemAdmin'),
  zValidator('json', crosslistSchema),
  async (c) => {
    const { childSectionId, targetPrimaryShellId } = c.req.valid('json');
    const session = c.get('session');

    const result = await crosslistService.crosslistSection({
      childSectionId,
      targetPrimaryShellId,
      actorUserId: session.sub,
    });

    return c.json({ data: result }, 200);
  }
);

// ─── POST /crosslist/decrosslist ──────────────────────────────────────────────
// Restores a cross-listed section back to its originalShellId.
// Requires explicit DECROSSLIST permission (IU authorization gate).
const decrosslistSchema = z.object({
  sectionId: z.string().uuid(),
});

router.post(
  '/decrosslist',
  requireAuth,
  requirePermission('DECROSSLIST'),
  zValidator('json', decrosslistSchema),
  async (c) => {
    const { sectionId } = c.req.valid('json');
    const session = c.get('session');

    const result = await crosslistService.decrosslistSection({
      sectionId,
      actorLoginId: session.loginId,
    });

    return c.json({ data: result }, 200);
  }
);

// ─── GET /crosslist/verify-permission ────────────────────────────────────────
// Utility endpoint — returns whether the current user holds a given permission.
// Used by the frontend to conditionally show crosslist UI controls.
router.get(
  '/verify-permission',
  requireAuth,
  async (c) => {
    const permission = c.req.query('permission') as
      | 'DECROSSLIST'
      | 'SIS_OVERRIDE'
      | 'GRADE_UNLOCK'
      | undefined;

    if (!permission || !['DECROSSLIST', 'SIS_OVERRIDE', 'GRADE_UNLOCK'].includes(permission)) {
      return c.json(
        { error: 'VALIDATION_ERROR', message: 'permission query param must be DECROSSLIST | SIS_OVERRIDE | GRADE_UNLOCK' },
        422
      );
    }

    const session = c.get('session');
    const hasPermission = await crosslistService.verifyToolPermission(
      session.loginId,
      permission
    );

    return c.json({ data: { permission, hasPermission } });
  }
);

export { router as crosslistRouter };
