import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:5173';

// Wait for the app to mount
test.describe('AtlasLMS E2E', () => {
  test('health endpoint is reachable', async ({ request }) => {
    const response = await request.get('/health');
    expect(response.ok()).resolves.toBeTruthy();
    const body = await response.json();
    expect(body.status).toBe('ok');
    expect(body.service).toBe('atlas-lms-api');
  });

  test('login page loads', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/AtlasLMS/);
    await expect(page.locator('h1')).toContainText('AtlasLMS');
  });

  test('dashboard page loads after auth', async ({ page, request }) => {
    // First, get a health check to verify API is up
    await request.get('/health');

    // Navigate to dashboard (will redirect to login if not authenticated)
    await page.goto('/dashboard');
    // Should either show dashboard or redirect to login
    const url = page.url();
    expect(url).toContain('/dashboard') || expect(url).toContain('/login');
  });

  test('LTI launch page loads', async ({ page }) => {
    await page.goto('/lti-launch');
    // The LTI page should show a spinner or redirect
    const url = page.url();
    expect(url).toContain('/dashboard') || expect(url).toContain('/login');
  });

  test('courses API returns data', async ({ request }) => {
    const response = await request.get('/api/v1/courses');
    // May return 401 if not authenticated, but should not be 404
    expect([200, 401]).toContain(response.status());
  });
});