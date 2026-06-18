/**
 * E2E spec for M08-F08 — Fuel Type Management (Fuel Types tab of Station
 * Configuration, M08-F07).
 *
 * Approach: this feature's panel is data-driven (real authenticated API calls),
 * so — consistent with the repo's faked-auth E2E style (see M08-F07.spec.ts,
 * which injects localStorage rather than logging in) — we inject auth AND stub
 * the fuel-type endpoints with Playwright route mocking. This exercises the real
 * browser, the real router, and the real <FuelTypesPanel> component + dialogs
 * against deterministic API responses (including the 409 deactivation guard),
 * with no dependency on seeded/onboarded backend data.
 *
 * ACs covered:
 *   AC1 (R01) — list renders name/unit/source/status/tanks/sellable
 *   AC2 (R02) — add a custom type → appears Active + "Not yet sellable"
 *   AC3 (R02) — duplicate name (API 400) → error surfaced, not added
 *   AC4 (R04) — deactivate an unreferenced type → becomes Inactive
 *   AC5 (R05) — deactivating a referenced type → 409, dialog lists references,
 *               type stays Active
 */
import { test, expect, type Page } from "@playwright/test"

const BASE_URL = "http://localhost:5173"
const ORG_ID = "bbbbbbbb-0000-0000-0000-000000000001"
const STATION_ID = "cccccccc-0000-0000-0000-000000000001"
const OMC_ID = "dddddddd-0000-0000-0000-000000000001"
const CONFIG_URL = `${BASE_URL}/dashboard/station/${STATION_ID}/configuration`

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

function seedFuelTypes(): ServerFuelType[] {
  return [
    {
      id: "f0000000-0000-0000-0000-000000000001",
      name: "PMG",
      unit: "L",
      isCustom: false,
      omcId: OMC_ID,
      source: "OMC",
      isActive: true,
      tankCount: 2,
      hasActivePrice: true,
      isSellable: true, // referenced → deactivation must be blocked (AC5)
    },
    {
      id: "f0000000-0000-0000-0000-000000000002",
      name: "HSD",
      unit: "L",
      isCustom: false,
      omcId: OMC_ID,
      source: "OMC",
      isActive: true,
      tankCount: 0,
      hasActivePrice: false,
      isSellable: false, // unreferenced → deactivation allowed (AC4)
    },
  ]
}

async function injectAuth(page: Page, roles: string[] = ["Owner"]) {
  await page.evaluate(
    ({ roles, orgId, stationId }) => {
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
            organization: { id: orgId, name: "Khan Petroleum" },
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
              planId: "11111111-1111-1111-1111-111111111102",
              planName: "Professional",
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
 * Stub every /api/v1/** call. Fuel-type list/create/rename/status are stateful
 * over `fuelTypes`; everything else returns a benign 200 so the SPA's 401
 * interceptor never fires.
 */
async function mockApi(page: Page, fuelTypes: ServerFuelType[]) {
  await page.route("**/api/v1/**", async (route) => {
    const req = route.request()
    const { pathname } = new URL(req.url())
    const method = req.method()
    const json = (status: number, body: unknown) =>
      route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) })

    // OMC catalog
    if (pathname.endsWith("/omc-fuel-types")) {
      return json(200, {
        success: true,
        data: [
          { id: "o0000000-0000-0000-0000-000000000003", omcId: OMC_ID, omcName: "PSO", name: "HOBC", unit: "L" },
        ],
      })
    }

    // Org stations (resolve station OMC) — GET /stations/{orgId}
    if (pathname === `/api/v1/stations/${ORG_ID}`) {
      return json(200, {
        success: true,
        data: [{ id: STATION_ID, name: "Station Alpha", isActive: true, omcId: OMC_ID }],
      })
    }

    // Status toggle — PATCH /stations/{stationId}/fuel-types/{id}/status
    if (pathname.endsWith("/status") && method === "PATCH") {
      const id = pathname.split("/").slice(-2)[0]
      const ft = fuelTypes.find((f) => f.id === id)
      const body = req.postDataJSON() as { isActive: boolean }
      if (ft && body.isActive === false && (ft.tankCount > 0 || ft.hasActivePrice)) {
        const references = [
          ...(ft.tankCount > 0 ? [ft.tankCount === 1 ? "1 tank" : `${ft.tankCount} tanks`] : []),
          ...(ft.hasActivePrice ? ["an active price"] : []),
        ]
        return json(409, { success: false, error: `Cannot deactivate: in use by ${references.join(" and ")}.`, references })
      }
      if (ft) ft.isActive = body.isActive
      return json(200, { success: true, data: { fuelTypeId: id, isActive: body.isActive, blocked: false, blockingReferences: [] } })
    }

    // Rename — PUT /stations/{stationId}/fuel-types/{id}
    if (pathname.match(/\/fuel-types\/[^/]+$/) && method === "PUT") {
      const id = pathname.split("/").pop()!
      const ft = fuelTypes.find((f) => f.id === id)
      const body = req.postDataJSON() as { name: string }
      if (ft) ft.name = body.name
      return json(200, { success: true })
    }

    // List / create — /stations/{stationId}/fuel-types
    if (pathname.endsWith(`/stations/${STATION_ID}/fuel-types`)) {
      if (method === "GET") return json(200, { success: true, data: fuelTypes })
      if (method === "POST") {
        const body = req.postDataJSON() as { name: string; unit: string; isCustom: boolean; omcId?: string }
        if (fuelTypes.some((f) => f.name.toLowerCase() === body.name.trim().toLowerCase())) {
          return json(400, { success: false, error: `A fuel type named "${body.name}" already exists for this station.` })
        }
        const created: ServerFuelType = {
          id: `f0000000-0000-0000-0000-0000000000${(fuelTypes.length + 1).toString().padStart(2, "0")}`,
          name: body.name.trim(),
          unit: body.unit,
          isCustom: body.isCustom,
          omcId: body.omcId ?? null,
          source: body.isCustom ? "Custom" : "OMC",
          isActive: true,
          tankCount: 0,
          hasActivePrice: false,
          isSellable: false,
        }
        fuelTypes.push(created)
        return json(200, { success: true, data: { id: created.id, name: created.name, unit: created.unit, isCustom: created.isCustom, omcId: created.omcId } })
      }
    }

    // Anything else (e.g. /auth/me) — benign success so the 401 path never runs.
    return json(200, { success: true, data: {} })
  })
}

async function openFuelTypesTab(page: Page, fuelTypes: ServerFuelType[], roles: string[] = ["Owner"]) {
  await mockApi(page, fuelTypes)
  await page.goto(BASE_URL)
  await injectAuth(page, roles)
  await page.goto(CONFIG_URL)
  // Fuel Types is the default tab; the panel's "Add fuel type" button is always
  // present once the panel mounts (CardTitle is a div, not a heading role).
  await expect(page.getByRole("button", { name: "Add fuel type" })).toBeVisible()
}

// ── AC1 ─────────────────────────────────────────────────────────────────────
test("M08_F08_R01 lists fuel types with source, status, tanks and sellable", async ({ page }) => {
  await openFuelTypesTab(page, seedFuelTypes())

  const pmgRow = page.getByRole("row", { name: /PMG/ })
  await expect(pmgRow).toBeVisible()
  await expect(pmgRow.getByText("OMC")).toBeVisible()
  await expect(pmgRow.getByText("Active")).toBeVisible()
  await expect(pmgRow.getByText("Sellable", { exact: true })).toBeVisible()

  const hsdRow = page.getByRole("row", { name: /HSD/ })
  await expect(hsdRow.getByText("Not yet sellable")).toBeVisible()
})

// ── AC2 ─────────────────────────────────────────────────────────────────────
test("M08_F08_R02 adds a custom fuel type, shown as not-yet-sellable", async ({ page }) => {
  await openFuelTypesTab(page, seedFuelTypes())

  await page.getByRole("button", { name: "Add fuel type" }).click()
  // Default mode is custom when triggered; ensure custom fields present.
  await page.getByLabel("Name").fill("Diesel Premium")
  await page.getByRole("button", { name: "Add", exact: true }).click()

  const newRow = page.getByRole("row", { name: /Diesel Premium/ })
  await expect(newRow).toBeVisible()
  await expect(newRow.getByText("Custom")).toBeVisible()
  await expect(newRow.getByText("Active")).toBeVisible()
  await expect(newRow.getByText("Not yet sellable")).toBeVisible()
})

// ── AC3 ─────────────────────────────────────────────────────────────────────
test("M08_F08_R02 rejects a duplicate fuel-type name", async ({ page }) => {
  await openFuelTypesTab(page, seedFuelTypes())

  await page.getByRole("button", { name: "Add fuel type" }).click()
  // Client-side guard catches the dup first (matches the loaded list).
  await page.getByLabel("Name").fill("PMG")
  await page.getByRole("button", { name: "Add", exact: true }).click()

  await expect(page.getByText(/already exists/i)).toBeVisible()
  // Close the dialog (its modal hides the table from the a11y tree), then
  // confirm no duplicate row was added — still exactly one PMG.
  await page.getByRole("button", { name: "Cancel" }).click()
  await expect(page.getByRole("row", { name: /PMG/ })).toHaveCount(1)
})

// ── AC4 ─────────────────────────────────────────────────────────────────────
test("M08_F08_R04 deactivates a fuel type with no references", async ({ page }) => {
  await openFuelTypesTab(page, seedFuelTypes())

  const hsdRow = page.getByRole("row", { name: /HSD/ })
  await hsdRow.getByRole("button", { name: "Deactivate" }).click()
  // Confirm dialog → Deactivate
  await page.getByRole("button", { name: "Deactivate" }).last().click()

  await expect(hsdRow.getByText("Inactive")).toBeVisible()
})

// ── AC5 ─────────────────────────────────────────────────────────────────────
test("M08_F08_R05 blocks deactivation of a referenced type (409) and lists references", async ({ page }) => {
  await openFuelTypesTab(page, seedFuelTypes())

  const pmgRow = page.getByRole("row", { name: /PMG/ })
  await pmgRow.getByRole("button", { name: "Deactivate" }).click()
  await page.getByRole("button", { name: "Deactivate" }).last().click()

  // 409 → dialog shows the blocking references; type stays Active.
  await expect(page.getByText(/still in use by/i)).toBeVisible()
  await expect(page.getByText(/2 tanks/)).toBeVisible()
  // Dismiss the dialog (Escape) — the type stays Active (deactivation blocked).
  await page.keyboard.press("Escape")
  await expect(pmgRow.getByText("Active")).toBeVisible()
})
