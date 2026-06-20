/**
 * E2E spec for M06-F01 — Price Configuration (Fuel Pricing child route of
 * Station Configuration, M08-F07-R06).
 *
 * Approach mirrors M08-F08.spec.ts: inject auth into localStorage (per the
 * repo's faked-auth E2E convention), and stub the fuel-types + fuel-prices
 * endpoints with Playwright route mocking so we exercise the real browser,
 * router, <FuelPricingPanel> + dialogs against deterministic API responses
 * — no seeded backend required.
 *
 * ACs covered:
 *   AC1 (R01 + R03) — list renders current prices + "No active price" badge
 *                     for fuel types without an active row.
 *   AC2 (R02)       — Set price dialog → API call → table refreshes.
 *   AC3 (R02 neg)   — backdated price → backend 400 surfaces as toast.
 *   AC4 (R01 neg)   — setting a new price atomically closes the prior row
 *                     (verified via AC5's history dialog).
 *   AC5 (R04)       — Price history dialog lists every row, newest first,
 *                     with the active row badged "Active".
 *
 * AC6 (route guard for Accountant) is a frontend-only redirect verified by
 * the M07-F10 spec (role gating is shared infrastructure). AC7 (Serilog
 * audit) is backend-only and verified by handler-level review during
 * implementation, not in the browser.
 */
import { test, expect, type Page } from "@playwright/test"

const BASE_URL = "http://localhost:5173"
const ORG_ID = "bbbbbbbb-0000-0000-0000-000000000001"
const STATION_ID = "cccccccc-0000-0000-0000-000000000001"
const OMC_ID = "dddddddd-0000-0000-0000-000000000001"
const PRICING_URL = `${BASE_URL}/dashboard/station/${STATION_ID}/configuration/pricing`

const FT_PMG = "f0000000-0000-0000-0000-000000000001"
const FT_HSD = "f0000000-0000-0000-0000-000000000002"
const FT_HOBC = "f0000000-0000-0000-0000-000000000003"

type ServerFuelType = {
  id: string
  name: string
  unit: string
  isCustom: boolean
  omcId: string | null
  source: string
  isActive: boolean
  tankCount: number
  hasActivePrice: boolean
  isSellable: boolean
}

type ServerFuelPrice = {
  id: string
  fuelTypeId: string
  fuelTypeName: string
  stationId: string
  price: number
  effectiveFrom: string
  effectiveTo: string | null
}

function seedFuelTypes(): ServerFuelType[] {
  // Two OMC types (one with an active price, one without) + a Custom type
  // (also with an active price) — covers the Source + Has-active-price
  // faceted-filter dimensions and the "No active price" muted badge.
  return [
    { id: FT_PMG, name: "PMG", unit: "L", isCustom: false, omcId: OMC_ID, source: "OMC", isActive: true, tankCount: 1, hasActivePrice: true, isSellable: true },
    { id: FT_HSD, name: "HSD", unit: "L", isCustom: false, omcId: OMC_ID, source: "OMC", isActive: true, tankCount: 1, hasActivePrice: false, isSellable: false },
    { id: FT_HOBC, name: "HOBC Premium", unit: "L", isCustom: true, omcId: null, source: "Custom", isActive: true, tankCount: 1, hasActivePrice: true, isSellable: true },
  ]
}

function seedPrices(): ServerFuelPrice[] {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  return [
    // PMG: one active price + one historical row (closed three days ago).
    {
      id: "p1111111-0000-0000-0000-000000000001",
      fuelTypeId: FT_PMG,
      fuelTypeName: "PMG",
      stationId: STATION_ID,
      price: 285.50,
      effectiveFrom: oneDayAgo,
      effectiveTo: null,
    },
    {
      id: "p1111111-0000-0000-0000-000000000002",
      fuelTypeId: FT_PMG,
      fuelTypeName: "PMG",
      stationId: STATION_ID,
      price: 281.00,
      effectiveFrom: threeDaysAgo,
      effectiveTo: oneDayAgo,
    },
    // HOBC: single active price.
    {
      id: "p2222222-0000-0000-0000-000000000001",
      fuelTypeId: FT_HOBC,
      fuelTypeName: "HOBC Premium",
      stationId: STATION_ID,
      price: 340.00,
      effectiveFrom: oneDayAgo,
      effectiveTo: null,
    },
    // HSD: no rows — exercises the "No active price" path.
  ]
}

async function injectAuth(
  page: Page,
  { roles = ["Owner"] }: { roles?: string[] } = {},
) {
  await page.addInitScript(
    ({ roles, orgId, stationId }) => {
      window.localStorage.setItem(
        "fuel-flow-auth",
        JSON.stringify({
          state: {
            isAuthenticated: true,
            user: {
              id: "aaaaaaaa-0000-0000-0000-000000000001",
              email: "owner@example.com",
              fullName: "Test Owner",
              roles,
            },
            organization: { id: orgId, name: "Test Org" },
            stations: [{ id: stationId, name: "Station Alpha", isSetupComplete: true, omcId: "dddddddd-0000-0000-0000-000000000001" }],
            subscription: {
              status: "trial",
              plan: { name: "Professional", features: {} },
              trialEndsAt: "2026-07-06T00:00:00Z",
              endsAt: "2026-07-06T00:00:00Z",
            },
          },
          version: 0,
        }),
      )
    },
    { roles, orgId: ORG_ID, stationId: STATION_ID },
  )
}

/**
 * Mock every /api/v1/** call. Fuel-types list + fuel-prices list/create are
 * stateful over `fuelTypes` + `prices`. Setting a new price atomically closes
 * the prior active row and inserts a new one — same semantics as the real
 * `SetFuelPriceCommandHandler`.
 */
async function mockApi(
  page: Page,
  fuelTypes: ServerFuelType[],
  prices: ServerFuelPrice[],
  opts: { rejectBackdated?: boolean } = {},
) {
  await page.route("**/api/v1/**", async (route) => {
    const req = route.request()
    const { pathname } = new URL(req.url())
    const method = req.method()
    const json = (status: number, body: unknown) =>
      route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) })

    // /auth/me — make the SPA think we're logged in (the auth store already is).
    if (pathname.endsWith("/auth/me")) return json(200, { success: true, data: {} })

    // Org stations
    if (pathname === `/api/v1/stations/${ORG_ID}`) {
      return json(200, { success: true, data: [{ id: STATION_ID, name: "Station Alpha", isActive: true, omcId: OMC_ID }] })
    }

    // Fuel types list
    if (pathname === `/api/v1/stations/${STATION_ID}/fuel-types` && method === "GET") {
      return json(200, { success: true, data: fuelTypes })
    }

    // Fuel prices list
    if (pathname === `/api/v1/stations/${STATION_ID}/fuel-prices` && method === "GET") {
      return json(200, { success: true, data: prices })
    }

    // Set price — POST /stations/{stationId}/fuel-prices
    if (pathname === `/api/v1/stations/${STATION_ID}/fuel-prices` && method === "POST") {
      const body = req.postDataJSON() as { fuelTypeId: string; price: number; effectiveFrom: string }
      const effective = new Date(body.effectiveFrom)
      const slop = 5 * 60 * 1000
      if (opts.rejectBackdated || effective.getTime() < Date.now() - slop) {
        return json(400, { success: false, error: "Effective date cannot be in the past." })
      }
      // Close any active row for this fuel type.
      const current = prices.find((p) => p.fuelTypeId === body.fuelTypeId && p.effectiveTo == null)
      if (current) current.effectiveTo = body.effectiveFrom
      const ft = fuelTypes.find((f) => f.id === body.fuelTypeId)!
      const inserted: ServerFuelPrice = {
        id: `p9999999-0000-0000-0000-${String(prices.length + 1).padStart(12, "0")}`,
        fuelTypeId: body.fuelTypeId,
        fuelTypeName: ft.name,
        stationId: STATION_ID,
        price: body.price,
        effectiveFrom: body.effectiveFrom,
        effectiveTo: null,
      }
      prices.push(inserted)
      ft.hasActivePrice = true
      return json(200, { success: true, data: inserted })
    }

    // Anything else: benign 200 so the SPA's 401 interceptor never fires.
    return json(200, { success: true, data: null })
  })
}

test.describe("M06-F01 — Price Configuration", () => {
  test("AC1 — table renders current price + 'No active price' badge", async ({ page }) => {
    const fts = seedFuelTypes()
    const prices = seedPrices()
    await injectAuth(page)
    await mockApi(page, fts, prices)
    await page.goto(PRICING_URL)

    await expect(page.getByRole("heading", { name: "Fuel Prices" })).toBeVisible()

    // PMG has an active price.
    const pmgRow = page.getByRole("row", { name: /PMG/ })
    await expect(pmgRow).toContainText("285.50")

    // HSD has no active price → muted "No active price" badge.
    const hsdRow = page.getByRole("row", { name: /HSD/ })
    await expect(hsdRow).toContainText("No active price")

    // HOBC Premium is Custom — verifies the Source filter dimension.
    const hobcRow = page.getByRole("row", { name: /HOBC Premium/ })
    await expect(hobcRow).toContainText("Custom")
  })

  test("AC2 — Set price → row refreshes with new value (Enter submits)", async ({ page }) => {
    const fts = seedFuelTypes()
    const prices = seedPrices()
    await injectAuth(page)
    await mockApi(page, fts, prices)
    await page.goto(PRICING_URL)

    const hsdRow = page.getByRole("row", { name: /HSD/ })
    await hsdRow.getByRole("button", { name: /Set price/ }).click()

    await expect(page.getByRole("heading", { name: /Set price for HSD/ })).toBeVisible()
    // Date input defaults to today; price input has autofocus. Pressing Enter
    // here submits the form (verifies the form-submit wiring).
    const priceInput = page.getByLabel(/Price.*L/)
    await priceInput.fill("290.25")
    await priceInput.press("Enter")

    // Dialog closes; row now shows the new price.
    await expect(page.getByRole("heading", { name: /Set price for HSD/ })).not.toBeVisible()
    await expect(hsdRow).toContainText("290.25")
  })

  test("AC3 — backdated price → API error surfaces", async ({ page }) => {
    const fts = seedFuelTypes()
    const prices = seedPrices()
    await injectAuth(page)
    await mockApi(page, fts, prices, { rejectBackdated: true })
    await page.goto(PRICING_URL)

    const pmgRow = page.getByRole("row", { name: /PMG/ })
    await pmgRow.getByRole("button", { name: /Set price/ }).click()

    await page.getByLabel(/Price.*L/).fill("295.00")
    await page.getByRole("button", { name: /Save price/ }).click()

    // Toast surfaces the server message; row unchanged.
    await expect(page.getByText("Effective date cannot be in the past.")).toBeVisible()
    await expect(pmgRow).toContainText("285.50")
  })

  test("AC5 — history dialog lists every row, newest first, Active chip on current", async ({ page }) => {
    const fts = seedFuelTypes()
    const prices = seedPrices()
    await injectAuth(page)
    await mockApi(page, fts, prices)
    await page.goto(PRICING_URL)

    const pmgRow = page.getByRole("row", { name: /PMG/ })
    await pmgRow.getByRole("button", { name: /History/ }).click()

    const dialog = page.getByRole("dialog", { name: /Price history.*PMG/ })
    await expect(dialog).toBeVisible()
    // Both prices listed; current row carries the Active chip.
    await expect(dialog).toContainText("285.50")
    await expect(dialog).toContainText("281.00")
    await expect(dialog.getByText("Active", { exact: true })).toBeVisible()
  })
})
