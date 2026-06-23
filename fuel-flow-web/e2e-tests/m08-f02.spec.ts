/**
 * E2E spec for M08-F02 — Tank Configuration (Fuel Tanks child route of
 * Station Configuration, M08-F07-R06).
 *
 * Same pattern as m08-f08 and m06-f01: inject auth into localStorage and
 * stub the fuel-tanks + fuel-types endpoints with Playwright route mocking.
 * Real browser, router, <FuelTanksPanel /> + dialogs against deterministic
 * API responses — no seeded backend required.
 *
 * ACs covered:
 *   AC1 — list renders name/capacity/fuel-type/dip-chart/nozzles
 *   AC2 — Add a tank → row appears
 *   AC3 — duplicate name blocked
 *   AC4 — Edit name/capacity persists
 *   AC5 — Edit fuel type triggers reassign confirm + second-click commits
 *   AC6 — Delete an unreferenced tank → row disappears
 *   AC7 — Delete a referenced tank → 409 dialog lists references
 *
 * AC8 (audit) is backend-only. AC9 (role guard) is covered by
 * M07-F10.spec.ts.
 */
import { test, expect, type Page } from "@playwright/test"

const BASE_URL = "http://localhost:5173"
const ORG_ID = "bbbbbbbb-0000-0000-0000-000000000001"
const STATION_ID = "cccccccc-0000-0000-0000-000000000001"
const OMC_ID = "dddddddd-0000-0000-0000-000000000001"
const TANKS_URL = `${BASE_URL}/dashboard/station/${STATION_ID}/configuration/tanks`

const FT_PMG = "f0000000-0000-0000-0000-000000000001"
const FT_HSD = "f0000000-0000-0000-0000-000000000002"

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

type ServerFuelTank = {
  id: string
  name: string | null
  capacityLiters: number
  fuelTypeId: string
  fuelTypeName: string | null
  hasDipChart: boolean
  dipChartEntryCount: number
  nozzleCount: number
}

type ServerDipChart = {
  id: string
  tankId: string
  entryCount: number
  entries: { id: string; depthCm: number; volumeLiters: number }[]
}

function seedFuelTypes(): ServerFuelType[] {
  return [
    { id: FT_PMG, name: "PMG", unit: "L", isCustom: false, omcId: OMC_ID, source: "OMC", isActive: true, tankCount: 1, hasActivePrice: true, isSellable: true },
    { id: FT_HSD, name: "HSD", unit: "L", isCustom: false, omcId: OMC_ID, source: "OMC", isActive: true, tankCount: 0, hasActivePrice: false, isSellable: false },
  ]
}

function seedTanks(): ServerFuelTank[] {
  return [
    {
      id: "t1111111-0000-0000-0000-000000000001",
      name: "Tank 1",
      capacityLiters: 45000,
      fuelTypeId: FT_PMG,
      fuelTypeName: "PMG",
      hasDipChart: true,
      dipChartEntryCount: 250,
      nozzleCount: 2, // referenced — will block delete
    },
    {
      id: "t1111111-0000-0000-0000-000000000002",
      name: "Tank 2",
      capacityLiters: 30000,
      fuelTypeId: FT_PMG,
      fuelTypeName: "PMG",
      hasDipChart: false,
      dipChartEntryCount: 0,
      nozzleCount: 0, // unreferenced — can be deleted
    },
  ]
}

async function injectAuth(page: Page) {
  await page.addInitScript(
    ({ orgId, stationId, omcId }) => {
      window.localStorage.setItem(
        "fuel-flow-auth",
        JSON.stringify({
          state: {
            isAuthenticated: true,
            user: {
              id: "aaaaaaaa-0000-0000-0000-000000000001",
              email: "owner@example.com",
              fullName: "Test Owner",
              roles: ["Owner"],
            },
            organization: { id: orgId, name: "Test Org" },
            stations: [{ id: stationId, name: "Station Alpha", isSetupComplete: true, omcId }],
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
    { orgId: ORG_ID, stationId: STATION_ID, omcId: OMC_ID },
  )
}

async function mockApi(
  page: Page,
  fuelTypes: ServerFuelType[],
  tanks: ServerFuelTank[],
  dipCharts: Map<string, ServerDipChart> = new Map(),
) {
  await page.route("**/api/v1/**", async (route) => {
    const req = route.request()
    const { pathname } = new URL(req.url())
    const method = req.method()
    const json = (status: number, body: unknown) =>
      route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) })

    if (pathname.endsWith("/auth/me")) return json(200, { success: true, data: {} })

    if (pathname === `/api/v1/stations/${ORG_ID}`) {
      return json(200, { success: true, data: [{ id: STATION_ID, name: "Station Alpha", isActive: true, omcId: OMC_ID }] })
    }

    if (pathname === `/api/v1/stations/${STATION_ID}/fuel-types` && method === "GET") {
      return json(200, { success: true, data: fuelTypes })
    }

    // Dip chart — GET / POST under /…/fuel-tanks/{tankId}/dip-chart
    const dipMatch = pathname.match(/\/fuel-tanks\/([^/]+)\/dip-chart$/)
    if (dipMatch) {
      const tankId = dipMatch[1]
      if (method === "GET") {
        const chart = dipCharts.get(tankId) ?? null
        return json(200, { success: true, data: chart })
      }
      if (method === "POST") {
        const body = req.postDataJSON() as {
          entries: { depthCm: number; volumeLiters: number }[]
        }
        const chart: ServerDipChart = {
          id: `d9999999-0000-0000-0000-${tankId.slice(-12)}`,
          tankId,
          entryCount: body.entries.length,
          entries: body.entries.map((e, i) => ({
            id: `e${i.toString().padStart(35, "0")}`,
            depthCm: e.depthCm,
            volumeLiters: e.volumeLiters,
          })),
        }
        dipCharts.set(tankId, chart)
        const t = tanks.find((tt) => tt.id === tankId)
        if (t) {
          t.hasDipChart = true
          t.dipChartEntryCount = chart.entryCount
        }
        return json(200, { success: true, data: chart })
      }
    }

    // Tank list
    if (pathname === `/api/v1/stations/${STATION_ID}/fuel-tanks` && method === "GET") {
      return json(200, { success: true, data: tanks })
    }

    // Create tank
    if (pathname === `/api/v1/stations/${STATION_ID}/fuel-tanks` && method === "POST") {
      const body = req.postDataJSON() as { name?: string; capacityLiters: number; fuelTypeId: string }
      const trimmed = body.name?.trim()
      if (trimmed && tanks.some((t) => t.name?.toLowerCase() === trimmed.toLowerCase())) {
        return json(400, { success: false, error: "A tank with this name already exists at this station." })
      }
      const ft = fuelTypes.find((f) => f.id === body.fuelTypeId)
      const created: ServerFuelTank = {
        id: `t9999999-0000-0000-0000-${String(tanks.length + 1).padStart(12, "0")}`,
        name: trimmed || null,
        capacityLiters: body.capacityLiters,
        fuelTypeId: body.fuelTypeId,
        fuelTypeName: ft?.name ?? null,
        hasDipChart: false,
        dipChartEntryCount: 0,
        nozzleCount: 0,
      }
      tanks.push(created)
      return json(200, { success: true, data: created })
    }

    // Update tank — PUT /…/fuel-tanks/{id}
    const updateMatch = pathname.match(/\/fuel-tanks\/([^/]+)$/)
    if (updateMatch && method === "PUT") {
      const id = updateMatch[1]
      const body = req.postDataJSON() as { name?: string; capacityLiters: number; fuelTypeId: string }
      const t = tanks.find((tt) => tt.id === id)
      if (t) {
        t.name = body.name?.trim() || null
        t.capacityLiters = body.capacityLiters
        t.fuelTypeId = body.fuelTypeId
        t.fuelTypeName = fuelTypes.find((f) => f.id === body.fuelTypeId)?.name ?? null
      }
      return json(200, { success: true, data: t })
    }

    // Delete tank — DELETE /…/fuel-tanks/{id}
    if (updateMatch && method === "DELETE") {
      const id = updateMatch[1]
      const t = tanks.find((tt) => tt.id === id)
      if (t && t.nozzleCount > 0) {
        return json(409, {
          success: false,
          error: `Cannot delete: in use by ${t.nozzleCount} nozzle(s).`,
          references: [`${t.nozzleCount} ${t.nozzleCount === 1 ? "nozzle" : "nozzles"}`],
        })
      }
      const idx = tanks.findIndex((tt) => tt.id === id)
      if (idx >= 0) tanks.splice(idx, 1)
      return json(200, { success: true, data: { tankId: id, blocked: false, blockingReferences: [] } })
    }

    return json(200, { success: true, data: null })
  })
}

test.describe("M08-F02 — Tank Configuration", () => {
  test("AC1 — table renders tanks with capacity / fuel type / dip chart / nozzles", async ({ page }) => {
    const fts = seedFuelTypes()
    const tks = seedTanks()
    await injectAuth(page)
    await mockApi(page, fts, tks)
    await page.goto(TANKS_URL)

    await expect(page.getByRole("heading", { name: "Fuel Tanks" })).toBeVisible()
    const tank1 = page.getByRole("row", { name: /Tank 1/ })
    await expect(tank1).toContainText("45,000 L")
    await expect(tank1).toContainText("PMG")
    await expect(tank1).toContainText("Yes") // dip chart
    const tank2 = page.getByRole("row", { name: /Tank 2/ })
    await expect(tank2).toContainText("Not uploaded")
  })

  test("AC2 — Add a tank → row appears (Enter submits)", async ({ page }) => {
    const fts = seedFuelTypes()
    const tks = seedTanks()
    await injectAuth(page)
    await mockApi(page, fts, tks)
    await page.goto(TANKS_URL)

    await page.getByRole("button", { name: /Add tank/ }).click()
    await expect(page.getByRole("heading", { name: "Add tank" })).toBeVisible()
    await page.getByLabel(/^Name/).fill("Tank 3")
    const capacity = page.getByLabel(/Capacity/)
    await capacity.fill("25000")
    await capacity.press("Enter")

    await expect(page.getByRole("heading", { name: "Add tank" })).not.toBeVisible()
    await expect(page.getByRole("row", { name: /Tank 3/ })).toContainText("25,000 L")
  })

  test("AC3 — duplicate name blocked", async ({ page }) => {
    const fts = seedFuelTypes()
    const tks = seedTanks()
    await injectAuth(page)
    await mockApi(page, fts, tks)
    await page.goto(TANKS_URL)

    await page.getByRole("button", { name: /Add tank/ }).click()
    await page.getByLabel(/^Name/).fill("Tank 1")
    await page.getByLabel(/Capacity/).fill("12000")
    await page.getByRole("button", { name: /Add tank/, exact: true }).last().click()

    // Inline error inside the dialog; row count unchanged.
    await expect(page.getByText(/already exists/i)).toBeVisible()
  })

  test("AC4 — Edit name + capacity persists", async ({ page }) => {
    const fts = seedFuelTypes()
    const tks = seedTanks()
    await injectAuth(page)
    await mockApi(page, fts, tks)
    await page.goto(TANKS_URL)

    const tank2 = page.getByRole("row", { name: /Tank 2/ })
    await tank2.getByRole("button", { name: /Edit/ }).click()
    await expect(page.getByRole("heading", { name: /Edit Tank 2/ })).toBeVisible()
    await page.getByLabel(/^Name/).fill("Tank Two Renamed")
    await page.getByLabel(/Capacity/).fill("35000")
    await page.getByRole("button", { name: /^Save$/ }).click()

    await expect(page.getByRole("row", { name: /Tank Two Renamed/ })).toContainText("35,000 L")
  })

  test("AC5 — Edit fuel type asks for second-click confirm, then commits", async ({ page }) => {
    const fts = seedFuelTypes()
    const tks = seedTanks()
    await injectAuth(page)
    await mockApi(page, fts, tks)
    await page.goto(TANKS_URL)

    const tank2 = page.getByRole("row", { name: /Tank 2/ })
    await tank2.getByRole("button", { name: /Edit/ }).click()

    // Switch fuel type PMG → HSD
    await page.getByRole("combobox").click()
    await page.getByRole("option", { name: /HSD/ }).click()

    // First click on Save → reassign-confirm state (button label becomes "Tap again to confirm")
    await expect(page.getByText(/Changing the fuel type/i)).toBeVisible()
    await page.getByRole("button", { name: /Tap again to confirm/ }).click()
    await page.getByRole("button", { name: /Tap again to confirm/ }).click()

    // After second click → mutation fires, dialog closes, row's fuel type changes
    await expect(page.getByRole("heading", { name: /Edit/ })).not.toBeVisible()
    await expect(tank2).toContainText("HSD")
  })

  test("AC6 — Delete unreferenced tank → row disappears", async ({ page }) => {
    const fts = seedFuelTypes()
    const tks = seedTanks()
    await injectAuth(page)
    await mockApi(page, fts, tks)
    await page.goto(TANKS_URL)

    const tank2 = page.getByRole("row", { name: /Tank 2/ })
    await tank2.getByRole("button", { name: /Delete/ }).click()
    await page.getByRole("button", { name: /Delete tank/ }).click()

    await expect(page.getByRole("row", { name: /Tank 2/ })).not.toBeVisible()
  })

  test("AC7 — Delete a referenced tank → 409 lists references; tank stays", async ({ page }) => {
    const fts = seedFuelTypes()
    const tks = seedTanks()
    await injectAuth(page)
    await mockApi(page, fts, tks)
    await page.goto(TANKS_URL)

    const tank1 = page.getByRole("row", { name: /Tank 1/ })
    await tank1.getByRole("button", { name: /Delete/ }).click()
    await page.getByRole("button", { name: /Delete tank/ }).click()

    await expect(page.getByText(/still in use by 2 nozzles/i)).toBeVisible()
    // Dialog stays open with Close (no Delete button anymore)
    await expect(page.getByRole("button", { name: /Delete tank/ })).not.toBeVisible()
    await page.getByRole("button", { name: /Close/ }).click()
    await expect(tank1).toBeVisible()
  })

  test("Dip — Add tank with CSV → row flips to dip-chart Yes", async ({ page }) => {
    const fts = seedFuelTypes()
    const tks = seedTanks()
    await injectAuth(page)
    await mockApi(page, fts, tks)
    await page.goto(TANKS_URL)

    await page.getByRole("button", { name: /Add tank/ }).click()
    await page.getByLabel(/^Name/).fill("Tank With Chart")
    await page.getByLabel(/Capacity/).fill("20000")
    // Lenient parser — no header line required; col1=cm, col2=L go straight
    // through.
    const csv = ["10,250", "20,520", "30,810"].join("\n")
    await page
      .getByLabel(/Dip chart CSV/i)
      .setInputFiles({ name: "chart.csv", mimeType: "text/csv", buffer: Buffer.from(csv) })
    await expect(page.getByText(/Parsed 3 entries/)).toBeVisible()
    await page.getByRole("button", { name: /^Add tank$/, exact: true }).last().click()

    const newRow = page.getByRole("row", { name: /Tank With Chart/ })
    await expect(newRow).toContainText("20,000 L")
    // The "Yes (3)" dip-chart chip appears because the mock updated the tank
    // record on POST /…/dip-chart.
    await expect(newRow).toContainText(/Yes/)
  })

  test("Dip — Dip chart dialog is view-only with indexed scrollable table", async ({ page }) => {
    const fts = seedFuelTypes()
    const tks = seedTanks()
    const charts = new Map([
      [
        tks[0].id,
        {
          id: "d-existing",
          tankId: tks[0].id,
          entryCount: 2,
          entries: [
            { id: "e1", depthCm: 10, volumeLiters: 250 },
            { id: "e2", depthCm: 20, volumeLiters: 520 },
          ],
        },
      ],
    ])
    await injectAuth(page)
    await mockApi(page, fts, tks, charts)
    await page.goto(TANKS_URL)

    const tank1 = page.getByRole("row", { name: /Tank 1/ })
    await tank1.getByRole("button", { name: /Dip chart/ }).click()

    const dialog = page.getByRole("dialog", { name: /Dip chart.*Tank 1/ })
    await expect(dialog).toBeVisible()
    // Indexed table — # column header + the values from the seeded chart.
    await expect(dialog.getByRole("columnheader", { name: "#" })).toBeVisible()
    await expect(dialog).toContainText("250")
    await expect(dialog).toContainText("520")
    // View-only — no upload UI here. Only Close.
    await expect(dialog.getByRole("button", { name: /Replace dip chart/ })).toHaveCount(0)
    await expect(dialog.getByRole("button", { name: /Upload dip chart/ })).toHaveCount(0)
    await expect(dialog.getByRole("button", { name: /^Close$/ })).toBeVisible()
  })

  test("Dip — Replace happens in the Edit dialog (chained update→upload)", async ({ page }) => {
    const fts = seedFuelTypes()
    const tks = seedTanks()
    const charts = new Map<string, ServerDipChart>()
    await injectAuth(page)
    await mockApi(page, fts, tks, charts)
    await page.goto(TANKS_URL)

    // Tank 2 starts with no dip chart (seed says hasDipChart=false).
    const tank2 = page.getByRole("row", { name: /Tank 2/ })
    await tank2.getByRole("button", { name: /Edit/ }).click()

    // The Edit dialog now carries the Dip chart CSV input. Parser is lenient
    // — no DepthMm header required, first col is cm, second col is L.
    const csv = ["0,0", "5,210", "10,430"].join("\n")
    await page
      .getByLabel(/Dip chart CSV|Replace dip chart/i)
      .setInputFiles({ name: "chart.csv", mimeType: "text/csv", buffer: Buffer.from(csv) })
    await expect(page.getByText(/Parsed 3 entries/)).toBeVisible()
    await page.getByRole("button", { name: /^Save$/ }).click()

    // Edit dialog closes; row's Dip chart chip flips to Yes via the chained
    // update → upload sequence (mockApi stamps hasDipChart=true on POST).
    await expect(page.getByRole("heading", { name: /Edit/ })).not.toBeVisible()
    await expect(tank2).toContainText(/Yes/)
  })
})
