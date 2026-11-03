import type { Context } from 'hono';
import type { StatusCode } from 'hono/utils/http-status';

/**
 * Global error handler — registered on the Hono app via app.onError().
 * Produces a consistent JSON error envelope and avoids leaking stack traces
 * to clients in production.
 */
export function globalErrorHandler(err: Error, c: Context) {
  const isProd = process.env['NODE_ENV'] === 'production';

  console.error(`[${new Date().toISOString()}] Unhandled error:`, err);

  // Map well-known error names / messages to HTTP status codes
  let status: StatusCode = 500;
  let code = 'INTERNAL_SERVER_ERROR';

  const msg = err.message.toLowerCase();

  if (msg.includes('not found')) {
    status = 404;
    code = 'NOT_FOUND';
  } else if (
    msg.includes('unauthorized') ||
    msg.includes('invalid token') ||
    msg.includes('expired')
  ) {
    status = 401;
    code = 'UNAUTHORIZED';
  } else if (
    msg.includes('forbidden') ||
    msg.includes('permission') ||
    msg.includes('lacks')
  ) {
    status = 403;
    code = 'FORBIDDEN';
  } else if (
    msg.includes('already exists') ||
    msg.includes('duplicate') ||
    msg.includes('conflict')
  ) {
    status = 409;
    code = 'CONFLICT';
  } else if (
    msg.includes('validation') ||
    msg.includes('invalid') ||
    msg.includes('required')
  ) {
    status = 422;
    code = 'VALIDATION_ERROR';
  }

  return c.json(
    {
      error: code,
      message: isProd && status === 500 ? 'An unexpected error occurred' : err.message,
      ...(isProd ? {} : { stack: err.stack }),
    },
    status
  );
}

/**
 * 404 handler — registered on the Hono app via app.notFound().
 */
export function notFoundHandler(c: Context) {
  return c.json(
    {
      error: 'NOT_FOUND',
      message: `Route ${c.req.method} ${c.req.path} not found`,
    },
    404
  );
}
