import { db } from "@atlas-lms/database";
import {
  academicUnits,
  academicTerms,
  users,
  courseShells,
  courseSections,
  enrollments,
} from "@atlas-lms/database/schema";
import { eq } from "drizzle-orm";
import { randomBytes, scryptSync } from "node:crypto";

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function seed() {
  console.log("Seeding database...");

  // 1. Academic Units (IU hierarchy pattern)
  const [mathUnit] = await db
    .insert(academicUnits)
    .values({
      code: "MATH",
      name: "School of Mathematical Sciences",
      hierarchyPath: "/MATH",
    })
    .returning();

  const [csUnit] = await db
    .insert(academicUnits)
    .values({
      code: "CS",
      name: "School of Computing and Information Technology",
      hierarchyPath: "/CS",
      parentId: mathUnit.id,
    })
    .returning();

  // 2. Academic Terms (Athena 6-digit term codes)
  const [fall2026] = await db
    .insert(academicTerms)
    .values({
      sisTermCode: "202608",
      name: "Harmattan 2026",
      startDate: new Date("2026-09-01"),
      endDate: new Date("2026-12-20"),
      isActive: true,
    })
    .returning();

  const [spring2027] = await db
    .insert(academicTerms)
    .values({
      sisTermCode: "202702",
      name: "Rain 2027",
      startDate: new Date("2027-01-15"),
      endDate: new Date("2027-05-10"),
      isActive: true,
    })
    .returning();

  // 3. Sample Users (Instructor + Students)
  const [instructor] = await db
    .insert(users)
    .values({
      orgDefinedId: "OAU\\\\INSTR001",
      loginId: "instructor1",
      passwordHash: hashPassword("instructor1"),
      email: "instructor@oau.edu.ng",
      firstName: "Prof.",
      lastName: "Okafor",
      isSystemAdmin: false,
    })
    .returning();

  const [student1] = await db
    .insert(users)
    .values({
      orgDefinedId: "OAU\\\\STUD001",
      loginId: "student1",
      passwordHash: hashPassword("student1"),
      email: "student1@oau.edu.ng",
      firstName: "Chioma",
      lastName: "Okonkwo",
      isSystemAdmin: false,
    })
    .returning();

  const [student2] = await db
    .insert(users)
    .values({
      orgDefinedId: "OAU\\\\STUD002",
      loginId: "student2",
      passwordHash: hashPassword("student2"),
      email: "student2@oau.edu.ng",
      firstName: "Abdul",
      lastName: "Salami",
      isSystemAdmin: false,
    })
    .returning();

  // 4. Course Shells (2 courses, one per term)
  const [course1] = await db
    .insert(courseShells)
    .values({
      academicUnitId: csUnit.id,
      termId: fall2026.id,
      courseCode: "CS101",
      title: "Introduction to Computer Science",
      isSandbox: false,
      isPublished: true,
      gradeSystem: "weighted",
      ungradedTreatment: "drop_ungraded",
    })
    .returning();

  const [course2] = await db
    .insert(courseShells)
    .values({
      academicUnitId: mathUnit.id,
      termId: spring2027.id,
      courseCode: "MTH201",
      title: "Linear Algebra",
      isSandbox: false,
      isPublished: true,
      gradeSystem: "weighted",
      ungradedTreatment: "drop_ungraded",
    })
    .returning();

  // 5. Course Sections (each course has 2 sections)
  const [section1] = await db
    .insert(courseSections)
    .values({
      sisSectionId: "CS101-001",
      primaryShellId: course1.id,
      originalShellId: course1.id,
      sectionCode: "001",
    })
    .returning();

  const [section2] = await db
    .insert(courseSections)
    .values({
      sisSectionId: "CS101-002",
      primaryShellId: course1.id,
      originalShellId: course1.id,
      sectionCode: "002",
    })
    .returning();

  const [section3] = await db
    .insert(courseSections)
    .values({
      sisSectionId: "MTH201-001",
      primaryShellId: course2.id,
      originalShellId: course2.id,
      sectionCode: "001",
    })
    .returning();

  const [section4] = await db
    .insert(courseSections)
    .values({
      sisSectionId: "MTH201-002",
      primaryShellId: course2.id,
      originalShellId: course2.id,
      sectionCode: "002",
    })
    .returning();

  // 6. Enrollments (students enrolled in sections)
  await db.insert(enrollments).values({
    sectionId: section1.id,
    userId: student1.id,
    role: "Student",
    status: "active",
    isSisManaged: true,
  });

  await db.insert(enrollments).values({
    sectionId: section2.id,
    userId: student2.id,
    role: "Student",
    status: "active",
    isSisManaged: true,
  });

  await db.insert(enrollments).values({
    sectionId: section3.id,
    userId: student1.id,
    role: "Student",
    status: "active",
    isSisManaged: true,
  });

  await db.insert(enrollments).values({
    sectionId: section4.id,
    userId: student2.id,
    role: "Student",
    status: "active",
    isSisManaged: true,
  });

  // Also enroll the instructor in both courses
  await db.insert(enrollments).values({
    sectionId: section1.id,
    userId: instructor.id,
    role: "Instructor",
    status: "active",
    isSisManaged: false,
  });

  await db.insert(enrollments).values({
    sectionId: section3.id,
    userId: instructor.id,
    role: "Instructor",
    status: "active",
    isSisManaged: false,
  });

  console.log("✅ Database seeded successfully!");
  console.log("   - 2 academic units (Math, CS)");
  console.log("   - 2 academic terms (202608, 202702)");
  console.log("   - 1 instructor, 2 students");
  console.log("   - 2 course shells with 2 sections each");
  console.log("   - 8 enrollment records");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  });
