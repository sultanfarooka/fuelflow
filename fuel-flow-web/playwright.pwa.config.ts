import { defineConfig, devices } from '@playwright/test';

/**
 * M07-F08 — PWA e2e config.
 *
 * The service worker + manifest only exist in a production build (the dev server
 * runs with `devOptions.enabled: false`), so this config builds the app and
 * serves it with `vite preview` instead of `vite dev`. No backend is started —
 * the PWA specs (manifest, offline shell, offline banner) drive connectivity
 * with `context.setOffline()` and never call the API.
 *
 * Run: `npx playwright test --config=playwright.pwa.config.ts`
 */
export default defineConfig({
  testDir: './e2e-tests',
  testMatch: /M07-F08\.spec\.ts/,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'line',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
