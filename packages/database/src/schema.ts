import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// 1. Enums
export const envDesignatorEnum = pgEnum("env_designator", [
  "dev",
  "reg",
  "prod",
]);
export const enrollmentRoleEnum = pgEnum("enrollment_role", [
  "Student",
  "Instructor",
  "TA",
  "Designer",
  "Auditor",
]);
export const enrollmentStatusEnum = pgEnum("enrollment_status", [
  "active",
  "dropped",
  "completed",
  "incomplete",
]);
export const gradeSystemEnum = pgEnum("grade_system", [
  "weighted",
  "points",
  "formula",
]);
export const ungradedTreatmentEnum = pgEnum("ungraded_treatment", [
  "drop_ungraded",
  "treat_as_zero",
]);
export const submissionRetentionEnum = pgEnum("submission_retention", [
  "keep_all",
  "keep_latest",
  "single_attempt",
]);

// 2. Institutional Hierarchy (IU lms-canvas-hierarchy-resource-manager pattern)
export const academicUnits = pgTable(
  "academic_units",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    parentId: uuid("parent_id"), // Self-referencing adjacency list
    code: varchar("code", { length: 64 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    hierarchyPath: text("hierarchy_path").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    codeIdx: uniqueIndex("idx_academic_units_code").on(table.code),
  }),
);

// 3. Academic Terms (UGA Athena 6-digit Term Code e.g. 202608)
export const academicTerms = pgTable(
  "academic_terms",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sisTermCode: varchar("sis_term_code", { length: 32 }).notNull(),
    name: varchar("name", { length: 128 }).notNull(),
    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    endDate: timestamp("end_date", { withTimezone: true }).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
  },
  (table) => ({
    sisTermCodeIdx: uniqueIndex("idx_sis_term_code").on(table.sisTermCode),
  }),
);

// 4. Users (Supports UGA OrgDefinedID + IU canvas_user_login_id)
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgDefinedId: varchar("org_defined_id", { length: 64 }).notNull(),
    loginId: varchar("login_id", { length: 128 }).notNull(),
    passwordHash: text("password_hash"),
    email: varchar("email", { length: 255 }).notNull(),
    firstName: varchar("first_name", { length: 128 }).notNull(),
    lastName: varchar("last_name", { length: 128 }).notNull(),
    pronunciationAudioUrl: text("pronunciation_audio_url"),
    officialPhotoUrl: text("official_photo_url"),
    isSystemAdmin: boolean("is_system_admin").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    orgDefinedIdIdx: uniqueIndex("idx_users_org_defined_id").on(
      table.orgDefinedId,
    ),
    loginIdIdx: uniqueIndex("idx_users_login_id").on(table.loginId),
  }),
);

// 5. IU 3-Table Granular Tool Permission Gate
export const authorizedUsers = pgTable(
  "authorized_users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    loginId: varchar("login_id", { length: 128 }).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    loginIdx: uniqueIndex("idx_authz_users_login").on(table.loginId),
  }),
);

export const authorizedToolPermissions = pgTable(
  "authorized_tool_permission",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    authorizedUserId: uuid("authorized_user_id")
      .references(() => authorizedUsers.id, { onDelete: "cascade" })
      .notNull(),
    permissionKey: varchar("permission_key", { length: 64 }).notNull(),
    grantedBy: uuid("granted_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userPermKeyIdx: uniqueIndex("idx_user_permission_key").on(
      table.authorizedUserId,
      table.permissionKey,
    ),
  }),
);

export const authorizedToolPermissionProperties = pgTable(
  "authorized_tool_permission_properties",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    permissionId: uuid("permission_id")
      .references(() => authorizedToolPermissions.id, { onDelete: "cascade" })
      .notNull(),
    propertyKey: varchar("property_key", { length: 128 }).notNull(),
    propertyValue: text("property_value").notNull(),
  },
);

// 6. IU Multi-Environment LTI 1.3 Registration Table (LTI_13_AUTHZ)
export const lti13Authz = pgTable(
  "lti_13_authz",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    registrationId: varchar("registration_id", { length: 128 }).notNull(),
    clientId: varchar("client_id", { length: 255 }).notNull(),
    clientSecretCiphertext: text("client_secret_ciphertext").notNull(),
    env: envDesignatorEnum("env").default("dev").notNull(),
    issuer: text("issuer").notNull(),
    oidcAuthUrl: text("oidc_auth_url").notNull(),
    jwksUri: text("jwks_uri").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
  },
  (table) => ({
    ltiRegEnvIdx: uniqueIndex("idx_lti_reg_env").on(
      table.registrationId,
      table.env,
    ),
  }),
);

// 7. Course Shells, Hierarchy Templates & Cross-Listed Sections
export const courseTemplates = pgTable("course_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  academicUnitId: uuid("academic_unit_id")
    .references(() => academicUnits.id, { onDelete: "cascade" })
    .notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  syllabusBoilerplateMarkdown: text("syllabus_boilerplate_markdown").notNull(),
  moduleStructureJson: jsonb("module_structure_json").notNull(),
  isDefaultForUnit: boolean("is_default_for_unit").default(false).notNull(),
});

export const courseShells = pgTable("course_shells", {
  id: uuid("id").defaultRandom().primaryKey(),
  academicUnitId: uuid("academic_unit_id")
    .references(() => academicUnits.id)
    .notNull(),
  termId: uuid("term_id").references(() => academicTerms.id),
  courseCode: varchar("course_code", { length: 64 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  isSandbox: boolean("is_sandbox").default(false).notNull(),
  isPublished: boolean("is_published").default(false).notNull(),
  gradeSystem: gradeSystemEnum("grade_system").default("weighted").notNull(),
  ungradedTreatment: ungradedTreatmentEnum("ungraded_treatment")
    .default("drop_ungraded")
    .notNull(),
  appliedTemplateId: uuid("applied_template_id").references(
    () => courseTemplates.id,
  ),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const courseSections = pgTable(
  "course_sections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sisSectionId: varchar("sis_section_id", { length: 64 }).notNull(),
    primaryShellId: uuid("primary_shell_id")
      .references(() => courseShells.id)
      .notNull(),
    originalShellId: uuid("original_shell_id")
      .references(() => courseShells.id)
      .notNull(),
    sectionCode: varchar("section_code", { length: 64 }).notNull(),
    crosslistedById: uuid("crosslisted_by_id").references(() => users.id),
    crosslistedAt: timestamp("crosslisted_at", { withTimezone: true }),
  },
  (table) => ({
    sisSectionIdIdx: uniqueIndex("idx_sis_section_id").on(table.sisSectionId),
  }),
);

export const enrollments = pgTable(
  "enrollments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sectionId: uuid("section_id")
      .references(() => courseSections.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    role: enrollmentRoleEnum("role").default("Student").notNull(),
    status: enrollmentStatusEnum("status").default("active").notNull(),
    isSisManaged: boolean("is_sis_managed").default(true).notNull(),
  },
  (table) => ({
    sectionUserIdx: uniqueIndex("idx_section_user_enrollment").on(
      table.sectionId,
      table.userId,
    ),
  }),
);

// 8. UGA eLC Weighted Gradebook & Athena Final Grade Accumulators
export const gradeCategories = pgTable("grade_categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  shellId: uuid("shell_id")
    .references(() => courseShells.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  weightPercent: numeric("weight_percent", {
    precision: 5,
    scale: 2,
  }).notNull(),
  dropLowestCount: integer("drop_lowest_count").default(0).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
});

export const gradeItems = pgTable("grade_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  shellId: uuid("shell_id")
    .references(() => courseShells.id, { onDelete: "cascade" })
    .notNull(),
  categoryId: uuid("category_id").references(() => gradeCategories.id, {
    onDelete: "set null",
  }),
  title: varchar("title", { length: 255 }).notNull(),
  maxPoints: numeric("max_points", { precision: 8, scale: 2 }).notNull(),
  itemWeightPercent: numeric("item_weight_percent", {
    precision: 5,
    scale: 2,
  }).notNull(),
  isBonus: boolean("is_bonus").default(false).notNull(),
  dueDate: timestamp("due_date", { withTimezone: true }),
});

export const gradeEntries = pgTable(
  "grade_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    gradeItemId: uuid("grade_item_id")
      .references(() => gradeItems.id, { onDelete: "cascade" })
      .notNull(),
    studentId: uuid("student_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    pointsEarned: numeric("points_earned", { precision: 8, scale: 2 }),
    isExempt: boolean("is_exempt").default(false).notNull(),
    publicFeedback: text("public_feedback"),
    privateGraderComments: text("private_grader_comments"),
    updatedById: uuid("updated_by_id").references(() => users.id),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    gradeItemStudentIdx: uniqueIndex("idx_grade_item_student").on(
      table.gradeItemId,
      table.studentId,
    ),
  }),
);

// Stores UGA's Calculated vs. Adjusted Final Grade for Athena SIS Export
export const finalCourseGrades = pgTable(
  "final_course_grades",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    shellId: uuid("shell_id")
      .references(() => courseShells.id, { onDelete: "cascade" })
      .notNull(),
    studentId: uuid("student_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    calculatedNumeric: numeric("calculated_numeric", {
      precision: 6,
      scale: 2,
    }).notNull(),
    adjustedNumeric: numeric("adjusted_numeric", { precision: 6, scale: 2 }),
    letterGradeScheme: varchar("letter_grade_scheme", { length: 8 }).notNull(),
    isReleasedToStudent: boolean("is_released_to_student")
      .default(false)
      .notNull(),
    postedToSisAt: timestamp("posted_to_sis_at", { withTimezone: true }),
  },
  (table) => ({
    finalGradeShellStudentIdx: uniqueIndex("idx_final_grade_shell_student").on(
      table.shellId,
      table.studentId,
    ),
  }),
);

// 9. UGA Latched Release Conditions Engine
export const releaseConditions = pgTable("release_conditions", {
  id: uuid("id").defaultRandom().primaryKey(),
  shellId: uuid("shell_id")
    .references(() => courseShells.id, { onDelete: "cascade" })
    .notNull(),
  targetResourceType: varchar("target_resource_type", { length: 64 }).notNull(),
  targetResourceId: uuid("target_resource_id").notNull(),
  conditionDomain: varchar("condition_domain", { length: 64 }).notNull(),
  sourceEntityId: uuid("source_entity_id").notNull(),
  operator: varchar("operator", { length: 16 }).notNull(),
  thresholdValue: numeric("threshold_value", { precision: 6, scale: 2 }),
});

// Latches once satisfied — never revoked (UGA invariant)
export const releaseConditionLatches = pgTable(
  "release_condition_latches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conditionId: uuid("condition_id")
      .references(() => releaseConditions.id, { onDelete: "cascade" })
      .notNull(),
    studentId: uuid("student_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    satisfiedAt: timestamp("satisfied_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    conditionStudentLatchIdx: uniqueIndex("idx_condition_student_latch").on(
      table.conditionId,
      table.studentId,
    ),
  }),
);

// Type exports
export type AcademicUnit = typeof academicUnits.$inferSelect;
export type AcademicTerm = typeof academicTerms.$inferSelect;
export type User = typeof users.$inferSelect;
export type AuthorizedUser = typeof authorizedUsers.$inferSelect;
export type AuthorizedToolPermission =
  typeof authorizedToolPermissions.$inferSelect;
export type AuthorizedToolPermissionProperty =
  typeof authorizedToolPermissionProperties.$inferSelect;
export type Lti13Authz = typeof lti13Authz.$inferSelect;
export type CourseTemplate = typeof courseTemplates.$inferSelect;
export type CourseShell = typeof courseShells.$inferSelect;
export type CourseSection = typeof courseSections.$inferSelect;
export type Enrollment = typeof enrollments.$inferSelect;
export type GradeCategory = typeof gradeCategories.$inferSelect;
export type GradeItem = typeof gradeItems.$inferSelect;
export type GradeEntry = typeof gradeEntries.$inferSelect;
export type FinalCourseGrade = typeof finalCourseGrades.$inferSelect;
export type ReleaseCondition = typeof releaseConditions.$inferSelect;
export type ReleaseConditionLatch = typeof releaseConditionLatches.$inferSelect;
