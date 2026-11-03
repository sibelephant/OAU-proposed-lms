import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:5173';

test.describe('AtlasLMS Gradebook & Enrollment', () => {
  test('gradebook calculate endpoint responds', async ({ request }) => {
    const response = await request.get('/api/v1/gradebook/calculate?shellId=test');
    // Should return 200 or 401/404, not 500
    expect([200, 401, 404]).toContain(response.status());
  });

  test('enrollment endpoints respond', async ({ request }) => {
    // Test getting section enrollments
    const response = await request.get('/api/v1/enrollments/sections/test-section');
    expect([200, 401, 404]).toContain(response.status());

    // Test user enrollments
    const response2 = await request.get('/api/v1/enrollments/users/test-user');
    expect([200, 401, 404]).toContain(response2.status());
  });

  test('crosslist endpoints respond', async ({ request }) => {
    const response = await request.post('/api/v1/crosslist', {
      data: { childSectionId: 'test-section', targetPrimaryShellId: 'test-shell' },
    });
    expect([200, 401, 404, 422]).toContain(response.status());
  });
});