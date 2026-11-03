import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@atlas-lms/database';
import {
  courseShells,
  courseSections,
  academicUnits,
} from '@atlas-lms/database/schema';
import { requireAuth, requireRole } from '../middleware/auth.middleware';

const router = new Hono();

// ─── GET /courses ─────────────────────────────────────────────────────────────
router.get('/', requireAuth, async (c) => {
  const termId = c.req.query('termId');

  const query = db
    .select({
      id: courseShells.id,
      courseCode: courseShells.courseCode,
      title: courseShells.title,
      isPublished: courseShells.isPublished,
      isSandbox: courseShells.isSandbox,
      gradeSystem: courseShells.gradeSystem,
      termId: courseShells.termId,
      createdAt: courseShells.createdAt,
      unitName: academicUnits.name,
      unitCode: academicUnits.code,
    })
    .from(courseShells)
    .innerJoin(academicUnits, eq(courseShells.academicUnitId, academicUnits.id));

  const shells = termId
    ? await query.where(eq(courseShells.termId, termId))
    : await query;

  return c.json({ data: shells });
});

// ─── GET /courses/:shellId ────────────────────────────────────────────────────
router.get('/:shellId', requireAuth, async (c) => {
  const shellId = c.req.param('shellId');
  if (!shellId) return c.json({ error: 'NOT_FOUND', message: 'Missing shellId' }, 404);

  const [shell] = await db
    .select({
      id: courseShells.id,
      courseCode: courseShells.courseCode,
      title: courseShells.title,
      isPublished: courseShells.isPublished,
      isSandbox: courseShells.isSandbox,
      gradeSystem: courseShells.gradeSystem,
      ungradedTreatment: courseShells.ungradedTreatment,
      termId: courseShells.termId,
      createdAt: courseShells.createdAt,
      academicUnitId: courseShells.academicUnitId,
      unitName: academicUnits.name,
      unitCode: academicUnits.code,
    })
    .from(courseShells)
    .innerJoin(academicUnits, eq(courseShells.academicUnitId, academicUnits.id))
    .where(eq(courseShells.id, shellId))
    .limit(1);

  if (!shell) return c.json({ error: 'NOT_FOUND', message: 'Course shell not found' }, 404);

  const sections = await db
    .select()
    .from(courseSections)
    .where(eq(courseSections.primaryShellId, shellId));

  return c.json({ data: { ...shell, sections } });
});

// ─── POST /courses ────────────────────────────────────────────────────────────
const createShellSchema = z.object({
  academicUnitId: z.string().uuid(),
  termId: z.string().uuid().optional(),
  courseCode: z.string().min(1).max(64),
  title: z.string().min(1).max(255),
  isSandbox: z.boolean().default(false),
  gradeSystem: z.enum(['weighted', 'points', 'formula']).default('weighted'),
  ungradedTreatment: z.enum(['drop_ungraded', 'treat_as_zero']).default('drop_ungraded'),
  appliedTemplateId: z.string().uuid().optional(),
});

router.post(
  '/',
  requireAuth,
  requireRole('Instructor', 'SystemAdmin'),
  zValidator('json', createShellSchema),
  async (c) => {
    const body = c.req.valid('json');

    const [shell] = await db
      .insert(courseShells)
      .values({
        academicUnitId: body.academicUnitId,
        termId: body.termId ?? null,
        courseCode: body.courseCode,
        title: body.title,
        isSandbox: body.isSandbox,
        gradeSystem: body.gradeSystem,
        ungradedTreatment: body.ungradedTreatment,
        appliedTemplateId: body.appliedTemplateId ?? null,
        isPublished: false,
      })
      .returning();

    return c.json({ data: shell }, 201);
  }
);

// ─── PATCH /courses/:shellId ──────────────────────────────────────────────────
const updateShellSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  isPublished: z.boolean().optional(),
  gradeSystem: z.enum(['weighted', 'points', 'formula']).optional(),
  ungradedTreatment: z.enum(['drop_ungraded', 'treat_as_zero']).optional(),
});

router.patch(
  '/:shellId',
  requireAuth,
  requireRole('Instructor', 'SystemAdmin'),
  zValidator('json', updateShellSchema),
  async (c) => {
    const shellId = c.req.param('shellId');
    if (!shellId) return c.json({ error: 'NOT_FOUND', message: 'Missing shellId' }, 404);
    const body = c.req.valid('json');

    const [updated] = await db
      .update(courseShells)
      .set(body)
      .where(eq(courseShells.id, shellId))
      .returning();

    if (!updated) return c.json({ error: 'NOT_FOUND', message: 'Course shell not found' }, 404);
    return c.json({ data: updated });
  }
);

// ─── GET /courses/:shellId/sections ──────────────────────────────────────────
router.get('/:shellId/sections', requireAuth, async (c) => {
  const shellId = c.req.param('shellId');
  if (!shellId) return c.json({ error: 'NOT_FOUND', message: 'Missing shellId' }, 404);

  const sections = await db
    .select()
    .from(courseSections)
    .where(eq(courseSections.primaryShellId, shellId));

  return c.json({ data: sections });
});

// ─── POST /courses/:shellId/sections ─────────────────────────────────────────
const createSectionSchema = z.object({
  sisSectionId: z.string().min(1).max(64),
  sectionCode: z.string().min(1).max(64),
});

router.post(
  '/:shellId/sections',
  requireAuth,
  requireRole('Instructor', 'SystemAdmin'),
  zValidator('json', createSectionSchema),
  async (c) => {
    const shellId = c.req.param('shellId');
    if (!shellId) return c.json({ error: 'NOT_FOUND', message: 'Missing shellId' }, 404);
    const body = c.req.valid('json');

    const [section] = await db
      .insert(courseSections)
      .values({
        sisSectionId: body.sisSectionId,
        primaryShellId: shellId,
        originalShellId: shellId,
        sectionCode: body.sectionCode,
      })
      .returning();

    return c.json({ data: section }, 201);
  }
);

export { router as coursesRouter };
