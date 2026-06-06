import { test, expect, Page } from '@playwright/test';

const STATION_ID = 'cccccccc-0000-0000-0000-000000000001';

async function injectOwnerAuth(page: Page) {
  await page.evaluate(() => {
    localStorage.setItem('auth-storage', JSON.stringify({
      state: {
        isAuthenticated: true,
        expiresIn: 86400,
        devBypassActive: false,
        user: { id: 'aaaaaaaa-0000-0000-0000-000000000001', email: 'owner@test.com', fullName: 'Ali Khan', roles: ['Owner'] },
        organization: { id: 'bbbbbbbb-0000-0000-0000-000000000001', name: 'Khan Petroleum' },
        stations: [
          { id: 'cccccccc-0000-0000-0000-000000000001', name: 'Station Alpha', isSetupComplete: true, acceptedPaymentMethods: ['Cash'] },
          { id: 'cccccccc-0000-0000-0000-000000000002', name: 'Station Beta', isSetupComplete: true, acceptedPaymentMethods: ['Cash'] },
          { id: 'cccccccc-0000-0000-0000-000000000003', name: 'Station Gamma', isSetupComplete: true, acceptedPaymentMethods: ['Cash'] },
        ],
        subscription: { status: 'trial', planId: '11111111-1111-1111-1111-111111111102', planName: 'Professional', endsAt: '2026-07-06T00:00:00Z' },
      },
      version: 0,
    }));
    localStorage.removeItem('fuel-flow-ui');
  });
}

async function injectNozzlemanAuth(page: Page) {
  await page.evaluate(() => {
    localStorage.setItem('auth-storage', JSON.stringify({
      state: {
        isAuthenticated: true,
        expiresIn: 86400,
        devBypassActive: false,
        user: { id: 'aaaaaaaa-0000-0000-0000-000000000002', email: 'nozzleman@test.com', fullName: 'Hamza Nozzle', roles: ['Nozzleman'] },
        organization: { id: 'bbbbbbbb-0000-0000-0000-000000000001', name: 'Khan Petroleum' },
        stations: [
          { id: 'cccccccc-0000-0000-0000-000000000001', name: 'Station Alpha', isSetupComplete: true, acceptedPaymentMethods: ['Cash'] },
        ],
        subscription: { status: 'active', planId: '11111111-1111-1111-1111-111111111102', planName: 'Professional' },
      },
      version: 0,
    }));
    localStorage.removeItem('fuel-flow-ui');
  });
}

test('M07_F07_R01_nozzleman_sees_only_shifts', async ({ page }) => {
  await page.goto('/');
  await injectNozzlemanAuth(page);
  await page.goto(`/dashboard/station/${STATION_ID}/shifts`);

  await expect(page.getByRole('link', { name: 'Shifts' })).toBeVisible();

  // Forbidden items must not appear
  await expect(page.getByRole('link', { name: 'Finance' })).not.toBeVisible();
  await expect(page.getByRole('link', { name: 'Reports' })).not.toBeVisible();
  await expect(page.getByRole('link', { name: 'Settings' })).not.toBeVisible();
  await expect(page.getByRole('link', { name: 'Inventory' })).not.toBeVisible();
});

test('M07_F07_R02_owner_station_switcher_lists_all_stations', async ({ page }) => {
  await page.goto('/');
  await injectOwnerAuth(page);
  await page.goto('/dashboard');

  // Open the station switcher
  await page.getByRole('button', { name: /All Stations/i }).click();

  // All 3 stations and the "All Stations" reset option must be listed
  await expect(page.getByRole('menuitem', { name: 'Station Alpha' })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: 'Station Beta' })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: 'Station Gamma' })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: 'All Stations' })).toBeVisible();
});

test('M07_F07_R04_sidebar_collapses_to_drawer_below_640px', async ({ page }) => {
  await page.goto('/');
  await injectNozzlemanAuth(page);
  await page.goto(`/dashboard/station/${STATION_ID}/shifts`);

  // At 600px: persistent sidebar hidden, hamburger visible
  await page.setViewportSize({ width: 600, height: 900 });
  const persistentSidebar = page.locator('[data-sidebar="sidebar"]').first();
  await expect(page.getByRole('button', { name: /Toggle Sidebar/i })).toBeVisible();

  // Hamburger opens drawer
  await page.getByRole('button', { name: /Toggle Sidebar/i }).click();
  await expect(page.getByRole('dialog', { name: /Sidebar/i })).toBeVisible();

  // At 1280px: persistent sidebar is in DOM
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(persistentSidebar).toBeAttached();
});
