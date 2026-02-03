import { defineConfig } from '@playwright/test';

const browserName = (process.env.BROWSER as 'chromium' | 'firefox' | 'webkit') || 'chromium';

export default defineConfig({
  testDir: './tests',
  timeout: 60 * 1000,
  expect: {
    timeout: 10000,
  },
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 4,
  reporter: [
    ['list'],
    [
      'html',
      {
        outputFolder: process.env.CI
          ? 'playwright-report'
          : `playwright-report/${new Date().toISOString().split('T')[0]}`,
        open: 'never',
      },
    ],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:4200',
    browserName,
    viewport: {
      width: 1280,
      height: 720,
    },
    screenshot: 'only-on-failure',
    trace: process.env.CI ? 'off' : 'on-first-retry',
    headless: true,
    actionTimeout: 15 * 1000,
    navigationTimeout: 30 * 1000,
  },
  projects: [
    {
      name: 'authenticated',
      testIgnore: /auth\.spec\.ts/,
    },
    {
      name: 'unauthenticated',
      testMatch: /auth\.spec\.ts/,
    },
  ],
});
