import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { coursesRouter } from './router/courses.router';
import { enrollmentsRouter } from './router/enrollments.router';
import { gradebookRouter } from './router/gradebook.router';
import { crosslistRouter } from './router/crosslist.router';
import { ltiRouter } from './router/lti.router';
import { authRouter } from './router/auth.router';
import { globalErrorHandler, notFoundHandler } from './middleware/error.middleware';

export const app = new Hono();

// ─── Global middleware ────────────────────────────────────────────────────────
app.use('*', logger());
app.use('*', secureHeaders());
app.use(
  '*',
  cors({
    origin: process.env['CORS_ORIGIN'] ?? '*',
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Disposition'],
    credentials: true,
    maxAge: 86400,
  })
);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (c) =>
  c.json({
    status: 'ok',
    service: 'atlas-lms-api',
    timestamp: new Date().toISOString(),
    version: process.env['npm_package_version'] ?? '0.1.0',
  })
);

// ─── API routes ───────────────────────────────────────────────────────────────
app.route('/api/v1/courses', coursesRouter);
app.route('/api/v1/enrollments', enrollmentsRouter);
app.route('/api/v1/gradebook', gradebookRouter);
app.route('/api/v1/crosslist', crosslistRouter);
app.route('/api/v1/auth', authRouter);
app.route('/lti', ltiRouter);

// ─── Error handling ───────────────────────────────────────────────────────────
app.onError(globalErrorHandler);
app.notFound(notFoundHandler);
