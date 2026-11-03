import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

// Create the connection pool
const connectionString = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/atlas_lms';

// Disable prefetch for better compatibility with serverless
export const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });

// Export all schema tables and types
export {
  // Enums
  envDesignatorEnum,
  enrollmentRoleEnum,
  enrollmentStatusEnum,
  gradeSystemEnum,
  ungradedTreatmentEnum,
  submissionRetentionEnum,

  // Tables
  academicUnits,
  academicTerms,
  users,
  authorizedUsers,
  authorizedToolPermissions,
  authorizedToolPermissionProperties,
  lti13Authz,
  courseTemplates,
  courseShells,
  courseSections,
  enrollments,
  gradeCategories,
  gradeItems,
  gradeEntries,
  finalCourseGrades,
  releaseConditions,
  releaseConditionLatches,

  // Types
  type AcademicUnit,
  type AcademicTerm,
  type User,
  type AuthorizedUser,
  type AuthorizedToolPermission,
  type AuthorizedToolPermissionProperty,
  type Lti13Authz,
  type CourseTemplate,
  type CourseShell,
  type CourseSection,
  type Enrollment,
  type GradeCategory,
  type GradeItem,
  type GradeEntry,
  type FinalCourseGrade,
  type ReleaseCondition,
  type ReleaseConditionLatch,
} from './schema';

export { schema };