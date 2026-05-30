/**
 * M12-F02 — Onboarding Dev Bypass
 *
 * Verifies the four frontend acceptance criteria for the dev-bypass feature
 * by setting the Zustand `auth-storage` localStorage state directly. That
 * decouples the spec from the phone-OTP login flow (M01-F09), which is
 * still evolving, and exercises only the route-guard relaxation, banner,
 * and wizard skip-affordance behaviour M12-F02 actually delivers.
 *
 * AC1 + AC2 (production safety / dev API contract) are backend concerns —
 * verified via curl/Swagger smoke in Phase 2, not in this spec.
 *
 * Prereqs:
 * - `scripts/dev.ps1` running so both http://localhost:5173 (Vite) and
 *   http://localhost:5035 (.NET API) are reachable.
 * - Backend running in Development with `Features:OnboardingDevBypass=true`
 *   in user-secrets (the spec verifies the frontend; the backend value
 *   only matters for the AC1/AC2 backend smoke).
 *
 * Run: `npm run test:e2e -- M12-F02`
 */

import { test, expect, type Page } from "@playwright/test"

const BASE_URL = "http://localhost:5173"

/**
 * Seed the Zustand `auth-storage` localStorage key so the next page load
 * sees the simulated logged-in state. Mirrors the shape produced by
 * `setAuthState()` in [fuel-flow-web/src/stores/auth-store.ts].
 */
async function seedAuthState(
  page: Page,
  state: {
    devBypassActive: boolean
    isSetupComplete: boolean
  },
): Promise<void> {
  await page.addInitScript((s) => {
    window.localStorage.setItem(
      "auth-storage",
      JSON.stringify({
        state: {
          expiresIn: 3600,
          isAuthenticated: true,
          user: {
            id: "11111111-1111-1111-1111-111111111111",
            email: "test@fuelflow.test",
            phone: "+923001234567",
            fullName: "Test Owner",
            roles: ["owner"],
          },
          organization: { id: "22222222-2222-2222-2222-222222222222", name: "Test Org" },
          stations: [
            {
              id: "33333333-3333-3333-3333-333333333333",
              name: "Test Station",
              isSetupComplete: s.isSetupComplete,
              acceptedPaymentMethods: ["Cash"],
            },
          ],
          subscription: null,
          devBypassActive: s.devBypassActive,
        },
        version: 0,
      }),
    )
  }, state)
}

test.describe("M12-F02 — Onboarding Dev Bypass", () => {
  test("M12_F02_R02_DashboardRendersWhenBypassActiveAndOnboardingIncomplete (AC3)", async ({
    page,
  }) => {
    await seedAuthState(page, { devBypassActive: true, isSetupComplete: false })
    await page.goto(`${BASE_URL}/dashboard`)
    // Guard should NOT redirect away. The dashboard shell renders.
    await expect(page).toHaveURL(/\/dashboard\/?$/)
    // The shell's "Organization" nav link is a stable landmark.
    await expect(page.getByRole("link", { name: /Organization/i })).toBeVisible()
  })

  test("M12_F02_R02_DashboardStillRedirectsWhenBypassInactive (control case)", async ({
    page,
  }) => {
    await seedAuthState(page, { devBypassActive: false, isSetupComplete: false })
    await page.goto(`${BASE_URL}/dashboard`)
    // Without bypass, guard sends incomplete owner to /onboarding.
    await expect(page).toHaveURL(/\/onboarding\/?$/)
  })

  test("M12_F02_R04_BannerVisibleWhenBypassActiveAndIncomplete (AC5)", async ({ page }) => {
    await seedAuthState(page, { devBypassActive: true, isSetupComplete: false })
    await page.goto(`${BASE_URL}/dashboard`)
    await expect(page.getByText("Dev bypass active")).toBeVisible()
  })

  test("M12_F02_R04_BannerHiddenWhenOnboardingComplete (AC6)", async ({ page }) => {
    await seedAuthState(page, { devBypassActive: true, isSetupComplete: true })
    await page.goto(`${BASE_URL}/dashboard`)
    // Onboarding-side guard does NOT send a completed owner back to wizard,
    // and the banner is gated on `!isSetupComplete` so it stays hidden.
    await expect(page.getByText("Dev bypass active")).toHaveCount(0)
  })

  test("M12_F02_R03_WizardShowsSkipToDashboardAffordance (AC4)", async ({ page }) => {
    await seedAuthState(page, { devBypassActive: true, isSetupComplete: false })
    await page.goto(`${BASE_URL}/onboarding`)
    // The skip button is in the wizard chrome between progress bar and step header.
    const skipLink = page.getByRole("link", { name: /Skip to Dashboard/i })
    await expect(skipLink).toBeVisible()
    await skipLink.click()
    await expect(page).toHaveURL(/\/dashboard\/?$/)
  })

  test("M12_F02_R03_WizardHidesSkipAffordanceWhenBypassInactive (control case)", async ({
    page,
  }) => {
    await seedAuthState(page, { devBypassActive: false, isSetupComplete: false })
    await page.goto(`${BASE_URL}/onboarding`)
    await expect(page.getByRole("link", { name: /Skip to Dashboard/i })).toHaveCount(0)
  })
})
