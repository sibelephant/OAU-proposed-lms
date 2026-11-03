import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@atlas-lms/database';
import { gradeCategories, gradeItems } from '@atlas-lms/database/schema';
import { GradebookService } from '@atlas-lms/core-lms';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/permission.middleware';

const router = new Hono();
const gradebookService = new GradebookService(db);

// ─── GET /gradebook/:shellId/calculate ───────────────────────────────────────
router.get(
  '/:shellId/calculate',
  requireAuth,
  requireRole('Instructor', 'TA', 'SystemAdmin'),
  async (c) => {
    const shellId = c.req.param('shellId');
    if (!shellId) return c.json({ error: 'NOT_FOUND', message: 'Missing shellId' }, 404);
    const grades = await gradebookService.calculateFinalGrades(shellId);
    return c.json({ data: grades });
  }
);

// ─── POST /gradebook/:shellId/persist ────────────────────────────────────────
router.post(
  '/:shellId/persist',
  requireAuth,
  requireRole('Instructor', 'SystemAdmin'),
  async (c) => {
    const shellId = c.req.param('shellId');
    if (!shellId) return c.json({ error: 'NOT_FOUND', message: 'Missing shellId' }, 404);
    await gradebookService.persistFinalGrades(shellId);
    return c.json({ success: true, message: 'Final grades persisted' });
  }
);

// ─── PATCH /gradebook/:shellId/students/:studentId/override ──────────────────
const overrideSchema = z.object({
  adjustedNumeric: z.number().min(0).max(200),
});

router.patch(
  '/:shellId/students/:studentId/override',
  requireAuth,
  requireRole('Instructor', 'SystemAdmin'),
  zValidator('json', overrideSchema),
  async (c) => {
    const shellId = c.req.param('shellId');
    const studentId = c.req.param('studentId');
    if (!shellId || !studentId) {
      return c.json({ error: 'NOT_FOUND', message: 'Missing shellId or studentId' }, 404);
    }
    const { adjustedNumeric } = c.req.valid('json');
    const session = c.get('session');

    await gradebookService.overrideAdjustedGrade({
      shellId,
      studentId,
      adjustedNumeric,
      actorUserId: session.sub,
    });
    return c.json({ success: true });
  }
);

// ─── POST /gradebook/:shellId/release ────────────────────────────────────────
const releaseSchema = z.object({
  studentIds: z.array(z.string().uuid()).optional(),
});

router.post(
  '/:shellId/release',
  requireAuth,
  requireRole('Instructor', 'SystemAdmin'),
  zValidator('json', releaseSchema),
  async (c) => {
    const shellId = c.req.param('shellId');
    if (!shellId) return c.json({ error: 'NOT_FOUND', message: 'Missing shellId' }, 404);
    const { studentIds } = c.req.valid('json');
    await gradebookService.releaseGrades(shellId, studentIds);
    return c.json({ success: true, message: 'Grades released to students' });
  }
);

// ─── POST /gradebook/:shellId/post-to-sis ────────────────────────────────────
const postSisSchema = z.object({
  studentIds: z.array(z.string().uuid()).min(1),
});

router.post(
  '/:shellId/post-to-sis',
  requireAuth,
  requireRole('Instructor', 'SystemAdmin'),
  requirePermission('SIS_OVERRIDE'),
  zValidator('json', postSisSchema),
  async (c) => {
    const shellId = c.req.param('shellId');
    if (!shellId) return c.json({ error: 'NOT_FOUND', message: 'Missing shellId' }, 404);
    const { studentIds } = c.req.valid('json');
    await gradebookService.postToSis(shellId, studentIds);
    return c.json({ success: true, message: `Marked ${studentIds.length} grades as posted to SIS` });
  }
);

// ─── GET /gradebook/:shellId/export/elc-csv ──────────────────────────────────
router.get(
  '/:shellId/export/elc-csv',
  requireAuth,
  requireRole('Instructor', 'SystemAdmin'),
  async (c) => {
    const shellId = c.req.param('shellId');
    if (!shellId) return c.json({ error: 'NOT_FOUND', message: 'Missing shellId' }, 404);
    const csv = await gradebookService.exportElcCsv(shellId);
    c.header('Content-Type', 'text/csv');
    c.header('Content-Disposition', `attachment; filename="gradebook-${shellId}.csv"`);
    return c.body(csv);
  }
);

// ─── GET /gradebook/:shellId/export/athena-csv ───────────────────────────────
router.get(
  '/:shellId/export/athena-csv',
  requireAuth,
  requireRole('Instructor', 'SystemAdmin'),
  async (c) => {
    const shellId = c.req.param('shellId');
    if (!shellId) return c.json({ error: 'NOT_FOUND', message: 'Missing shellId' }, 404);
    const sisTermCode = c.req.query('sisTermCode');
    const crn = c.req.query('crn');

    if (!sisTermCode || !crn) {
      return c.json(
        { error: 'VALIDATION_ERROR', message: 'Query params sisTermCode and crn are required' },
        422
      );
    }

    const csv = await gradebookService.exportAthenaCsv(shellId, sisTermCode, crn);
    c.header('Content-Type', 'text/csv');
    c.header('Content-Disposition', `attachment; filename="athena-grades-${sisTermCode}-${crn}.csv"`);
    return c.body(csv);
  }
);

// ─── PUT /gradebook/:shellId/entries ─────────────────────────────────────────
const upsertGradeSchema = z.object({
  gradeItemId: z.string().uuid(),
  studentId: z.string().uuid(),
  pointsEarned: z.number().min(0).nullable(),
  isExempt: z.boolean().default(false),
  publicFeedback: z.string().optional(),
  privateGraderComments: z.string().optional(),
});

router.put(
  '/:shellId/entries',
  requireAuth,
  requireRole('Instructor', 'TA', 'SystemAdmin'),
  zValidator('json', upsertGradeSchema),
  async (c) => {
    const session = c.get('session');
    const body = c.req.valid('json');

    await gradebookService.upsertGrade({
      ...body,
      updatedById: session.sub,
    });
    return c.json({ success: true });
  }
);

// ─── GET /gradebook/:shellId/categories ──────────────────────────────────────
router.get('/:shellId/categories', requireAuth, async (c) => {
  const shellId = c.req.param('shellId');
  if (!shellId) return c.json({ error: 'NOT_FOUND', message: 'Missing shellId' }, 404);

  const categories = await db
    .select()
    .from(gradeCategories)
    .where(eq(gradeCategories.shellId, shellId));
  return c.json({ data: categories });
});

// ─── POST /gradebook/:shellId/categories ─────────────────────────────────────
const createCategorySchema = z.object({
  name: z.string().min(1).max(128),
  weightPercent: z.number().min(0).max(100),
  dropLowestCount: z.number().int().min(0).default(0),
  sortOrder: z.number().int().min(0).default(0),
});

router.post(
  '/:shellId/categories',
  requireAuth,
  requireRole('Instructor', 'SystemAdmin'),
  zValidator('json', createCategorySchema),
  async (c) => {
    const shellId = c.req.param('shellId');
    if (!shellId) return c.json({ error: 'NOT_FOUND', message: 'Missing shellId' }, 404);
    const body = c.req.valid('json');

    const [category] = await db
      .insert(gradeCategories)
      .values({
        shellId,
        name: body.name,
        weightPercent: body.weightPercent.toFixed(2),
        dropLowestCount: body.dropLowestCount,
        sortOrder: body.sortOrder,
      })
      .returning();

    return c.json({ data: category }, 201);
  }
);

// ─── GET /gradebook/:shellId/items ────────────────────────────────────────────
router.get('/:shellId/items', requireAuth, async (c) => {
  const shellId = c.req.param('shellId');
  if (!shellId) return c.json({ error: 'NOT_FOUND', message: 'Missing shellId' }, 404);

  const items = await db
    .select()
    .from(gradeItems)
    .where(eq(gradeItems.shellId, shellId));
  return c.json({ data: items });
});

// ─── POST /gradebook/:shellId/items ──────────────────────────────────────────
const createItemSchema = z.object({
  categoryId: z.string().uuid().optional(),
  title: z.string().min(1).max(255),
  maxPoints: z.number().min(0),
  itemWeightPercent: z.number().min(0).max(100),
  isBonus: z.boolean().default(false),
  dueDate: z.string().datetime().optional(),
});

router.post(
  '/:shellId/items',
  requireAuth,
  requireRole('Instructor', 'SystemAdmin'),
  zValidator('json', createItemSchema),
  async (c) => {
    const shellId = c.req.param('shellId');
    if (!shellId) return c.json({ error: 'NOT_FOUND', message: 'Missing shellId' }, 404);
    const body = c.req.valid('json');

    const [item] = await db
      .insert(gradeItems)
      .values({
        shellId,
        categoryId: body.categoryId ?? null,
        title: body.title,
        maxPoints: body.maxPoints.toFixed(2),
        itemWeightPercent: body.itemWeightPercent.toFixed(2),
        isBonus: body.isBonus,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
      })
      .returning();

    return c.json({ data: item }, 201);
  }
);

export { router as gradebookRouter };
