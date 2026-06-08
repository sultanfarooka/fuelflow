import { test, expect, Page } from '@playwright/test';

const STATION_ID = 'cccccccc-0000-0000-0000-000000000001';

async function injectAuth(
  page: Page,
  roles: string[],
  planName: 'Starter' | 'Professional' = 'Professional',
) {
  await page.evaluate(
    ({ roles, planName, stationId }) => {
      localStorage.setItem(
        'auth-storage',
        JSON.stringify({
          state: {
            isAuthenticated: true,
            expiresIn: 86400,
            devBypassActive: false,
            user: {
              id: 'aaaaaaaa-0000-0000-0000-000000000001',
              email: 'owner@test.com',
              fullName: 'Ali Khan',
              roles,
            },
            organization: {
              id: 'bbbbbbbb-0000-0000-0000-000000000001',
              name: 'Khan Petroleum',
            },
            stations: [
              {
                id: stationId,
                name: 'Station Alpha',
                isSetupComplete: true,
                acceptedPaymentMethods: ['Cash'],
              },
            ],
            subscription: {
              status: 'active',
              planId: planName === 'Starter'
                ? '11111111-1111-1111-1111-111111111101'
                : '11111111-1111-1111-1111-111111111102',
              planName,
              endsAt: '2026-07-06T00:00:00Z',
            },
          },
          version: 0,
        }),
      );
    },
    { roles, planName, stationId: STATION_ID },
  );
}

// ── AC1 ────────────────────────────────────────────────────────────────────────
// Custom user sees Operations + Commercial + Reports groups; no Admin group.

test('M07_F10_AC1_custom_user_sees_correct_groups_no_admin', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Sidebar is a collapsed drawer on mobile; nav visibility is a desktop concern');
  await page.goto('/');
  await injectAuth(page, ['Custom']);
  await page.goto(`/dashboard/station/${STATION_ID}/shifts`);

  // Operations
  await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Shifts' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Nozzle Operations' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Fuel Inventory' })).toBeVisible();

  // Commercial
  await expect(page.getByRole('link', { name: 'Fuel Pricing' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Credit Customers' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Finance & Accounts' })).toBeVisible();

  // Reports
  await expect(page.getByRole('link', { name: 'Reports' })).toBeVisible();

  // Admin items must NOT appear for Custom users
  await expect(page.getByRole('link', { name: 'Users & Access' })).not.toBeVisible();
  await expect(page.getByRole('link', { name: 'Staff & Payroll' })).not.toBeVisible();
  await expect(page.getByRole('link', { name: 'Lubricants / Oil Shop' })).not.toBeVisible();

  // Settings must NOT appear for Custom users
  await expect(page.getByRole('link', { name: 'Settings' })).not.toBeVisible();
});

// ── AC2 ────────────────────────────────────────────────────────────────────────
// Manager sees Operations + Commercial + Reports + Settings; no Admin group.

test('M07_F10_AC2_manager_sees_no_admin_group', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Sidebar is a collapsed drawer on mobile; nav visibility is a desktop concern');
  await page.goto('/');
  await injectAuth(page, ['Manager']);
  await page.goto(`/dashboard/station/${STATION_ID}/nozzles`);

  // All four visible groups
  await expect(page.getByRole('link', { name: 'Shifts' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Nozzle Operations' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Fuel Pricing' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Reports' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Settings' })).toBeVisible();

  // Admin items must NOT appear for Manager
  await expect(page.getByRole('link', { name: 'Users & Access' })).not.toBeVisible();
  await expect(page.getByRole('link', { name: 'Staff & Payroll' })).not.toBeVisible();
  await expect(page.getByRole('link', { name: 'Lubricants / Oil Shop' })).not.toBeVisible();
});

// ── AC3 ────────────────────────────────────────────────────────────────────────
// Unbuilt module nav links render <UnderDevelopment /> — no 404.

test('M07_F10_AC3_nozzles_renders_under_development', async ({ page }) => {
  await page.goto('/');
  await injectAuth(page, ['Owner']);
  await page.goto(`/dashboard/station/${STATION_ID}/nozzles`);

  await expect(page.getByRole('heading', { name: 'Nozzle Operations', level: 1 })).toBeVisible();
  await expect(page.getByText('Under Development')).toBeVisible();
  await expect(page.getByText('This module is being built.')).toBeVisible();
});

test('M07_F10_AC3_credit_renders_under_development', async ({ page }) => {
  await page.goto('/');
  await injectAuth(page, ['Owner']);
  await page.goto(`/dashboard/station/${STATION_ID}/credit`);

  await expect(page.getByRole('heading', { name: 'Credit Customers', level: 1 })).toBeVisible();
  await expect(page.getByText('Under Development')).toBeVisible();
});

test('M07_F10_AC3_pricing_renders_under_development', async ({ page }) => {
  await page.goto('/');
  await injectAuth(page, ['Owner']);
  await page.goto(`/dashboard/station/${STATION_ID}/pricing`);

  await expect(page.getByRole('heading', { name: 'Fuel Pricing', level: 1 })).toBeVisible();
  await expect(page.getByText('Under Development')).toBeVisible();
});

// ── AC4 ────────────────────────────────────────────────────────────────────────
// Starter-plan Owner sees <UpgradePrompt /> on Staff & Payroll and Lubricants.

test('M07_F10_AC4_starter_owner_sees_upgrade_prompt_on_staff', async ({ page }) => {
  await page.goto('/');
  await injectAuth(page, ['Owner'], 'Starter');
  await page.goto(`/dashboard/station/${STATION_ID}/admin/staff`);

  await expect(page.getByRole('heading', { name: 'Staff & Payroll', level: 1 })).toBeVisible();
  await expect(page.getByText('Upgrade Required')).toBeVisible();
  await expect(page.getByText('Staff & Payroll requires the Professional plan.')).toBeVisible();

  const cta = page.getByRole('link', { name: 'Upgrade to Professional' });
  await expect(cta).toBeVisible();
  await expect(cta).toHaveAttribute('href', '/pricing');
});

test('M07_F10_AC4_starter_owner_sees_upgrade_prompt_on_lubricants', async ({ page }) => {
  await page.goto('/');
  await injectAuth(page, ['Owner'], 'Starter');
  await page.goto(`/dashboard/station/${STATION_ID}/admin/lubricants`);

  await expect(page.getByText('Upgrade Required')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Upgrade to Professional' })).toBeVisible();
});

// ── AC5 ────────────────────────────────────────────────────────────────────────
// Pro+-plan Owner sees <UnderDevelopment /> on Staff & Payroll (not UpgradePrompt).

test('M07_F10_AC5_pro_owner_sees_under_development_on_staff', async ({ page }) => {
  await page.goto('/');
  await injectAuth(page, ['Owner'], 'Professional');
  await page.goto(`/dashboard/station/${STATION_ID}/admin/staff`);

  await expect(page.getByRole('heading', { name: 'Staff & Payroll', level: 1 })).toBeVisible();
  await expect(page.getByText('Under Development')).toBeVisible();
  await expect(page.getByText('Upgrade Required')).not.toBeVisible();
});
