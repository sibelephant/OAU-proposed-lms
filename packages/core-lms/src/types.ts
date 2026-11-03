import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '@atlas-lms/database/schema';

export type DrizzleDb = PostgresJsDatabase<typeof schema>;