import { test, expect } from '@playwright/test';

/**
 * M07-F08 — Progressive Web App (PWA).
 *
 * Runs against a production build served by `vite preview` (see
 * playwright.pwa.config.ts) because the service worker + manifest are only
 * emitted by `vite build`. No backend is required — the public landing page (`/`)
 * makes no API calls, and connectivity is driven with `context.setOffline()`.
 */

test('M07_F08_R02_ManifestInstallable', async ({ page, baseURL }) => {
  await page.goto('/');

  // Manifest link + theme-color are injected into the document head.
  const manifestHref = await page.getAttribute('link[rel="manifest"]', 'href');
  expect(manifestHref).toBeTruthy();
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
    'content',
    '#ca3500',
  );

  // The manifest itself satisfies the installability bar.
  const res = await page.request.get(new URL(manifestHref!, baseURL).toString());
  expect(res.ok()).toBeTruthy();
  const manifest = await res.json();

  expect(manifest.name).toBe('Fuel Flow');
  expect(manifest.display).toBe('standalone');
  expect(manifest.theme_color).toBe('#ca3500');

  const sizes: string[] = manifest.icons.map((i: { sizes: string }) => i.sizes);
  expect(sizes).toContain('192x192');
  expect(sizes).toContain('512x512');
  expect(
    manifest.icons.some((i: { purpose?: string }) => i.purpose === 'maskable'),
  ).toBeTruthy();
});

test('M07_F08_R01_OfflineShellLaunch', async ({ page, context }) => {
  await page.goto('/');

  // Wait for the service worker to activate and take control of the page so the
  // app shell is precached and served on the next (offline) navigation.
  await page.waitForFunction(() => !!navigator.serviceWorker?.controller, null, {
    timeout: 20_000,
  });

  // Go offline and reload — the precached shell must still boot (no browser
  // "you're offline" error page).
  await context.setOffline(true);
  await page.reload();

  await expect(page).toHaveTitle('Fuel Flow');
  await expect(page.locator('#root')).not.toBeEmpty();

  await context.setOffline(false);
});

test('M07_F08_R03_OfflineBanner', async ({ page, context }) => {
  await page.goto('/');

  // Online: no banner.
  await expect(page.getByRole('status')).toHaveCount(0);

  // Offline: the global retry banner appears with a Retry action.
  await context.setOffline(true);
  const banner = page.getByRole('status');
  await expect(banner).toBeVisible();
  await expect(banner).toContainText(/offline/i);
  await expect(banner.getByRole('button', { name: /retry/i })).toBeVisible();

  // Back online: the banner auto-dismisses.
  await context.setOffline(false);
  await expect(page.getByRole('status')).toHaveCount(0);
});
