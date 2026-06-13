import { test, expect, Page } from "@playwright/test";

/**
 * M01-F05-R02 — Owner can create Manager users (+ M01-F09-R07 OTP toggle).
 *
 * Coverage note: the full create-Manager POST requires a real auth cookie AND an
 * onboarded Owner whose signup OTP is delivered via the dev console (unreadable by a
 * headless run), so the successful create choreography is verified by the manual
 * Playwright-MCP walk recorded in docs/implementation/M01-F05-R02.md. These regression
 * specs cover what is headlessly reproducible: the Owner-only route gate (incl. the
 * case-insensitive role fix), the create-form rendering + client-side validation (auth
 * injected, managers list stubbed), and the public /auth/activate screen against the
 * real anonymous endpoint.
 */

const ORG_ID = "bbbbbbbb-0000-0000-0000-00000f050200";
const STATION_ID = "cccccccc-0000-0000-0000-00000f050200";

async function injectAuth(page: Page, roles: string[]) {
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
              id: "aaaaaaaa-0000-0000-0000-00000f050200",
              email: "owner@r02.test",
              phone: "+923475550502",
              fullName: "R02 Owner",
              roles,
            },
            organization: { id: orgId, name: "R02 Org" },
            stations: [
              {
                id: stationId,
                name: "Station Alpha",
                isSetupComplete: true,
                acceptedPaymentMethods: ["Cash"],
              },
            ],
            subscription: {
              status: "trial",
              planId: "11111111-1111-1111-1111-111111111102",
              planName: "Professional",
              endsAt: "2026-07-06T00:00:00Z",
            },
          },
          version: 0,
        }),
      );
    },
    { roles, orgId: ORG_ID, stationId: STATION_ID },
  );
}

// Stub the managers list so the page renders without a real auth cookie (which would
// 401 → refresh → logout-redirect). The successful create POST is MCP-walked, not stubbed.
async function stubManagersList(page: Page) {
  await page.route("**/api/v1/users/managers", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: [] }),
      });
    } else {
      await route.continue();
    }
  });
}

test("M01_F05_R02 — owner sees the users page and the create-manager form", async ({
  page,
}) => {
  await page.goto("/");
  await injectAuth(page, ["Owner"]);
  await stubManagersList(page);
  await page.goto("/settings/users");

  await expect(
    page.getByRole("heading", { name: "Users", level: 1 }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Add manager" }).click();

  await expect(page.getByRole("textbox", { name: "Full name" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Phone" })).toBeVisible();
  await expect(
    page.getByRole("checkbox", { name: "Station Alpha" }),
  ).toBeVisible();
  await expect(
    page.getByRole("checkbox", { name: /Require phone verification/ }),
  ).toBeChecked();
  await expect(
    page.getByRole("button", { name: "Create manager" }),
  ).toBeVisible();
});

test("M01_F05_R02 — create-manager form requires at least one station", async ({
  page,
}) => {
  await page.goto("/");
  await injectAuth(page, ["Owner"]);
  await stubManagersList(page);
  await page.goto("/settings/users");

  await page.getByRole("button", { name: "Add manager" }).click();
  await page.getByRole("textbox", { name: "Full name" }).fill("Test Manager");
  await page.getByRole("textbox", { name: "Phone" }).fill("+923009990601");
  // Leave all station checkboxes unchecked.
  await page.getByRole("button", { name: "Create manager" }).click();

  await expect(
    page.getByText("Assign at least one station", { exact: true }),
  ).toBeVisible();
});

test("M01_F05_R02 — non-owner is redirected away from the users page", async ({
  page,
}) => {
  await page.goto("/");
  await injectAuth(page, ["Nozzleman"]);
  await stubManagersList(page);
  await page.goto("/settings/users");

  await expect(page).not.toHaveURL(/\/settings\/users/);
  await expect(
    page.getByRole("button", { name: "Add manager" }),
  ).not.toBeVisible();
});

test("M01_F05_R02 — owner-only gate is case-insensitive (lowercase role)", async ({
  page,
}) => {
  // The API historically serialized roles lowercase; the gate must still admit the Owner.
  await page.goto("/");
  await injectAuth(page, ["owner"]);
  await stubManagersList(page);
  await page.goto("/settings/users");

  await expect(
    page.getByRole("heading", { name: "Users", level: 1 }),
  ).toBeVisible();
});

test("M01_F09_R07 — activation screen requires a phone param", async ({
  page,
}) => {
  await page.goto("/auth/activate");
  await expect(
    page.getByRole("heading", { name: "Missing phone number" }),
  ).toBeVisible();
});

test("M01_F09_R07 — activation rejects an invalid code", async ({ page }) => {
  await page.goto("/auth/activate?phone=%2B923000000000");
  await expect(
    page.getByRole("heading", { name: "Activate your account" }),
  ).toBeVisible();

  await page.getByRole("textbox", { name: "Verification code" }).fill("000000");
  await page
    .getByRole("textbox", { name: "Password", exact: true })
    .fill("Newpass1");
  await page
    .getByRole("textbox", { name: "Confirm password" })
    .fill("Newpass1");
  await page.getByRole("button", { name: "Activate account" }).click();

  // Real anonymous /auth/activate returns a generic 400 for an unknown / no-active-OTP phone.
  // Scope to the form to avoid also matching the Sonner toast with the same copy.
  await expect(
    page
      .locator("#activate-account-form")
      .getByText(/expired or has been used too many times/i),
  ).toBeVisible();
});
