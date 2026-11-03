import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@atlas-lms/database";
import { enrollments, users } from "@atlas-lms/database/schema";
import { JwtService, verifyPassword } from "@atlas-lms/auth";

const router = new Hono();
const jwtService = new JwtService();

const loginSchema = z.object({
  loginId: z.string().min(1),
  password: z.string().min(1),
});

router.post("/login", zValidator("json", loginSchema), async (c) => {
  const { loginId, password } = c.req.valid("json");
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.loginId, loginId))
    .limit(1);

  if (!user?.passwordHash || !verifyPassword(password, user.passwordHash)) {
    return c.json(
      { error: "Unauthorized", message: "Invalid credentials" },
      401,
    );
  }

  const [enrollment] = await db
    .select({ role: enrollments.role })
    .from(enrollments)
    .where(eq(enrollments.userId, user.id))
    .limit(1);
  const role = user.isSystemAdmin
    ? "SystemAdmin"
    : (enrollment?.role ?? "Student");

  const token = await jwtService.signAccessToken({
    sub: user.id,
    orgDefinedId: user.orgDefinedId,
    loginId: user.loginId,
    role,
  });

  return c.json({
    data: {
      token,
      user: {
        id: user.id,
        loginId: user.loginId,
        firstName: user.firstName,
        lastName: user.lastName,
        role,
      },
    },
  });
});

export { router as authRouter };
