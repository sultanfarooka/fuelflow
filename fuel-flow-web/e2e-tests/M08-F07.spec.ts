/**
 * E2E spec for M08-F07 — Station Management Navigation Hub
 *
 * Uses the injectAuth helper to set localStorage directly (no real API login),
 * exactly as M07-F10.spec.ts does.
 *
 * ACs covered:
 *   AC1 — Owner sees Station Management group with exactly 4 child items
 *   AC2 — Custom User sees no Station Management group or child items
 *   AC3 — Fuel Pricing is absent from the Commercial group (for any role)
 *   AC4 — Navigating directly to a manage/* child auto-expands the group
 *   AC5 — Each manage/* child renders the shared UnderDevelopment placeholder
 */
import { test, expect, type Page } from "@playwright/test"

const BASE_URL = "http://localhost:5173"
const STATION_ID = "cccccccc-0000-0000-0000-000000000001"

// ---------------------------------------------------------------------------
// Auth injection helper (same pattern as M07-F10.spec.ts)
// ---------------------------------------------------------------------------
async function injectAuth(
  page: Page,
  roles: string[],
  planName: "Starter" | "Professional" = "Professional",
) {
  await page.evaluate(
    ({ roles, planName, stationId }) => {
      localStorage.setItem(
        "auth-storage",
        JSON.stringify({
          state: {
            isAuthenticated: true,
            expiresIn: 86400,
            devBypassActive: false,
            user: {
              id: "aaaaaaaa-0000-0000-0000-000000000001",
              email: "owner@test.com",
              fullName: "Ali Khan",
              roles,
            },
            organization: {
              id: "bbbbbbbb-0000-0000-0000-000000000001",
              name: "Khan Petroleum",
            },
            stations: [
              {
                id: stationId,
                name: "Station Alpha",
                isSetupComplete: true,
                acceptedPaymentMethods: ["Cash"],
              },
            ],
            subscription: {
              status: "active",
              planId:
                planName === "Starter"
                  ? "11111111-1111-1111-1111-111111111101"
                  : "11111111-1111-1111-1111-111111111102",
              planName,
              endsAt: "2026-07-06T00:00:00Z",
            },
          },
          version: 0,
        }),
      )
    },
    { roles, planName, stationId: STATION_ID },
  )
}

// ---------------------------------------------------------------------------
// AC1 — Owner sees Station Management group with exactly 4 child items
// ---------------------------------------------------------------------------
test("M08_F07_AC1 Owner sees Station Management group with 4 child items", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "Sidebar is a collapsed drawer on mobile; nav visibility is a desktop concern")

  await page.goto(BASE_URL)
  await injectAuth(page, ["Owner"])
  await page.goto(`${BASE_URL}/dashboard/station/${STATION_ID}/shifts`)

  // Group label must be visible
  await expect(page.getByText("Station Management", { exact: true }).first()).toBeVisible()

  // The collapsible trigger button is visible
  const trigger = page.getByRole("button", { name: "Station Management" })
  await expect(trigger).toBeVisible()

  // Expand the group
  await trigger.click()

  // All 4 child items must appear
  await expect(page.getByRole("link", { name: "Fuel Pricing" })).toBeVisible()
  await expect(page.getByRole("link", { name: "Fuel Types" })).toBeVisible()
  await expect(page.getByRole("link", { name: "Fuel Tanks" })).toBeVisible()
  await expect(page.getByRole("link", { name: "Nozzles" })).toBeVisible()

  // Confirm exactly those 4 are sub-items of Station Management (not Commercial)
  // by checking href patterns
  await expect(page.getByRole("link", { name: "Fuel Pricing" })).toHaveAttribute(
    "href",
    new RegExp(`/dashboard/station/${STATION_ID}/pricing`),
  )
  await expect(page.getByRole("link", { name: "Fuel Types" })).toHaveAttribute(
    "href",
    new RegExp(`/dashboard/station/${STATION_ID}/manage/fuel-types`),
  )
  await expect(page.getByRole("link", { name: "Fuel Tanks" })).toHaveAttribute(
    "href",
    new RegExp(`/dashboard/station/${STATION_ID}/manage/tanks`),
  )
  await expect(page.getByRole("link", { name: "Nozzles" })).toHaveAttribute(
    "href",
    new RegExp(`/dashboard/station/${STATION_ID}/manage/nozzles`),
  )
})

// AC1 also applies to Manager role
test("M08_F07_AC1 Manager sees Station Management group with 4 child items", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "Sidebar is a collapsed drawer on mobile; nav visibility is a desktop concern")

  await page.goto(BASE_URL)
  await injectAuth(page, ["Manager"])
  await page.goto(`${BASE_URL}/dashboard/station/${STATION_ID}/shifts`)

  await expect(page.getByText("Station Management", { exact: true }).first()).toBeVisible()

  const trigger = page.getByRole("button", { name: "Station Management" })
  await expect(trigger).toBeVisible()
  await trigger.click()

  await expect(page.getByRole("link", { name: "Fuel Pricing" })).toBeVisible()
  await expect(page.getByRole("link", { name: "Fuel Types" })).toBeVisible()
  await expect(page.getByRole("link", { name: "Fuel Tanks" })).toBeVisible()
  await expect(page.getByRole("link", { name: "Nozzles" })).toBeVisible()
})

// ---------------------------------------------------------------------------
// AC2 — Custom User sees no Station Management group or its child items
// ---------------------------------------------------------------------------
test("M08_F07_AC2 Custom User sees no Station Management group", async ({ page, isMobile }) => {
  test.skip(isMobile, "Sidebar is a collapsed drawer on mobile; nav visibility is a desktop concern")

  await page.goto(BASE_URL)
  await injectAuth(page, ["Custom"])
  await page.goto(`${BASE_URL}/dashboard/station/${STATION_ID}/shifts`)

  // Group label must NOT appear
  await expect(
    page.getByText("Station Management", { exact: true }).first(),
  ).not.toBeVisible()

  // None of the Station Management child items must appear
  await expect(page.getByRole("button", { name: "Station Management" })).not.toBeVisible()
  await expect(page.getByRole("link", { name: "Fuel Types" })).not.toBeVisible()
  await expect(page.getByRole("link", { name: "Fuel Tanks" })).not.toBeVisible()
  // "Nozzles" link — note: Operations has "Nozzle Operations", not "Nozzles", so this is safe
  await expect(page.getByRole("link", { name: "Nozzles" })).not.toBeVisible()

  // Verify the sidebar groups that ARE visible
  const sidebarGroups = await page.evaluate(() =>
    Array.from(document.querySelectorAll("[data-sidebar='group-label']")).map(
      (el) => el.textContent,
    ),
  )
  expect(sidebarGroups).toContain("Operations")
  expect(sidebarGroups).toContain("Commercial")
  expect(sidebarGroups).toContain("Reports")
  expect(sidebarGroups).not.toContain("Station Management")
})

// ---------------------------------------------------------------------------
// AC3 — Fuel Pricing is absent from the Commercial group for any authenticated user
// ---------------------------------------------------------------------------
test("M08_F07_AC3 Fuel Pricing absent from Commercial group (Owner)", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "Sidebar is a collapsed drawer on mobile; nav visibility is a desktop concern")

  await page.goto(BASE_URL)
  await injectAuth(page, ["Owner"])
  await page.goto(`${BASE_URL}/dashboard/station/${STATION_ID}/shifts`)

  // Commercial group must exist but must NOT contain a Fuel Pricing link
  await expect(page.getByText("Commercial", { exact: true })).toBeVisible()

  // Fuel Pricing only lives inside Station Management (under the collapsible),
  // not directly in Commercial.  The Commercial links are Credit Customers and Finance & Accounts.
  await expect(page.getByRole("link", { name: "Credit Customers" })).toBeVisible()
  await expect(page.getByRole("link", { name: "Finance & Accounts" })).toBeVisible()

  // Verify via group-label → sibling list: no Fuel Pricing link in the Commercial list
  const commercialHasFuelPricing = await page.evaluate(() => {
    const labels = Array.from(document.querySelectorAll("[data-sidebar='group-label']"))
    const commercialLabel = labels.find((el) => el.textContent === "Commercial")
    if (!commercialLabel) return false
    const group = commercialLabel.closest("[data-sidebar='group']")
    if (!group) return false
    const links = Array.from(group.querySelectorAll("a"))
    return links.some((a) => a.textContent?.trim() === "Fuel Pricing")
  })
  expect(commercialHasFuelPricing).toBe(false)
})

test("M08_F07_AC3 Fuel Pricing absent from Commercial group (Custom User)", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "Sidebar is a collapsed drawer on mobile; nav visibility is a desktop concern")

  await page.goto(BASE_URL)
  await injectAuth(page, ["Custom"])
  await page.goto(`${BASE_URL}/dashboard/station/${STATION_ID}/shifts`)

  await expect(page.getByText("Commercial", { exact: true })).toBeVisible()

  const commercialHasFuelPricing = await page.evaluate(() => {
    const labels = Array.from(document.querySelectorAll("[data-sidebar='group-label']"))
    const commercialLabel = labels.find((el) => el.textContent === "Commercial")
    if (!commercialLabel) return false
    const group = commercialLabel.closest("[data-sidebar='group']")
    if (!group) return false
    const links = Array.from(group.querySelectorAll("a"))
    return links.some((a) => a.textContent?.trim() === "Fuel Pricing")
  })
  expect(commercialHasFuelPricing).toBe(false)
})

// ---------------------------------------------------------------------------
// AC4 — Navigating directly to a manage/* child auto-expands Station Management
// ---------------------------------------------------------------------------
test("M08_F07_AC4 Navigate to manage/fuel-types auto-expands Station Management", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "Sidebar is a collapsed drawer on mobile; nav visibility is a desktop concern")

  await page.goto(BASE_URL)
  await injectAuth(page, ["Owner"])
  // Navigate directly — no manual toggle
  await page.goto(`${BASE_URL}/dashboard/station/${STATION_ID}/manage/fuel-types`)

  // Collapsible trigger must be expanded
  const trigger = page.getByRole("button", { name: "Station Management" })
  await expect(trigger).toBeVisible()
  await expect(trigger).toHaveAttribute("aria-expanded", "true")

  // All 4 child links visible (group is open)
  await expect(page.getByRole("link", { name: "Fuel Types" })).toBeVisible()
  await expect(page.getByRole("link", { name: "Fuel Tanks" })).toBeVisible()
  await expect(page.getByRole("link", { name: "Nozzles" })).toBeVisible()
  await expect(page.getByRole("link", { name: "Fuel Pricing" })).toBeVisible()
})

test("M08_F07_AC4 Navigate to manage/tanks auto-expands Station Management", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "Sidebar is a collapsed drawer on mobile; nav visibility is a desktop concern")

  await page.goto(BASE_URL)
  await injectAuth(page, ["Owner"])
  await page.goto(`${BASE_URL}/dashboard/station/${STATION_ID}/manage/tanks`)

  const trigger = page.getByRole("button", { name: "Station Management" })
  await expect(trigger).toHaveAttribute("aria-expanded", "true")
  await expect(page.getByRole("link", { name: "Fuel Tanks" })).toBeVisible()
})

test("M08_F07_AC4 Navigate to manage/nozzles auto-expands Station Management", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "Sidebar is a collapsed drawer on mobile; nav visibility is a desktop concern")

  await page.goto(BASE_URL)
  await injectAuth(page, ["Owner"])
  await page.goto(`${BASE_URL}/dashboard/station/${STATION_ID}/manage/nozzles`)

  const trigger = page.getByRole("button", { name: "Station Management" })
  await expect(trigger).toHaveAttribute("aria-expanded", "true")
  await expect(page.getByRole("link", { name: "Nozzles" })).toBeVisible()
})

// ---------------------------------------------------------------------------
// AC5 — Each Station Management child renders UnderDevelopment placeholder
// ---------------------------------------------------------------------------
test("M08_F07_AC5 Fuel Types renders UnderDevelopment placeholder", async ({ page }) => {
  await page.goto(BASE_URL)
  await injectAuth(page, ["Owner"])
  await page.goto(`${BASE_URL}/dashboard/station/${STATION_ID}/manage/fuel-types`)

  await expect(page.getByRole("heading", { name: "Fuel Types", level: 1 })).toBeVisible()
  await expect(page.getByText("Under Development")).toBeVisible()
  await expect(page.getByText("This module is being built.")).toBeVisible()
})

test("M08_F07_AC5 Fuel Tanks renders UnderDevelopment placeholder", async ({ page }) => {
  await page.goto(BASE_URL)
  await injectAuth(page, ["Owner"])
  await page.goto(`${BASE_URL}/dashboard/station/${STATION_ID}/manage/tanks`)

  await expect(page.getByRole("heading", { name: "Fuel Tanks", level: 1 })).toBeVisible()
  await expect(page.getByText("Under Development")).toBeVisible()
  await expect(page.getByText("This module is being built.")).toBeVisible()
})

test("M08_F07_AC5 Nozzles config renders UnderDevelopment placeholder", async ({ page }) => {
  await page.goto(BASE_URL)
  await injectAuth(page, ["Owner"])
  await page.goto(`${BASE_URL}/dashboard/station/${STATION_ID}/manage/nozzles`)

  await expect(page.getByRole("heading", { name: "Nozzles", level: 1 })).toBeVisible()
  await expect(page.getByText("Under Development")).toBeVisible()
  await expect(page.getByText("This module is being built.")).toBeVisible()
})

test("M08_F07_AC5 Fuel Pricing (moved route) still renders UnderDevelopment placeholder", async ({
  page,
}) => {
  await page.goto(BASE_URL)
  await injectAuth(page, ["Owner"])
  await page.goto(`${BASE_URL}/dashboard/station/${STATION_ID}/pricing`)

  await expect(page.getByRole("heading", { name: "Fuel Pricing", level: 1 })).toBeVisible()
  await expect(page.getByText("Under Development")).toBeVisible()
})
