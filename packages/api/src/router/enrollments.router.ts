import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '@atlas-lms/database';
import { EnrollmentService } from '@atlas-lms/core-lms';
import { requireAuth, requireRole } from '../middleware/auth.middleware';

const router = new Hono();
const enrollmentService = new EnrollmentService(db);

// ─── GET /enrollments/sections/:sectionId ────────────────────────────────────
router.get('/sections/:sectionId', requireAuth, async (c) => {
  const sectionId = c.req.param('sectionId');
  if (!sectionId) return c.json({ error: 'NOT_FOUND', message: 'Missing sectionId' }, 404);

  const data = await enrollmentService.getSectionEnrollments(sectionId);
  return c.json({ data });
});

// ─── GET /enrollments/users/:userId ──────────────────────────────────────────
router.get('/users/:userId', requireAuth, async (c) => {
  const userId = c.req.param('userId');
  if (!userId) return c.json({ error: 'NOT_FOUND', message: 'Missing userId' }, 404);

  const session = c.get('session');

  // Students may only view their own enrollments
  if (session.role === 'Student' && session.sub !== userId) {
    return c.json({ error: 'Forbidden', message: "Cannot view another student's enrollments" }, 403);
  }

  const data = await enrollmentService.getUserEnrollments(userId);
  return c.json({ data });
});

// ─── POST /enrollments ────────────────────────────────────────────────────────
const enrollSchema = z.object({
  sectionId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.enum(['Student', 'Instructor', 'TA', 'Designer', 'Auditor']),
  status: z.enum(['active', 'dropped', 'completed', 'incomplete']).default('active'),
  isSisManaged: z.boolean().default(false),
});

router.post(
  '/',
  requireAuth,
  requireRole('Instructor', 'TA', 'SystemAdmin'),
  zValidator('json', enrollSchema),
  async (c) => {
    const body = c.req.valid('json');
    const enrollment = await enrollmentService.enroll(body);
    return c.json({ data: enrollment }, 201);
  }
);

// ─── POST /enrollments/bulk-sis ───────────────────────────────────────────────
const bulkSisSchema = z.object({
  sectionId: z.string().uuid(),
  studentUserIds: z.array(z.string().uuid()).min(1).max(500),
});

router.post(
  '/bulk-sis',
  requireAuth,
  requireRole('SystemAdmin'),
  zValidator('json', bulkSisSchema),
  async (c) => {
    const { sectionId, studentUserIds } = c.req.valid('json');
    const results = await enrollmentService.bulkEnrollFromSis(sectionId, studentUserIds);
    return c.json({ data: results, count: results.length }, 201);
  }
);

// ─── PATCH /enrollments/sections/:sectionId/users/:userId/drop ───────────────
router.patch(
  '/sections/:sectionId/users/:userId/drop',
  requireAuth,
  requireRole('Instructor', 'SystemAdmin'),
  async (c) => {
    const sectionId = c.req.param('sectionId');
    const userId = c.req.param('userId');
    if (!sectionId || !userId) {
      return c.json({ error: 'NOT_FOUND', message: 'Missing sectionId or userId' }, 404);
    }
    const enrollment = await enrollmentService.dropStudent(sectionId, userId);
    return c.json({ data: enrollment });
  }
);

// ─── PATCH /enrollments/sections/:sectionId/users/:userId/complete ────────────
router.patch(
  '/sections/:sectionId/users/:userId/complete',
  requireAuth,
  requireRole('Instructor', 'SystemAdmin'),
  async (c) => {
    const sectionId = c.req.param('sectionId');
    const userId = c.req.param('userId');
    if (!sectionId || !userId) {
      return c.json({ error: 'NOT_FOUND', message: 'Missing sectionId or userId' }, 404);
    }
    const enrollment = await enrollmentService.completeStudent(sectionId, userId);
    return c.json({ data: enrollment });
  }
);

// ─── DELETE /enrollments/sections/:sectionId/users/:userId ───────────────────
router.delete(
  '/sections/:sectionId/users/:userId',
  requireAuth,
  requireRole('Instructor', 'SystemAdmin'),
  async (c) => {
    const sectionId = c.req.param('sectionId');
    const userId = c.req.param('userId');
    if (!sectionId || !userId) {
      return c.json({ error: 'NOT_FOUND', message: 'Missing sectionId or userId' }, 404);
    }
    await enrollmentService.unenroll(sectionId, userId);
    return c.json({ success: true });
  }
);

export { router as enrollmentsRouter };
