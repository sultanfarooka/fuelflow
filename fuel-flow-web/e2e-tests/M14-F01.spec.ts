/**
 * M14-F01 — Control Plane / Tenant DbContext Split
 *
 * M14-F01 is a pure data-layer refactor with no intentional user-visible
 * change. Its `## Layers touched` are Domain + Infrastructure (config split,
 * migration rewrite) + Application (repository routing) + Docs. Api and
 * Frontend are NOT touched.
 *
 * The risk M14-F01 introduces is silent — a handler that depended on the
 * cross-context navs we kept as F01 shims (`FuelTank.FuelType`, `Station.OMC`,
 * `FuelPrices.FuelType`) might lazy-load incorrectly now that two contexts
 * own separate `__EFMigrationsHistory_*` tables. This spec doesn't try to
 * exercise the full onboarding wizard — that's M12-F01/F02's spec to own,
 * and it's brittle against the API client's 401 interceptor when using
 * seeded `auth-storage` (see M12-F02.spec.ts pattern). Instead this spec
 * verifies the **two pillars M14-F01 must not regress**:
 *
 *   1. The backend boots and the Identity stack (now backed by
 *      `ControlPlaneDbContext`) responds correctly on auth endpoints.
 *   2. The frontend's auth-store hydrates from a seeded session and the
 *      `/dashboard` route guard (which exercises the cross-context tank
 *      reads via the F01 shim once a user is fully onboarded) renders
 *      without crashing.
 *
 * Prereqs:
 * - `scripts/dev.ps1` running so both http://localhost:5173 (Vite) and
 *   http://localhost:5035 (.NET API backed by the two new DbContexts) are
 *   reachable.
 * - Local Postgres has both contexts' Initial migrations applied
 *   (`__EFMigrationsHistory_ControlPlane` and `__EFMigrationsHistory_AppDb`
 *   tables present).
 *
 * Run: `npm run test:e2e -- M14-F01`
 */

import { test, expect, type Page } from "@playwright/test"

const BASE_URL = "http://localhost:5173"
const API_BASE = "http://localhost:5035/api/v1"

/**
 * Seed the Zustand `auth-storage` localStorage key. Same shape as the M12-F02
 * helper — kept inline here so M14-F01 has its own dependency-free baseline.
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
            email: "m14f01@fuelflow.test",
            phone: "+923009999999",
            fullName: "M14-F01 Smoke Owner",
            roles: ["owner"],
          },
          organization: {
            id: "22222222-2222-2222-2222-222222222222",
            name: "M14-F01 Smoke Org",
          },
          stations: [
            {
              id: "33333333-3333-3333-3333-333333333333",
              name: "M14-F01 Smoke Station",
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

test.describe("M14-F01 — Control Plane / Tenant DbContext Split (smoke)", () => {
  test("M14_F01_R01_BackendBootsAndIdentityEndpointResponds", async ({ request }) => {
    // Auth login with an obviously-wrong password against a phone the
    // control-plane database does not know. We expect a structured 401
    // response, NOT a 500 — a 500 would mean Identity is mis-wired between
    // ControlPlaneDbContext and the new DI registration. This is the
    // cheapest possible proof that AppDbContext.AddEntityFrameworkStores
    // ↦ AddEntityFrameworkStores<ControlPlaneDbContext> wiring works.
    const res = await request.post(`${API_BASE}/auth/login`, {
      data: { phone: "+923000000000", password: "this-will-not-match" },
      // Don't follow redirects; we want the raw status.
    })

    // M14-F01 must not introduce a 500. Acceptable codes are 400 (validation),
    // 401 (auth failed), or 404 (user not found) — but never 5xx.
    expect(res.status(), `Login probe must not return 5xx. Got body: ${await res.text()}`).toBeLessThan(500)
  })

  test("M14_F01_R02_SwaggerEndpointReachable", async ({ request }) => {
    // Swagger is the canonical "backend is alive and the model loaded" probe.
    // A 200 here means both DbContexts registered successfully in DI and
    // EF Core's design-time model validation passed at startup (which is
    // exactly where M14-F01 had its biggest landmine in Phase 4).
    const res = await request.get("http://localhost:5035/swagger/index.html")
    expect(res.status()).toBe(200)
  })

  test("M14_F01_R03_DashboardRendersWithSeededAuth_NoCrossContextCrash", async ({ page }) => {
    // The dashboard's initial render reads from the seeded auth-store and
    // doesn't trip the API client's 401 interceptor in the same way the
    // onboarding wizard does (see M12-F02.spec.ts notes). If M14-F01 broke
    // the data layer in a way that cascades to the dashboard route, we'd
    // see either a stack trace in the page body or the route guard sending
    // us somewhere unexpected.
    await seedAuthState(page, { devBypassActive: true, isSetupComplete: true })
    await page.goto(`${BASE_URL}/dashboard`)
    // The negative assertion is the strong M14-F01 signal: if the data-layer
    // refactor crashed any code on the dashboard route guard's path (auth-store
    // hydration, organization lookup, station list), the page would redirect
    // to /auth/login. Staying on /dashboard proves the guard accepted the
    // seeded state and the shell mounted cleanly. The page <main> landmark
    // is mobile-viewport-friendly (M12-F02's R02 uses an Organization sidebar
    // link assertion that's behind a hamburger on mobile-chrome — we avoid
    // that here so M14-F01 doesn't inherit M12-F02's known mobile flakiness).
    await expect(page).toHaveURL(/\/dashboard\/?$/)
    await expect(page.locator("main")).toBeVisible()
  })

  test("M14_F01_R04_LoginPageRendersWithoutCrash", async ({ page }) => {
    // The /auth/login route is where unauthenticated users land. If the
    // frontend bundle were broken by M14-F01 (which it shouldn't be —
    // Frontend is not touched), this is where we'd notice. Verifies the
    // app shell + auth route layout still mount cleanly.
    await page.goto(`${BASE_URL}/auth/login`)
    await expect(page).toHaveURL(/\/auth\/login\/?$/)
    // M01-F09 combined identifier field (phone primary, email fallback).
    // Use the role + name selector to dodge the React Router devtools-overlay
    // elements that also match a /Phone/ label regex.
    await expect(page.getByRole("textbox", { name: /Phone or email/i })).toBeVisible()
  })
})
