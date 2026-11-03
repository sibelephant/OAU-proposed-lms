import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: 0,
  expect: {
    timeout: 5000,
  },
  // Run in Chrome for fastest feedback
  use: {
    browser: 'chromium',
    ...devices['Desktop Chrome'],
    baseURL: 'http://localhost:5173',
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
  },

  // Parallel test execution
  workers: process.env.CI ? 4 : undefined,

  // Reporter configuration
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report' }],
  ],

  // Shared test setup
  // projects: [
  //   {
  //     name: 'Chrome',
  //     use: { ...devices['Desktop Chrome'] },
  //   },
  // ],
});