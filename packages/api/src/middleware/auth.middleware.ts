import type { Context, Next } from 'hono';
import { createMiddleware } from 'hono/factory';
import { JwtService } from '@atlas-lms/auth';
import type { AtlasJwtPayload } from '@atlas-lms/auth';

// Extend Hono's context variable map so downstream handlers are fully typed
declare module 'hono' {
  interface ContextVariableMap {
    session: AtlasJwtPayload;
  }
}

const jwtService = new JwtService();

/**
 * requireAuth — verifies the Bearer token in Authorization header and stores
 * the decoded payload as c.var.session for downstream handlers.
 */
export const requireAuth = createMiddleware(async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized', message: 'Missing Bearer token' }, 401);
  }

  const token = authHeader.slice(7);
  try {
    const { payload } = await jwtService.verify(token);
    c.set('session', payload);
    await next();
  } catch {
    return c.json({ error: 'Unauthorized', message: 'Invalid or expired token' }, 401);
  }
});

/**
 * requireRole — gates a route to users with one of the allowed roles.
 * Must be used after requireAuth.
 */
export const requireRole = (...allowedRoles: AtlasJwtPayload['role'][]) =>
  createMiddleware(async (c: Context, next: Next) => {
    const session = c.get('session');
    if (!session) {
      return c.json({ error: 'Unauthorized', message: 'No session' }, 401);
    }
    if (!allowedRoles.includes(session.role)) {
      return c.json(
        {
          error: 'Forbidden',
          message: `Role '${session.role}' is not permitted. Required: ${allowedRoles.join(' | ')}`,
        },
        403
      );
    }
    await next();
  });

/**
 * requireSystemAdmin — shorthand for SystemAdmin-only routes.
 */
export const requireSystemAdmin = requireRole('SystemAdmin');
