DO $$ BEGIN
 CREATE TYPE "public"."enrollment_role" AS ENUM('Student', 'Instructor', 'TA', 'Designer', 'Auditor');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."enrollment_status" AS ENUM('active', 'dropped', 'completed', 'incomplete');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."env_designator" AS ENUM('dev', 'reg', 'prod');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."grade_system" AS ENUM('weighted', 'points', 'formula');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."submission_retention" AS ENUM('keep_all', 'keep_latest', 'single_attempt');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."ungraded_treatment" AS ENUM('drop_ungraded', 'treat_as_zero');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "academic_terms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sis_term_code" varchar(32) NOT NULL,
	"name" varchar(128) NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "academic_units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_id" uuid,
	"code" varchar(64) NOT NULL,
	"name" varchar(255) NOT NULL,
	"hierarchy_path" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "authorized_tool_permission_properties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"permission_id" uuid NOT NULL,
	"property_key" varchar(128) NOT NULL,
	"property_value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "authorized_tool_permission" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"authorized_user_id" uuid NOT NULL,
	"permission_key" varchar(64) NOT NULL,
	"granted_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "authorized_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"login_id" varchar(128) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "course_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sis_section_id" varchar(64) NOT NULL,
	"primary_shell_id" uuid NOT NULL,
	"original_shell_id" uuid NOT NULL,
	"section_code" varchar(64) NOT NULL,
	"crosslisted_by_id" uuid,
	"crosslisted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "course_shells" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"academic_unit_id" uuid NOT NULL,
	"term_id" uuid,
	"course_code" varchar(64) NOT NULL,
	"title" varchar(255) NOT NULL,
	"is_sandbox" boolean DEFAULT false NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"grade_system" "grade_system" DEFAULT 'weighted' NOT NULL,
	"ungraded_treatment" "ungraded_treatment" DEFAULT 'drop_ungraded' NOT NULL,
	"applied_template_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "course_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"academic_unit_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"syllabus_boilerplate_markdown" text NOT NULL,
	"module_structure_json" jsonb NOT NULL,
	"is_default_for_unit" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "enrollment_role" DEFAULT 'Student' NOT NULL,
	"status" "enrollment_status" DEFAULT 'active' NOT NULL,
	"is_sis_managed" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "final_course_grades" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shell_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"calculated_numeric" numeric(6, 2) NOT NULL,
	"adjusted_numeric" numeric(6, 2),
	"letter_grade_scheme" varchar(8) NOT NULL,
	"is_released_to_student" boolean DEFAULT false NOT NULL,
	"posted_to_sis_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "grade_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shell_id" uuid NOT NULL,
	"name" varchar(128) NOT NULL,
	"weight_percent" numeric(5, 2) NOT NULL,
	"drop_lowest_count" integer DEFAULT 0 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "grade_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"grade_item_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"points_earned" numeric(8, 2),
	"is_exempt" boolean DEFAULT false NOT NULL,
	"public_feedback" text,
	"private_grader_comments" text,
	"updated_by_id" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "grade_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shell_id" uuid NOT NULL,
	"category_id" uuid,
	"title" varchar(255) NOT NULL,
	"max_points" numeric(8, 2) NOT NULL,
	"item_weight_percent" numeric(5, 2) NOT NULL,
	"is_bonus" boolean DEFAULT false NOT NULL,
	"due_date" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lti_13_authz" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"registration_id" varchar(128) NOT NULL,
	"client_id" varchar(255) NOT NULL,
	"client_secret_ciphertext" text NOT NULL,
	"env" "env_designator" DEFAULT 'dev' NOT NULL,
	"issuer" text NOT NULL,
	"oidc_auth_url" text NOT NULL,
	"jwks_uri" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "release_condition_latches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"condition_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"satisfied_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "release_conditions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shell_id" uuid NOT NULL,
	"target_resource_type" varchar(64) NOT NULL,
	"target_resource_id" uuid NOT NULL,
	"condition_domain" varchar(64) NOT NULL,
	"source_entity_id" uuid NOT NULL,
	"operator" varchar(16) NOT NULL,
	"threshold_value" numeric(6, 2)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_defined_id" varchar(64) NOT NULL,
	"login_id" varchar(128) NOT NULL,
	"password_hash" text,
	"email" varchar(255) NOT NULL,
	"first_name" varchar(128) NOT NULL,
	"last_name" varchar(128) NOT NULL,
	"pronunciation_audio_url" text,
	"official_photo_url" text,
	"is_system_admin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "authorized_tool_permission_properties" ADD CONSTRAINT "authorized_tool_permission_properties_permission_id_authorized_tool_permission_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."authorized_tool_permission"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "authorized_tool_permission" ADD CONSTRAINT "authorized_tool_permission_authorized_user_id_authorized_users_id_fk" FOREIGN KEY ("authorized_user_id") REFERENCES "public"."authorized_users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "authorized_tool_permission" ADD CONSTRAINT "authorized_tool_permission_granted_by_users_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "authorized_users" ADD CONSTRAINT "authorized_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_sections" ADD CONSTRAINT "course_sections_primary_shell_id_course_shells_id_fk" FOREIGN KEY ("primary_shell_id") REFERENCES "public"."course_shells"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_sections" ADD CONSTRAINT "course_sections_original_shell_id_course_shells_id_fk" FOREIGN KEY ("original_shell_id") REFERENCES "public"."course_shells"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_sections" ADD CONSTRAINT "course_sections_crosslisted_by_id_users_id_fk" FOREIGN KEY ("crosslisted_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_shells" ADD CONSTRAINT "course_shells_academic_unit_id_academic_units_id_fk" FOREIGN KEY ("academic_unit_id") REFERENCES "public"."academic_units"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_shells" ADD CONSTRAINT "course_shells_term_id_academic_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."academic_terms"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_shells" ADD CONSTRAINT "course_shells_applied_template_id_course_templates_id_fk" FOREIGN KEY ("applied_template_id") REFERENCES "public"."course_templates"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_templates" ADD CONSTRAINT "course_templates_academic_unit_id_academic_units_id_fk" FOREIGN KEY ("academic_unit_id") REFERENCES "public"."academic_units"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_section_id_course_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."course_sections"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "final_course_grades" ADD CONSTRAINT "final_course_grades_shell_id_course_shells_id_fk" FOREIGN KEY ("shell_id") REFERENCES "public"."course_shells"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "final_course_grades" ADD CONSTRAINT "final_course_grades_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "grade_categories" ADD CONSTRAINT "grade_categories_shell_id_course_shells_id_fk" FOREIGN KEY ("shell_id") REFERENCES "public"."course_shells"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "grade_entries" ADD CONSTRAINT "grade_entries_grade_item_id_grade_items_id_fk" FOREIGN KEY ("grade_item_id") REFERENCES "public"."grade_items"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "grade_entries" ADD CONSTRAINT "grade_entries_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "grade_entries" ADD CONSTRAINT "grade_entries_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "grade_items" ADD CONSTRAINT "grade_items_shell_id_course_shells_id_fk" FOREIGN KEY ("shell_id") REFERENCES "public"."course_shells"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "grade_items" ADD CONSTRAINT "grade_items_category_id_grade_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."grade_categories"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "release_condition_latches" ADD CONSTRAINT "release_condition_latches_condition_id_release_conditions_id_fk" FOREIGN KEY ("condition_id") REFERENCES "public"."release_conditions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "release_condition_latches" ADD CONSTRAINT "release_condition_latches_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "release_conditions" ADD CONSTRAINT "release_conditions_shell_id_course_shells_id_fk" FOREIGN KEY ("shell_id") REFERENCES "public"."course_shells"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_sis_term_code" ON "academic_terms" USING btree ("sis_term_code");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_academic_units_code" ON "academic_units" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_user_permission_key" ON "authorized_tool_permission" USING btree ("authorized_user_id","permission_key");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_authz_users_login" ON "authorized_users" USING btree ("login_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_sis_section_id" ON "course_sections" USING btree ("sis_section_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_section_user_enrollment" ON "enrollments" USING btree ("section_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_final_grade_shell_student" ON "final_course_grades" USING btree ("shell_id","student_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_grade_item_student" ON "grade_entries" USING btree ("grade_item_id","student_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_lti_reg_env" ON "lti_13_authz" USING btree ("registration_id","env");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_condition_student_latch" ON "release_condition_latches" USING btree ("condition_id","student_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_users_org_defined_id" ON "users" USING btree ("org_defined_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_users_login_id" ON "users" USING btree ("login_id");