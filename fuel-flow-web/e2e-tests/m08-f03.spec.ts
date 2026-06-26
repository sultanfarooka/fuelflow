/**
 * E2E spec for M08-F03 — Nozzle Configuration (Nozzles child route of
 * Station Configuration, M08-F07-R06).
 *
 * Same pattern as m08-f02 / m08-f08 / m06-f01: inject auth into localStorage
 * and stub fuel-nozzles + fuel-tanks endpoints with Playwright route mocking.
 * Real browser, real router, <FuelNozzlesPanel /> + dialogs against
 * deterministic API responses — no seeded backend required.
 *
 * ACs covered:
 *   AC1  — list renders nozzle number / tank / status / assignments
 *   AC2  — Add a nozzle → row appears
 *   AC3  — duplicate nozzle number on the same tank blocked
 *   AC4  — Edit a nozzle's number → persists
 *   AC5  — Edit a nozzle's tank → reassign confirm + second-click commits
 *   AC6  — Switch OFF an active nozzle → confirm → becomes Inactive
 *   AC7  — Switch OFF then cancel → snaps back to Active (controlled component)
 *   AC8  — Switch ON an inactive nozzle → no confirm, activates immediately
 *   AC9  — Delete an unreferenced nozzle → row disappears
 *   AC10 — Delete a referenced nozzle → 409 dialog lists shift-assignment count
 *
 * AC11 (audit) is backend-only. AC12 (role guard) is covered by
 * M07-F10.spec.ts.
 */
import { test, expect, type Page } from "@playwright/test"

const BASE_URL = "http://localhost:5173"
const ORG_ID = "bbbbbbbb-0000-0000-0000-000000000001"
const STATION_ID = "cccccccc-0000-0000-0000-000000000001"
const OMC_ID = "dddddddd-0000-0000-0000-000000000001"
const NOZZLES_URL = `${BASE_URL}/dashboard/station/${STATION_ID}/configuration/nozzles`

// IDs use only hex digits so they pass Zod's `.uuid()` validation
// (`tankId: z.string().uuid()` on the Add / Edit nozzle form).
const T1 = "11111111-0000-0000-0000-000000000001"
const T2 = "11111111-0000-0000-0000-000000000002"

const N1 = "22222222-0000-0000-0000-000000000001"
const N2 = "22222222-0000-0000-0000-000000000002"
const N3 = "22222222-0000-0000-0000-000000000003"

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

type ServerFuelNozzle = {
  id: string
  nozzleNumber: string
  tankId: string
  tankName: string | null
  stationId: string
  isActive: boolean
  shiftAssignmentCount: number
}

function seedTanks(): ServerFuelTank[] {
  return [
    {
      id: T1,
      name: "Tank 1",
      capacityLiters: 45000,
      fuelTypeId: "f0000000-0000-0000-0000-000000000001",
      fuelTypeName: "PMG",
      hasDipChart: true,
      dipChartEntryCount: 250,
      nozzleCount: 2,
    },
    {
      id: T2,
      name: "Tank 2",
      capacityLiters: 30000,
      fuelTypeId: "f0000000-0000-0000-0000-000000000002",
      fuelTypeName: "HSD",
      hasDipChart: false,
      dipChartEntryCount: 0,
      nozzleCount: 1,
    },
  ]
}

function seedNozzles(): ServerFuelNozzle[] {
  return [
    // Active, no assignments → can be deleted; can be deactivated
    { id: N1, nozzleNumber: "1", tankId: T1, tankName: "Tank 1", stationId: STATION_ID, isActive: true, shiftAssignmentCount: 0 },
    // Active, 3 assignments → delete is blocked by reference guard
    { id: N2, nozzleNumber: "2", tankId: T1, tankName: "Tank 1", stationId: STATION_ID, isActive: true, shiftAssignmentCount: 3 },
    // Inactive → can be activated without confirm
    { id: N3, nozzleNumber: "3", tankId: T2, tankName: "Tank 2", stationId: STATION_ID, isActive: false, shiftAssignmentCount: 0 },
  ]
}

async function injectAuth(page: Page) {
  // The auth-store persist key is `auth-storage`; setItem must happen after a
  // navigation so the page context exists for `evaluate`. Matches m08-f08.
  await page.evaluate(
    ({ orgId, stationId }) => {
      localStorage.setItem(
        "auth-storage",
        JSON.stringify({
          state: {
            isAuthenticated: true,
            expiresIn: 86400,
            devBypassActive: false,
            user: {
              id: "aaaaaaaa-0000-0000-0000-000000000001",
              email: "owner@example.com",
              fullName: "Test Owner",
              roles: ["Owner"],
            },
            organization: { id: orgId, name: "Test Org" },
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
    { orgId: ORG_ID, stationId: STATION_ID },
  )
}

async function mockApi(
  page: Page,
  tanks: ServerFuelTank[],
  nozzles: ServerFuelNozzle[],
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

    // Tanks list — feeds the panel's tank-context sub-line + the Add/Edit Select
    if (pathname === `/api/v1/stations/${STATION_ID}/fuel-tanks` && method === "GET") {
      return json(200, { success: true, data: tanks })
    }

    // Nozzles list
    if (pathname === `/api/v1/stations/${STATION_ID}/fuel-nozzles` && method === "GET") {
      return json(200, { success: true, data: nozzles })
    }

    // Create nozzle
    if (pathname === `/api/v1/stations/${STATION_ID}/fuel-nozzles` && method === "POST") {
      const body = req.postDataJSON() as { nozzleNumber: string; tankId: string }
      const trimmed = body.nozzleNumber.trim()
      // Mirror backend per-tank uniqueness
      if (nozzles.some((n) => n.tankId === body.tankId && n.nozzleNumber.toLowerCase() === trimmed.toLowerCase())) {
        return json(400, { success: false, error: "A nozzle with this number already exists on the chosen tank." })
      }
      const tank = tanks.find((t) => t.id === body.tankId)
      const created: ServerFuelNozzle = {
        id: `99999999-0000-0000-0000-${String(nozzles.length + 1).padStart(12, "0")}`,
        nozzleNumber: trimmed,
        tankId: body.tankId,
        tankName: tank?.name ?? null,
        stationId: STATION_ID,
        isActive: true,
        shiftAssignmentCount: 0,
      }
      nozzles.push(created)
      if (tank) tank.nozzleCount += 1
      return json(200, { success: true, data: created })
    }

    // PATCH /status — activate / deactivate
    const statusMatch = pathname.match(/\/fuel-nozzles\/([^/]+)\/status$/)
    if (statusMatch && method === "PATCH") {
      const id = statusMatch[1]
      const body = req.postDataJSON() as { isActive: boolean }
      const n = nozzles.find((nn) => nn.id === id)
      if (n) n.isActive = body.isActive
      return json(200, { success: true, data: { nozzleId: id, isActive: body.isActive } })
    }

    // PUT /{id} — update number / tank
    const idMatch = pathname.match(/\/fuel-nozzles\/([^/]+)$/)
    if (idMatch && method === "PUT") {
      const id = idMatch[1]
      const body = req.postDataJSON() as { nozzleNumber: string; tankId: string }
      const n = nozzles.find((nn) => nn.id === id)
      if (n) {
        n.nozzleNumber = body.nozzleNumber.trim()
        n.tankId = body.tankId
        n.tankName = tanks.find((t) => t.id === body.tankId)?.name ?? null
      }
      return json(200, { success: true, data: n })
    }

    // DELETE /{id}
    if (idMatch && method === "DELETE") {
      const id = idMatch[1]
      const n = nozzles.find((nn) => nn.id === id)
      if (n && n.shiftAssignmentCount > 0) {
        return json(409, {
          success: false,
          error: `Cannot delete: in use by ${n.shiftAssignmentCount} shift assignments.`,
          references: [`${n.shiftAssignmentCount} shift assignments`],
        })
      }
      const idx = nozzles.findIndex((nn) => nn.id === id)
      if (idx >= 0) nozzles.splice(idx, 1)
      return json(200, { success: true, data: { nozzleId: id, blocked: false, blockingReferences: [] } })
    }

    return json(200, { success: true, data: null })
  })
}

/**
 * Boot helper — the auth-store persist key is `auth-storage`, but
 * `localStorage.setItem` only works once a page context exists. So we
 * navigate to `/` first (a public route that doesn't need auth), seed
 * the store, then navigate to the nozzles URL. Same shape as m08-f08.
 */
async function boot(
  page: Page,
  tks: ServerFuelTank[],
  nzs: ServerFuelNozzle[],
) {
  await mockApi(page, tks, nzs)
  await page.goto(BASE_URL)
  await injectAuth(page)
  await page.goto(NOZZLES_URL)
}

/**
 * Match a nozzle row by the Switch's aria-label, which is the only cell text
 * uniquely tied to a single nozzle (number alone collides with assignment
 * counts and tank names, e.g. "Tank 2" + nozzle "2"). For an active nozzle
 * the label is "Deactivate nozzle <n>"; for an inactive one it's
 * "Activate nozzle <n>".
 */
function nozzleRow(
  page: Page,
  match: { number: string; active: boolean },
) {
  const verb = match.active ? "Deactivate" : "Activate"
  return page.getByRole("row").filter({
    has: page.getByRole("switch", { name: new RegExp(`${verb} nozzle ${match.number}$`) }),
  })
}

test.describe("M08-F03 — Nozzle Configuration", () => {
  // Pixel 5 viewport flips DataTable into its mobile-card variant (cards are
  // plain divs, not role=row), so the row-based assertions don't apply.
  // Same constraint as m08-f02 / m08-f08 — desktop-only spec.
  test.beforeEach(({}, testInfo) => {
    test.skip(
      testInfo.project.name === "mobile-chrome",
      "Desktop table assertions only; mobile-card variant is visually verified.",
    )
  })

  test("AC1 — list renders nozzle / tank / status / assignment count", async ({ page }) => {
    await boot(page, seedTanks(), seedNozzles())

    const row1 = nozzleRow(page, { number: "1", active: true })
    await expect(row1).toContainText("Tank 1")
    await expect(row1).toContainText("PMG")
    await expect(row1).toContainText("Active")

    const row2 = nozzleRow(page, { number: "2", active: true })
    await expect(row2).toContainText("3") // N2 assignment count

    const row3 = nozzleRow(page, { number: "3", active: false })
    await expect(row3).toContainText("Inactive")
  })

  test("AC2 — Add a nozzle → row appears", async ({ page }) => {
    await boot(page, seedTanks(), seedNozzles())
    // Wait until tanks have loaded so the Tank Select has a default value
    // (button is disabled until tankId is set).
    await expect(nozzleRow(page, { number: "1", active: true })).toBeVisible()

    await page.getByRole("button", { name: /Add nozzle/ }).click()
    await expect(page.getByRole("heading", { name: "Add nozzle" })).toBeVisible()
    await page.getByLabel(/Nozzle number/).fill("9")
    // Tank Select defaults to first tank (Tank 1). The submit button shares
    // its label with the header's open-dialog button, so `.last()` picks the
    // form's submit.
    await page.getByRole("button", { name: /^Add nozzle$/, exact: true }).last().click()

    await expect(page.getByRole("heading", { name: "Add nozzle" })).not.toBeVisible()
    await expect(nozzleRow(page, { number: "9", active: true })).toContainText("Tank 1")
  })

  test("AC3 — duplicate nozzle number on the same tank blocked", async ({ page }) => {
    await boot(page, seedTanks(), seedNozzles())
    await expect(nozzleRow(page, { number: "1", active: true })).toBeVisible()

    await page.getByRole("button", { name: /Add nozzle/ }).click()
    // N1 is "1" on Tank 1; default tank is Tank 1 → duplicate.
    await page.getByLabel(/Nozzle number/).fill("1")
    await page.getByRole("button", { name: /^Add nozzle$/, exact: true }).last().click()

    await expect(page.getByText(/already exists/i)).toBeVisible()
  })

  test("AC4 — Edit nozzle number persists", async ({ page }) => {
    await boot(page, seedTanks(), seedNozzles())

    const row1 = nozzleRow(page, { number: "1", active: true })
    await row1.getByRole("button", { name: /Edit/ }).click()
    await expect(page.getByRole("heading", { name: /Edit nozzle 1/ })).toBeVisible()

    await page.getByLabel(/Nozzle number/).fill("1A")
    await page.getByRole("button", { name: /^Save$/ }).click()

    await expect(page.getByRole("heading", { name: /Edit nozzle/ })).not.toBeVisible()
    await expect(nozzleRow(page, { number: "1A", active: true })).toBeVisible()
  })

  test("AC5 — Edit tank shows reassign confirm + second-click commits", async ({ page }) => {
    await boot(page, seedTanks(), seedNozzles())

    const row1 = nozzleRow(page, { number: "1", active: true })
    await row1.getByRole("button", { name: /Edit/ }).click()

    await page.getByRole("combobox").click()
    await page.getByRole("option", { name: /Tank 2/ }).click()

    await expect(page.getByText(/Moving this nozzle to a different tank/i)).toBeVisible()
    // First click only sets the confirmation flag; the next render flips the
    // button label back to "Save" so the second click is on Save.
    await page.getByRole("button", { name: /Tap again to confirm/ }).click()
    await page.getByRole("button", { name: /^Save$/ }).click()

    await expect(page.getByRole("heading", { name: /Edit nozzle/ })).not.toBeVisible()
    await expect(row1).toContainText("Tank 2")
  })

  test("AC6 — Switch OFF an active nozzle → confirm → becomes Inactive", async ({ page }) => {
    await boot(page, seedTanks(), seedNozzles())

    const row1 = nozzleRow(page, { number: "1", active: true })
    await row1.getByRole("switch", { name: /Deactivate nozzle 1/ }).click()
    await expect(page.getByRole("heading", { name: /Deactivate nozzle 1/ })).toBeVisible()
    await page.getByRole("button", { name: /^Deactivate$/ }).click()

    await expect(page.getByRole("heading", { name: /Deactivate nozzle 1/ })).not.toBeVisible()
    // Row is now matched by the "Activate nozzle 1" switch label.
    await expect(nozzleRow(page, { number: "1", active: false })).toContainText("Inactive")
  })

  test("AC7 — Switch OFF then cancel → snaps back to Active", async ({ page }) => {
    await boot(page, seedTanks(), seedNozzles())

    const row1 = nozzleRow(page, { number: "1", active: true })
    await row1.getByRole("switch", { name: /Deactivate nozzle 1/ }).click()
    await expect(page.getByRole("heading", { name: /Deactivate nozzle 1/ })).toBeVisible()
    await page.getByRole("button", { name: /^Cancel$/ }).click()

    // Controlled component — switch reflects the unchanged query data, stays
    // checked (aria-checked=true) and the status badge stays Active.
    await expect(row1).toContainText("Active")
    await expect(row1.getByRole("switch", { name: /Deactivate nozzle 1/ })).toBeChecked()
  })

  test("AC8 — Switch ON an inactive nozzle → activates immediately, no confirm", async ({ page }) => {
    await boot(page, seedTanks(), seedNozzles())

    const row3 = nozzleRow(page, { number: "3", active: false })
    await row3.getByRole("switch", { name: /Activate nozzle 3/ }).click()

    await expect(page.getByRole("heading", { name: /Deactivate/ })).not.toBeVisible()
    await expect(nozzleRow(page, { number: "3", active: true })).toContainText("Active")
  })

  test("AC9 — Delete an unreferenced nozzle → row disappears", async ({ page }) => {
    await boot(page, seedTanks(), seedNozzles())

    const row1 = nozzleRow(page, { number: "1", active: true })
    await row1.getByRole("button", { name: /Delete/ }).click()
    await expect(page.getByRole("heading", { name: /Delete nozzle 1/ })).toBeVisible()
    await page.getByRole("button", { name: /Delete nozzle/ }).click()

    await expect(nozzleRow(page, { number: "1", active: true })).not.toBeVisible()
  })

  test("AC10 — Delete a referenced nozzle → 409 lists references; nozzle stays", async ({ page }) => {
    await boot(page, seedTanks(), seedNozzles())

    const row2 = nozzleRow(page, { number: "2", active: true })
    await row2.getByRole("button", { name: /Delete/ }).click()
    await page.getByRole("button", { name: /Delete nozzle/ }).click()

    await expect(page.getByText(/still in use by 3 shift assignments/i)).toBeVisible()
    await expect(page.getByRole("button", { name: /Delete nozzle/ })).not.toBeVisible()
    await page.getByRole("button", { name: /Close/ }).click()
    await expect(row2).toBeVisible()
  })
})
