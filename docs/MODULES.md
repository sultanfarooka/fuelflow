# Fuel Flow — Modules, Features & Requirements

> Single source of truth for all modules, features, and requirements.
> Every item has a stable hierarchical ID that can be referenced anywhere — code, commits, PR titles, GitHub Issues, tests, conversations.

**Last Updated:** 2026-05-23
**Single SoT since:** 2026-05-16 (consolidates the former `PRD.md` §5+§7 and `IMPLEMENTATION_STATUS.md` priority queue; tech-stack / architecture / API / schema / UI reference content moved to scoped `CLAUDE.md` files — see root [`CLAUDE.md`](../CLAUDE.md) Rule 9)

---

## How to Read This File

- **Modules:** `M01` … `M11`
- **Features inside each module:** `F01`, `F02`, …
- **Requirements inside each feature:** `R01`, `R02`, …
- **Acceptance criteria** are referenced as `M03-F02-R01.AC1`, `.AC2`, …
- **Legacy IDs** (SH-001, PR-001, INV-001, CR-001, REG-001, SUB-001, AUD-001, FG-001) are preserved in the Legacy column for backwards compatibility with existing PRs, commits, and code comments.

**Reference an item anywhere as e.g.** `M04-F03-R01` (PR title, commit, test name, issue, code comment).

---

## Status Legend

> **Done means shipped — forever. Suffix it `· refined by [ID]` / `· extended by [ID]` when the new row adds, `· superseded by [ID]` when the new row replaces. `· superseded` rolls up; the rest stay Done.**

| Status | Meaning | Counts as for feature-header roll-up |
|---|---|---|
| `Done` | Merged to main, tested. Untouched since. | Done |
| `Done · refined by [ID]` | Shipped, but a later row at `[ID]` narrows / clarifies it. The original rule still holds. | Done |
| `Done · extended by [ID]` | Shipped, but a later row at `[ID]` adds new branches / options. The original rule still holds. | Done |
| `Done · superseded by [ID]` | Shipped, but a later row at `[ID]` replaces its behavior. The original row is reference-only. | **In Progress** (rolls up) |
| `In Progress` | Active development | In Progress |
| `Planned` | Not yet started | Planned |
| `Out of Scope` | Explicitly deferred / v2+ | Doesn't block roll-up |

**Header roll-up.** A feature header's status equals the *lowest* status of any row underneath it, where `Done` and `Done · refined/extended` count as Done, and `Done · superseded` / `In Progress` / `Planned` count as not-yet-done. `Out of Scope` rows are excluded from roll-up.

**When to use which suffix.** When a later row touches an existing `Done` row, ask: *could this missing piece have been written when the original feature shipped, with the knowledge available at that time?* If **no** (a new feature introduced new context), use `· refined by` or `· extended by` — the original was complete-for-its-time. If **yes** (the original was wrong or incomplete by its own standards), use `· superseded by` — the row is no longer authoritative and the header rolls up.

---

## Module Index

| ID | Module | Status | Legacy Rule Prefix |
|---|---|---|---|
| [M01](#m01--user--access-management) | User & Access Management | In Progress | REG-*, AUD-* |
| [M02](#m02--fuel-inventory--tank-control) | Fuel Inventory & Tank Control | In Progress | INV-* |
| [M03](#m03--pump--nozzle-operations) | Pump & Nozzle Operations | In Progress | — |
| [M04](#m04--shift-management) | Shift Management | Planned | SH-* |
| [M05](#m05--finance--accounts) | Finance & Accounts | Planned | CR-* |
| [M06](#m06--pricing--rate-management) | Pricing & Rate Management | Planned | PR-* |
| [M07](#m07--reporting--analytics) | Reporting & Analytics | In Progress | — |
| [M08](#m08--settings--configuration) | Settings & Configuration | In Progress | — |
| [M09](#m09--lubricants--oil-shop) | Lubricants / Oil Shop | Planned | — |
| [M10](#m10--sms--notifications) | SMS / Notifications | Planned | — |
| [M11](#m11--subscription--billing) | Subscription & Billing | In Progress | SUB-*, FG-* |

---

## Current Priorities

The next pieces of work, in order. Each row references the `MXX-FXX-RXX` ID that drives the branch name (Rule 4), commit scopes (Rule 7), PR title (Rule 5), and status flip (Rule 2).

| # | ID | Title | Area |
|---|---|---|---|
| 1 | [M07-F07](#m07-f07--ui-shell)   | Basic UI shell (layout, sidebar, navigation) | Frontend |
| 2 | [M01-F09](#m01-f09--phone-first-authentication) | Phone-first authentication (SMS OTP, phone-primary login, email optional) | Full-stack |
| 3 | [M01-F05-R02](#m01-f05--roles--hierarchy), [M01-F05-R03](#m01-f05--roles--hierarchy), [M01-F06](#m01-f06--granular-permissions) | User management — Owner creates Managers; Managers create Custom Users with granular permissions | Backend |
| 4 | [M11-F08](#m11-f08--plan-comparison--pricing-page) | Pricing page (plan comparison, monthly/yearly toggle) | Frontend |

> When you pick up an item: flip its row to **In Progress** in the relevant feature table below, in the same commit that starts the work. When done: flip to **Done** in the same PR that ships it.

---

## M01 — User & Access Management

**Purpose:** Self-service registration, authentication, role-based authorization, granular permissions, multi-station access, and audit logging.

### M01-F01 — Self-Service Registration   [Status: Done]

Public station-owner registration. Form captures owner info only — organization and first station are created later during onboarding (see [M08-F01](#m08-f01--station-profile)).

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M01-F01-R01 | Email, **when provided**, must be unique across all users | REG-001 | Done · refined by [M01-F09-R01](#m01-f09--phone-first-authentication) |
| M01-F01-R02 | Registration creates Owner user only; org + first station deferred to onboarding | REG-002 | Done |
| M01-F01-R03 | Phone number validated as Pakistani format `+92XXXXXXXXXX` | REG-003 | Done |
| M01-F01-R04 | Email must be verified before it can be used as a fallback login channel | REG-004 | Done · refined by [M01-F09-R03](#m01-f09--phone-first-authentication) |
| M01-F01-R05 | Password minimum 6 characters, must include at least one number | — | Done |

**Acceptance Criteria:**
- **AC1** Given a duplicate email, When user submits registration, Then API returns `409 Conflict`.
- **AC2** Given a valid registration payload, When submitted, Then a verification email is sent and the user is created with `EmailConfirmed = false`.
- **AC3** Given an unverified user, When they attempt to log in, Then login is blocked with a clear "verify your email" message.
- **AC4** Given an invalid Pakistani phone format, When user registers, Then validation fails with a specific phone-format error.

---

### M01-F02 — Email Verification   [Status: Done]

Email verification flow with resend capability.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M01-F02-R01 | Verification token has bounded lifetime and is single-use | — | Done |
| M01-F02-R02 | Resend-verification endpoint available for unverified users | — | Done |
| M01-F02-R03 | Verification success transitions account to active and allows login | — | Done |

**Acceptance Criteria:**
- **AC1** Given an expired verification token, When user clicks the link, Then API returns a clear "expired token" error and offers a resend action.
- **AC2** Given an already-used token, When clicked again, Then API responds idempotently (no error if account already verified).

---

### M01-F03 — Login & Session   [Status: Done]

Email/password login + PIN-based quick login, with DB-backed refresh tokens stored in HTTP-only cookies.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M01-F03-R01 | Phone + password login issues short-lived JWT + DB-backed refresh token; email + password is a fallback path that resolves only when the user has a verified email | — | Done · refined by [M01-F09-R05](#m01-f09--phone-first-authentication) |
| M01-F03-R02 | PIN-based quick login for nozzlemen/managers on shared devices | — | Planned |
| M01-F03-R03 | Refresh tokens stored hashed, rotated on every refresh, reuse triggers revocation | — | Done |
| M01-F03-R04 | Multi-device simultaneous login allowed (one row per session) | — | Done |
| M01-F03-R05 | Each refresh-token row captures IP, User-Agent, optional DeviceId | — | Done |
| M01-F03-R06 | Logout revokes the refresh token and clears the cookie | — | Done |
| M01-F03-R07 | Default refresh-token expiry 7 days (configurable later) | — | Done |
| M01-F03-R08 | Session idle timeout is user-configurable | — | Planned |

**Acceptance Criteria:**
- **AC1** Given a logged-in user, When they call `/auth/logout`, Then the refresh-token row is marked revoked and subsequent refresh attempts fail.
- **AC2** Given a stolen refresh token used after rotation, When detected, Then the entire token chain for that session is revoked (breach indicator).

---

### M01-F04 — Password Recovery   [Status: Done]

Self-service password reset via email, plus Owner-initiated reset for sub-users.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M01-F04-R01 | Forgot-password sends a one-time reset link by email when the user has a verified email; offered alongside phone OTP when both channels are set | — | Done · extended by [M01-F09-R08](#m01-f09--phone-first-authentication) |
| M01-F04-R02 | Reset token expires after 24 hours and is single-use | — | Done |
| M01-F04-R03 | Owner can force-reset password for any user in their organization | — | Planned |
| M01-F04-R04 | SMS OTP recovery — user chooses phone OTP or email link when both are set (revived by, and implemented as part of, [M01-F09-R08](#m01-f09--phone-first-authentication)) | — | Done |

---

### M01-F05 — Roles & Hierarchy   [Status: In Progress]

Three-tier role system: Owner → Manager → Custom Users.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M01-F05-R01 | Owner role is system-created at registration; full access to org | — | Done |
| M01-F05-R02 | Owner can create Manager users | — | Planned |
| M01-F05-R03 | Manager can create Custom Users with granular permissions | — | Planned |
| M01-F05-R04 | Role-based authorization middleware enforces role on every endpoint | — | Done |

**Acceptance Criteria:**
- **AC1** Given a Manager, When they call an Owner-only endpoint, Then API returns `403 Forbidden` with no implementation details leaked.

---

### M01-F06 — Granular Permissions   [Status: Planned]

Per-module permission system (View / Edit / Delete / No Access) for Custom Users.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M01-F06-R01 | Each Custom User has a permission set per module (View/Edit/Delete/None) | — | Planned |
| M01-F06-R02 | Permission checks enforced at API level (not just UI) | — | Planned |
| M01-F06-R03 | Manager can be assigned to multiple stations within the same org | — | Planned |
| M01-F06-R04 | Permission changes take effect on the user's next API call (no restart needed) | — | Planned |

---

### M01-F07 — Multi-Station Access   [Status: In Progress]

Owner sees consolidated view across all stations; Managers scoped to assigned stations; Nozzlemen scoped to one station at a time.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M01-F07-R01 | EF Core global query filters enforce StationId tenant isolation automatically | — | Done |
| M01-F07-R02 | Owner role bypasses station filter for consolidated cross-station views | — | Done |
| M01-F07-R03 | Station A's users cannot see Station B's data | — | Done |
| M01-F07-R04 | Owner dashboard shows all stations' stats at a glance | — | Planned |
| M01-F07-R05 | Drill-down from "All Stations" to individual station detail | — | Planned |

---

### M01-F08 — Audit Trail   [Status: Planned]

All sensitive actions are logged with user, timestamp, and before/after values. Audit logs are never deleted.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M01-F08-R01 | All price changes logged with before/after values | AUD-001 | Planned |
| M01-F08-R02 | All user create/delete actions logged | AUD-002 | Planned |
| M01-F08-R03 | Manual stock adjustments logged with reason | AUD-003 | Planned |
| M01-F08-R04 | Credit entry deletions logged | AUD-004 | Planned |
| M01-F08-R05 | Audit logs never deleted; retention is Owner-configurable | AUD-005 | Planned |
| M01-F08-R06 | Audit log viewer UI (Owner-only) — filter by user, entity, action, date range | — | Planned |
| M01-F08-R07 | Backfill audit events from [M01-F09](#m01-f09--phone-first-authentication) phone-first auth flows: OTP issued/verified/failed, phone added/changed, recovery channel used — deferred from [M01-F09-R09](#m01-f09--phone-first-authentication) until this module ships | — | Planned |

**Acceptance Criteria:**
- **AC1** Given an admin attempts to delete an audit row, When the delete is issued, Then the operation is blocked at the DB/repo level.
- **AC2** Given an Owner opens the audit log viewer, When they filter by user + date range, Then matching audit rows are returned with before/after values and timestamps.

---

### M01-F09 — Phone-First Authentication   [Status: In Progress]

> _Discovery (2026-05-19): self-identified gap — own observation, no specific customer ask · outcome = enable signup and recovery in the Pakistani market where many target users lack or lose track of email credentials · maps to ProjectOverView §1.6 Registration & Onboarding and §1.3 Authentication & Security; reinforces Pakistan-market context (M08-F05, M11-F03) · cost-of-not-building: signups abandoned and recovery flows fail for the target audience_

**Tags:** tenant-scope=platform-global; tier=All; capacity-impact=none; locale=PKR-only; sensitive-action=yes; notification-trigger=yes; money-touch=none; shift-lifecycle-touch=none

Phone (+92 format) becomes the primary identifier for registration, login, verification, and recovery. Email is optional and, when provided and verified, can be used as a fallback login and recovery channel. Refines and supersedes parts of [M01-F01](#m01-f01--self-service-registration), [M01-F02](#m01-f02--email-verification), [M01-F03](#m01-f03--login--session), and [M01-F04](#m01-f04--password-recovery). Has a hard dependency on a minimum-viable SMS sender (a subset of [M10-F03](#m10-f03--notification-channels)) being available for pre-organization signup OTP delivery.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M01-F09-R01 | Phone number is required at registration; email is optional | — | Planned |
| M01-F09-R02 | Phone number is unique across all users (in addition to format check in [M01-F01-R03](#m01-f01--self-service-registration)) | — | Planned |
| M01-F09-R03 | SMS OTP sent at signup; account remains pending and login is blocked until phone is verified | — | Planned |
| M01-F09-R04 | OTP is 6 digits, single-use, 5-minute TTL, max 3 verification attempts, max 1 resend per 60 seconds | — | Planned |
| M01-F09-R05 | Login accepts phone+password as primary credential; email+password resolves only when the email is set AND verified | — | Planned |
| M01-F09-R06 | Existing email-only users are routed through a one-time "add and verify phone" flow on next login; account is restricted to that flow until phone is verified | — | Out of Scope · pre-launch, no email-only users to migrate |
| M01-F09-R07 | When a Manager creates a sub-user, Manager chooses per user whether OTP verification is required before first login (default = required) | — | Planned · deferred to M01-F05-R02 PR |
| M01-F09-R08 | Password recovery offers both channels when both are set (phone OTP and email link); falls back to whichever channel is available when only one is set/verified | — | Planned |
| M01-F09-R09 | Sensitive auth actions are written to audit trail (see [M01-F08](#m01-f08--audit-trail)): phone added/changed, OTP failures past threshold, forced-phone-add completion, recovery channel used | — | Planned · deferred to M01-F08 PR |
| M01-F09-R10 | Platform provides a default SMS sender for pre-organization signup OTP (organization-configured providers from [M10-F03-R02](#m10-f03--notification-channels) apply post-onboarding) | — | Planned |
| M01-F09-R11 | Authenticated user can change phone number; new number requires SMS OTP verification before the swap is committed | — | Planned |
| M01-F09-R12 | OTP issuance is rate-limited per phone (configurable daily cap, default 10) and per IP (sliding window) on `/register`, `/login`, `/verify-phone`, `/resend-otp`, `/forgot-password`, `/phone/change/request`, `/reset-password-otp` | — | Planned |

**Acceptance Criteria:**
- **AC1** Given a new registration with a valid phone and no email, When the user submits, Then the API returns success, an SMS OTP is queued, and the account is created with `PhoneConfirmed=false`.
- **AC2** Given a registration payload missing a phone number, When submitted, Then the API returns `400 Bad Request` with a phone-required validation error.
- **AC3** Given a phone number already on file, When a new registration uses it, Then the API returns `409 Conflict`.
- **AC4** Given an unverified phone, When the user attempts to log in, Then login is blocked with a "verify your phone" message and a resend-OTP action.
- **AC5** Given an existing user whose account has only an email, When they log in after this feature ships, Then they are routed to a one-time "add and verify phone" screen and can only complete login after phone verification. _(Out of Scope — depends on R06.)_
- **AC6** Given a Manager creating a sub-user with "require OTP verification = true", When the sub-user first attempts to log in, Then OTP verification is enforced. Given the flag = false, login proceeds without OTP. _(Out of Scope — depends on R07; deferred to M01-F05-R02 PR.)_
- **AC7** Given a user with both phone and verified email, When they request password recovery, Then the UI offers a choice of phone OTP or email link.
- **AC8** Given an OTP past its 5-minute TTL or after 3 failed verification attempts, When verification is attempted, Then the API responds with a clear "expired or exhausted" error and offers a resend action.
- **AC9** Given any successful or failed phone-OTP event, When it occurs, Then a row is written to the audit trail per [M01-F08](#m01-f08--audit-trail). _(Out of Scope — depends on R09; deferred to M01-F08 PR. Phase 7 handlers emit structured Serilog events to prime the backfill.)_
- **AC10** Given an authenticated user, When they submit a new phone and confirm the OTP sent to that number, Then `user.PhoneNumber` swaps to the new value and `PhoneNumberConfirmed` remains true. _(R11.)_
- **AC11** Given the configured per-phone daily cap is reached, When the user requests another OTP, Then the API returns `429 Too Many Requests`; the same applies to the per-IP sliding window on auth endpoints. _(R12.)_

---

## M02 — Fuel Inventory & Tank Control

**Purpose:** Track underground tanks, fuel products (PMG/HSD/HOBC), supplier purchases, dip readings, and fuel receiving (tanker deliveries) with variance alerts.

### M02-F01 — Fuel Products   [Status: Done]

Supported products: PMG (Petrol), HSD (High Speed Diesel), HOBC (Hi-Octane Blending Component).

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M02-F01-R01 | Three fuel-product types seeded: PMG, HSD, HOBC | — | Done |
| M02-F01-R02 | Fuel types are selectable during station setup (onboarding) | — | Done |
| M02-F01-R03 | New fuel-type additions are rare; not a self-service feature | — | Done |

---

### M02-F02 — Supplier Tracking   [Status: Planned]

Track purchases per OMC (PSO, Shell, Total Parco, Attock, etc.).

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M02-F02-R01 | Each OMC stored as a Supplier entity with type = OMC | — | Planned |
| M02-F02-R02 | Purchase history tracked separately per OMC | — | Planned |

---

### M02-F03 — Underground Tank Management   [Status: In Progress]

Tank CRUD with unique name, fuel-type assignment, capacity, and dip chart.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M02-F03-R01 | Tank name/number is unique per station | — | Done |
| M02-F03-R02 | Each tank linked to exactly one fuel type | — | Done |
| M02-F03-R03 | Multiple tanks can hold the same fuel type, tracked separately | — | Done |
| M02-F03-R04 | Tank capacity stored in liters | — | Done |
| M02-F03-R05 | Visual display shows current stock level and % full | — | Planned |
| M02-F03-R06 | Tank fuel-type reassignment requires explicit confirmation (rare operation) | — | Planned |

---

### M02-F04 — Dip Chart Management   [Status: Planned]

Per-tank dip chart (mm → liters conversion table) uploaded manually from paper-based chart.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M02-F04-R01 | Each tank has its own unique dip chart | — | Planned |
| M02-F04-R02 | Dip chart entered manually as mm → liters table | — | Planned |
| M02-F04-R03 | Dip chart used to auto-convert dip readings to liters | — | Planned |

---

### M02-F05 — Dip Readings & Stock Variance   [Status: Planned]

Dip readings taken at shift start AND end. System auto-calculates liters and flags variance beyond threshold.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M02-F05-R01 | Stock = Opening Dip + Deliveries - Sales (calculated) | INV-001 | Planned |
| M02-F05-R02 | Physical stock from closing dip reading | INV-002 | Planned |
| M02-F05-R03 | Variance = Physical Stock - Calculated Stock | INV-003 | Planned |
| M02-F05-R04 | Variance exceeding threshold triggers an alert | INV-004 | Planned |
| M02-F05-R05 | Variance threshold (e.g., 0.5% / 1%) is Owner-configurable per station | — | Planned |
| M02-F05-R06 | Dip readings required at shift opening AND closing | — | Planned |

**Acceptance Criteria:**
- **AC1** Given variance > configured threshold at shift close, When shift is closed, Then a high-priority alert is generated and routed to Owner per [M10-F01](#m10-f01--notification-events).

---

### M02-F06 — Fuel Receiving (Tanker Delivery)   [Status: Planned]

Capture tanker delivery details, detect short delivery, and account for decanting loss.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M02-F06-R01 | Delivery captures date/time, tanker number, driver name, seal numbers | — | Planned |
| M02-F06-R02 | Quantity ordered vs received recorded; system logs the difference | — | Planned |
| M02-F06-R03 | Dip reading before AND after unloading required | — | Planned |
| M02-F06-R04 | Invoice image upload is mandatory | — | Planned |
| M02-F06-R05 | Short-delivery alert sent to Owner immediately | INV-005 | Planned |
| M02-F06-R06 | Expected decanting loss % is Owner-configurable (e.g., 0.2%) | — | Planned |

---

## M03 — Pump & Nozzle Operations

**Purpose:** Track nozzle setup, meter readings, per-nozzle sales calculation, and shortage/excess attribution per nozzleman.

### M03-F01 — Nozzle Setup   [Status: In Progress]

Each nozzle linked to one tank; supports totalizer and resettable trip meters; multi-product pumps allowed.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M03-F01-R01 | Nozzle number is unique per station | — | Done |
| M03-F01-R02 | Each nozzle linked to exactly one underground tank | — | Done |
| M03-F01-R03 | Nozzle supports totalizer (cumulative) and/or resettable trip meter | — | Planned |
| M03-F01-R04 | Nozzle has Active / Inactive status | — | Done |
| M03-F01-R05 | Multi-product pumps supported (e.g., Nozzle 1 = Petrol, Nozzle 2 = Diesel on same unit) | — | Done |
| M03-F01-R06 | Initial meter reading captured at nozzle creation | — | Planned |

---

### M03-F02 — Meter Reading Entry   [Status: Planned]

Meter readings entered by Manager or Nozzleman at shift open/close; optional meter photo upload.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M03-F02-R01 | Meter reading entry restricted to Manager and Nozzleman roles | — | Planned |
| M03-F02-R02 | Each reading records reading type (totalizer/trip), value, timestamp, user | — | Planned |
| M03-F02-R03 | Optional photo upload of the meter for proof | — | Planned |
| M03-F02-R04 | Closing reading must be ≥ opening reading for the same nozzle | — | Planned |

---

### M03-F03 — Sales Calculation   [Status: Planned]

Per-nozzle sales auto-calculated from meter delta × fuel price. Mid-shift price changes split by time.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M03-F03-R01 | Sales = (Closing Reading − Opening Reading) × Fuel Price | — | Planned |
| M03-F03-R02 | Sales auto-calculated by system; no manual entry of liters | — | Planned |
| M03-F03-R03 | Manual override allowed in exceptional cases; triggers Owner alert | — | Planned |
| M03-F03-R04 | Mid-shift price change splits sales by time at respective rates (see [M06-F03](#m06-f03--mid-shift-price-handling)) | PR-004 | Planned |

**Acceptance Criteria:**
- **AC1** Given a price change at 14:00 during a 06:00–18:00 shift, When the shift closes, Then sales before 14:00 use the old rate and sales after 14:00 use the new rate; the breakdown is visible in the shift summary.

---

### M03-F04 — Shortage & Excess Tracking   [Status: Planned]

Auto-compare cash collected vs calculated sales. No tolerance — every rupee is flagged. Shortage accumulates to nozzleman's balance-due ledger.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M03-F04-R01 | System compares cash collected vs calculated sales automatically | — | Planned |
| M03-F04-R02 | No tolerance — every rupee difference is flagged | — | Planned |
| M03-F04-R03 | Shortage amount added to nozzleman's balance-due ledger (see [M04-F05-R03](#m04--shift-management)) | SH-005 | Planned |
| M03-F04-R04 | Excess amount logged but NOT deducted from balance | SH-006 | Planned |

---

## M04 — Shift Management

**Purpose:** Configure shift timings, assign nozzlemen, record opening/closing meter and dip readings, capture cash collections, and settle shortages.

### M04-F01 — Shift Configuration   [Status: Planned]

Configurable shift duration, count per day, and names.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M04-F01-R01 | Shift duration configurable per station (8h, 12h, custom) | — | Planned |
| M04-F01-R02 | Shifts per day configurable (2 or 3) | — | Planned |
| M04-F01-R03 | Shift names configurable (Morning/Evening/Night or A/B/C) | — | Planned |

---

### M04-F02 — Nozzleman Assignment   [Status: Planned]

Nozzlemen assigned to specific nozzles for the shift; multiple nozzlemen per shift allowed; no advance roster.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M04-F02-R01 | Each nozzleman assigned to one or more specific nozzles for the shift | — | Planned |
| M04-F02-R02 | Multiple nozzlemen can work the same shift, each responsible for assigned nozzles | — | Planned |
| M04-F02-R03 | No advance roster — assignments recorded after the shift ends | — | Planned |

---

### M04-F03 — Open Shift   [Status: Planned]

Opening checklist: meter readings, tank dip readings, cash on hand from previous shift.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M04-F03-R01 | Only one shift can be open per station at a time | SH-001 | Planned |
| M04-F03-R02 | Opening meter reading must be ≥ last closing reading | SH-002 | Planned |
| M04-F03-R03 | All assigned nozzles must have an opening meter reading | — | Planned |
| M04-F03-R04 | Opening tank dip readings required for every tank | — | Planned |
| M04-F03-R05 | Cash-in-hand from previous shift recorded | — | Planned |

**Acceptance Criteria:**
- **AC1** Given an open shift exists for the station, When a user attempts to open another, Then API returns `409 Conflict` with reference to the existing open shift.
- **AC2** Given opening meter < last closing, When user submits, Then API returns `400 Bad Request` with the specific nozzle and prior closing value.

---

### M04-F04 — Close Shift   [Status: Planned]

Closing checklist: closing meter & dip readings, cash, credit, card/digital, expenses. Closing requires all readings present.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M04-F04-R01 | Shift cannot be closed until all assigned nozzles have closing readings | SH-003 | Planned |
| M04-F04-R02 | Closing tank dip readings required for every tank | — | Planned |
| M04-F04-R03 | Total cash, credit (udhaar), card, digital payments captured | — | Planned |
| M04-F04-R04 | Expenses paid during shift recorded against this shift | — | Planned |

---

### M04-F05 — Sales & Shortage Settlement   [Status: Planned]

Compute shortage = calculated sales − total collections; attribute to nozzleman.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M04-F05-R01 | Shortage = Calculated Sales − (Cash + Credit + Card + Digital) | SH-004 | Planned |
| M04-F05-R02 | Shortage amount added to nozzleman's balance-due ledger | SH-005 | Planned |
| M04-F05-R03 | Excess amount logged but not credited to nozzleman | SH-006 | Planned |
| M04-F05-R04 | Shift summary report generated on close | — | Planned |

---

### M04-F06 — Cash Collection   [Status: Planned]

Capture cash denominations and payment-method breakdown. Configurable: daily bank deposit OR safe.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M04-F06-R01 | Cash denomination breakdown recorded (5000s, 1000s, 500s, 100s, etc.) | — | Planned |
| M04-F06-R02 | Payment methods configurable per station: Cash, Credit, Card, JazzCash, Easypaisa, Bank Transfer | — | Planned |
| M04-F06-R03 | Cash-deposit policy configurable: daily bank deposit OR kept in safe | — | Planned |

---

## M05 — Finance & Accounts

**Purpose:** Manage credit customers (udhaar receivables), supplier payments (payables), daily expenses, and bank accounts.

### M05-F01 — Credit Customers (Udhaar / Receivables)   [Status: Planned]

Three customer types (Individual, Fleet/Corporate, Government). Configurable credit limit, billing cycle, partial payments. No interest/late fee.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M05-F01-R01 | Credit sale blocked if customer balance is at or above credit limit | CR-001 | Planned |
| M05-F01-R02 | Partial payments reduce outstanding balance | CR-002 | Planned |
| M05-F01-R03 | Customer balance = Sum(sales) − Sum(payments) | CR-003 | Planned |
| M05-F01-R04 | Aging calculated from transaction date | CR-004 | Planned |
| M05-F01-R05 | Customer types: Individual, Fleet/Corporate, Government | — | Planned |
| M05-F01-R06 | Credit limit configurable per customer | — | Planned |
| M05-F01-R07 | Billing cycle configurable per customer (weekly/fortnightly/monthly/custom) | — | Planned |
| M05-F01-R08 | Identification methods: physical slip + driver signature; future: plastic card / vehicle lookup | — | Planned |
| M05-F01-R09 | No interest or late fees applied | — | Planned |

**Acceptance Criteria:**
- **AC1** Given a customer at credit limit, When a credit sale is attempted, Then API returns `409 Conflict` with current balance and limit in the response.

---

### M05-F02 — Supplier Payments (Payables)   [Status: Planned]

Supplier types: OMC, Carriage Contractor, Lubricant Supplier, Utility, Custom. Configurable payment terms; payment proof upload.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M05-F02-R01 | Supplier types: OMC, Carriage Contractor, Lubricant Supplier, Utility, Other | — | Planned |
| M05-F02-R02 | Payment terms configurable per supplier (advance / on delivery / credit) | — | Planned |
| M05-F02-R03 | Payment proof (receipt/voucher/bank slip image) attached to each payment | — | Planned |

---

### M05-F03 — Daily Expenses   [Status: Planned]

Categorized expenses. Any user can add. No approval workflow. No petty cash tracking.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M05-F03-R01 | Default categories: Salaries, Electricity, Generator fuel, Repairs, Staff tea/food, Stationery | — | Planned |
| M05-F03-R02 | Custom expense categories can be added per organization | — | Planned |
| M05-F03-R03 | Any user role can add an expense entry | — | Planned |
| M05-F03-R04 | No approval workflow required | — | Planned |

---

### M05-F04 — Bank Accounts   [Status: Planned]

Track deposits across multiple bank accounts; assign accounts to specific purposes.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M05-F04-R01 | Multiple bank accounts supported per organization | — | Planned |
| M05-F04-R02 | Accounts can be tagged for specific purposes (e.g., OMC payments, salaries) | — | Planned |

---

## M06 — Pricing & Rate Management

**Purpose:** Per-station fuel pricing with effective-date logging, double-confirmation workflow, mid-shift change handling, margins, customer special rates, and promotions.

### M06-F01 — Price Configuration   [Status: Planned]

One active price per fuel type per station; manual entry with effective date/time and full history.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M06-F01-R01 | Only one active price per fuel type per station at any time | PR-001 | Planned |
| M06-F01-R02 | Price entered manually with explicit effective date/time | — | Planned |
| M06-F01-R03 | Prices may differ across stations within the same organization | — | Planned |
| M06-F01-R04 | Complete price history retained (for audits — see [M01-F08-R01](#m01-f08--audit-trail)) | — | Planned |

---

### M06-F02 — Price Change Workflow   [Status: Planned]

Only Owner and Manager can change prices. Double-confirmation (type twice). Notification fan-out to station users.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M06-F02-R01 | Price changes require double-confirmation (type new price twice) | PR-002 | Planned |
| M06-F02-R02 | Only Owner and Manager roles can change prices | — | Planned |
| M06-F02-R03 | Price change triggers in-app notification to all Managers and Nozzlemen of the station | PR-003 | Planned |

**Acceptance Criteria:**
- **AC1** Given a price change, When confirmed twice and saved, Then notifications are queued for delivery and an audit log row is written.

---

### M06-F03 — Mid-Shift Price Handling   [Status: Planned]

Sales split by time when a price change happens during an open shift.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M06-F03-R01 | Sales during a price change are split by time, calculated at respective rates | PR-004 | Planned |
| M06-F03-R02 | Shift summary shows the time-split breakdown explicitly | — | Planned |

---

### M06-F04 — Margins & Discounts   [Status: Planned]

Per-liter dealer margin tracked. No nozzleman commission. No max discount limit.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M06-F04-R01 | Dealer margin per liter tracked (OMC price vs selling price) | — | Planned |
| M06-F04-R02 | No nozzleman commission | — | Planned |
| M06-F04-R03 | No maximum discount limit enforced | — | Planned |

---

### M06-F05 — Customer Special Rates   [Status: Planned]

Per-customer special rates auto-applied to credit sales.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M06-F05-R01 | Customer-specific special rates applied automatically on credit sales | PR-005 | Planned |
| M06-F05-R02 | Special rates configurable per fleet / corporate / government customer | — | Planned |

---

### M06-F06 — Promotional Pricing   [Status: Planned]

Time-bound promotional rates.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M06-F06-R01 | Promotional rates have an explicit start and end date/time | — | Planned |
| M06-F06-R02 | Promotional pricing takes precedence over standard pricing during its window | — | Planned |

---

## M07 — Reporting, Analytics & Platform UI

**Purpose:** Daily/weekly/monthly operational and financial reports, dashboard widgets, export (PDF/Excel/Print), scheduled email delivery, and the cross-cutting frontend platform (UI shell, PWA).

### M07-F01 — Daily Sales Report   [Status: Planned]

Per-day report with breakdowns by fuel type, payment method, nozzle, and nozzleman.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M07-F01-R01 | Total liters sold per fuel type | — | Planned |
| M07-F01-R02 | Total revenue with payment-method breakdown (cash, credit, card, digital) | — | Planned |
| M07-F01-R03 | Per-nozzle sales breakdown | — | Planned |
| M07-F01-R04 | Per-nozzleman sales breakdown | — | Planned |
| M07-F01-R05 | End-of-day cutoff time is configurable | — | Planned |

---

### M07-F02 — Inventory Reports   [Status: Planned]

Stock per tank, deliveries, variance, low-stock alerts.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M07-F02-R01 | Current stock per tank shown with calculated and physical values | — | Planned |
| M07-F02-R02 | Liters received and liters sold per period | — | Planned |
| M07-F02-R03 | Variance (calculated vs dip) per tank | — | Planned |
| M07-F02-R04 | Low-stock alert when level falls below configurable threshold | — | Planned |

---

### M07-F03 — Financial Reports   [Status: Planned]

P&L, Receivables Aging, Payables.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M07-F03-R01 | Profit & Loss report: revenue, cost of goods, expenses, net profit (weekly/monthly) | — | Planned |
| M07-F03-R02 | Receivables Aging shows overdue credit with days outstanding | — | Planned |
| M07-F03-R03 | Payables report lists pending supplier payments with due dates | — | Planned |

---

### M07-F04 — Export & Automation   [Status: Planned]

PDF / Excel / Direct Print exports; scheduled email delivery of standard reports.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M07-F04-R01 | Reports exportable as PDF and Excel (XLSX) | — | Planned |
| M07-F04-R02 | Direct print supported | — | Planned |
| M07-F04-R03 | Scheduled email delivery of daily and weekly reports to Owner | — | Planned |
| M07-F04-R04 | Report export gated by subscription plan (see [M11-F06](#m11-f06--feature-gating)) | — | Planned |

---

### M07-F05 — Dashboard Widgets   [Status: In Progress]

At-a-glance summary widgets with comparison vs prior period.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M07-F05-R01 | Today's total sales with comparison vs yesterday / last week | — | Planned |
| M07-F05-R02 | Current stock levels per tank | — | Planned |
| M07-F05-R03 | Recent alerts / notifications widget | — | Planned |
| M07-F05-R04 | Dashboard summary endpoint exists (Owner/Manager only) | — | Done |

---

### M07-F06 — Consolidated All-Stations View   [Status: Planned]

Owner-only cross-station aggregation.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M07-F06-R01 | Owner sees aggregated totals across all owned stations | — | Planned |
| M07-F06-R02 | Drill-down from aggregate to individual station | — | Planned |

---

### M07-F07 — UI Shell   [Status: Planned]

The cross-cutting layout that wraps every authenticated page: sidebar, top nav, content area, and route-guard composition. Provides the chrome that the per-module pages (M07-F01..F06, M05, M06, …) plug into.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M07-F07-R01 | Persistent left sidebar with role-aware navigation links | — | Planned |
| M07-F07-R02 | Top bar with user menu, station switcher (Owner), language toggle, theme toggle | — | Planned |
| M07-F07-R03 | Main content area driven by TanStack Router `<Outlet />` composition | — | Planned |
| M07-F07-R04 | Sidebar collapses to drawer on mobile (`< 640px`) — per [M07-F07.Responsive](#) | — | Planned |
| M07-F07-R05 | Active-route highlighting in sidebar | — | Planned |

**Acceptance Criteria:**
- **AC1** Given a Nozzleman, When they open the dashboard, Then the sidebar shows only shift-related links (no Finance, Reports, Settings).
- **AC2** Given an Owner with 3 stations, When they click the station switcher, Then a dropdown lists all 3 plus an "All Stations" option.
- **AC3** Given any viewport < 640px, When the shell renders, Then the sidebar collapses behind a hamburger toggle.

---

### M07-F08 — Progressive Web App (PWA)   [Status: Planned]

Make the app installable and offline-capable for shift operations on shared station tablets.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M07-F08-R01 | Service worker caches the app shell for offline launch | — | Planned |
| M07-F08-R02 | Web app manifest with icons + name supports "Add to Home Screen" | — | Planned |
| M07-F08-R03 | API calls fail gracefully when offline (show retry banner, queue not required) | — | Planned |
| M07-F08-R04 | Web push notifications | — | Out of Scope (v2) |

---

## M08 — Settings & Configuration

**Purpose:** Station profile, tank/nozzle/dip-chart configuration, system preferences (currency/language/date), and backup.

### M08-F01 — Station Profile   [Status: Done]

Station name, address, phone, tank/nozzle counts. Operating hours assumed 24/7.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M08-F01-R01 | Station name, address, phone required | — | Done |
| M08-F01-R02 | Number of tanks and nozzles captured at setup | — | Done |
| M08-F01-R03 | Operating hours assumed 24/7 (not configurable in v1) | — | Done |
| M08-F01-R04 | Station created during onboarding transaction (with Organization + Trial Subscription) | — | Done |
| M08-F01-R05 | Per-station branding (name, logo) | — | Planned |

---

### M08-F02 — Tank Configuration   [Status: In Progress]

CRUD for tanks per station (see also [M02-F03](#m02-f03--underground-tank-management)).

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M08-F02-R01 | Tank CRUD endpoints scoped to station | — | In Progress |
| M08-F02-R02 | Tank name uniqueness validated per station | — | Done |

---

### M08-F03 — Nozzle Configuration   [Status: In Progress]

CRUD for nozzles per station (see also [M03-F01](#m03-f01--nozzle-setup)).

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M08-F03-R01 | Nozzle CRUD endpoints scoped to station | — | In Progress |
| M08-F03-R02 | Nozzle number uniqueness validated per station | — | Done |

---

### M08-F04 — Dip Chart Management   [Status: Planned]

Upload/edit/replace dip charts per tank (see [M02-F04](#m02-f04--dip-chart-management)).

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M08-F04-R01 | Dip chart upload endpoint per tank | — | Planned |
| M08-F04-R02 | Dip chart retrieval endpoint per tank | — | Planned |

---

### M08-F05 — System Preferences   [Status: Planned]

Currency, language, date format, fiscal year start.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M08-F05-R01 | Currency format: Pakistani (Rs. 1,25,000) | — | Planned |
| M08-F05-R02 | Language: English & Urdu, switchable per user | — | In Progress |
| M08-F05-R03 | Date format: DD/MM/YYYY | — | Planned |
| M08-F05-R04 | Fiscal year start configurable by Owner | — | Planned |

---

### M08-F06 — Backup & Data   [Status: Planned]

Server-side daily backup.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M08-F06-R01 | Automatic daily server-side backup | — | Planned |
| M08-F06-R02 | Backup retention policy defined and documented | — | Planned |

---

## M09 — Lubricants / Oil Shop

**Purpose:** Manage oil-shop products, sales, stock, and combined P&L with fuel operations. Gated to Professional+ plans (see [M11-F06](#m11-f06--feature-gating)).

### M09-F01 — Product Inventory   [Status: Planned]

Product types and brands; per-product stock with min-level alerts.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M09-F01-R01 | Product types: engine oils, gear oils, brake fluid, coolant, filters, accessories | — | Planned |
| M09-F01-R02 | Multi-brand support (ZIC, Castrol, Shell Helix, PSO Deo, etc.) | — | Planned |
| M09-F01-R03 | Per-product stock tracking: quantity, purchase price, selling price, min level | — | Planned |
| M09-F01-R04 | Low-stock alert when quantity falls below minimum | — | Planned |

---

### M09-F02 — Lubricant Sales   [Status: Planned]

Cash or credit; combined ledger with fuel credit customers. Receipts generated. No discounts.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M09-F02-R01 | Sales recorded either separately or combined with the fuel shift (configurable) | — | Planned |
| M09-F02-R02 | Credit sales feed the same customer ledger as fuel credit | — | Planned |
| M09-F02-R03 | Receipt/invoice generated for each purchase | — | Planned |
| M09-F02-R04 | No discounts allowed | — | Planned |
| M09-F02-R05 | Price updates permitted by Owner or Manager | — | Planned |

---

### M09-F03 — Stock Management   [Status: Planned]

Stock receiving with supplier, invoice, image.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M09-F03-R01 | Stock receiving captures product, quantity, purchase price, supplier, invoice number/image | — | Planned |

---

### M09-F04 — Lubricant Reporting   [Status: Planned]

Sales report, stock inventory report, per-product margin; combined with fuel P&L.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M09-F04-R01 | Daily sales report for lubricants | — | Planned |
| M09-F04-R02 | Stock inventory report for lubricants | — | Planned |
| M09-F04-R03 | Profit margin per product | — | Planned |
| M09-F04-R04 | Combined with fuel P&L for station-level profitability | — | Planned |

---

## M10 — SMS / Notifications

**Purpose:** Multi-channel alerts (in-app/SMS/email/WhatsApp) for operational events, role-targeted recipients, configurable channels and providers. Gated by plan (see [M11-F06](#m11-f06--feature-gating)).

### M10-F01 — Notification Events   [Status: Planned]

Catalog of alert-eligible events.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M10-F01-R01 | Low-stock alert when tank falls below threshold | — | Planned |
| M10-F01-R02 | Fuel-delivery alert when tanker delivery is received | — | Planned |
| M10-F01-R03 | Price-change alert when fuel price is updated | — | Planned |
| M10-F01-R04 | Shift-start/end alerts | — | Planned |
| M10-F01-R05 | Large-credit-sale alert above configurable amount | — | Planned |
| M10-F01-R06 | Payment-received alert for credit customers | — | Planned |
| M10-F01-R07 | Shortage-detected alert at shift end | — | Planned |
| M10-F01-R08 | Daily summary alert | — | Planned |
| M10-F01-R09 | System-error alert on any failure | — | Planned |

---

### M10-F02 — Recipients & Targeting   [Status: Planned]

Role-based routing.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M10-F02-R01 | Owner receives all critical alerts | — | Planned |
| M10-F02-R02 | Manager receives operational alerts for their assigned station(s) | — | Planned |
| M10-F02-R03 | Nozzleman receives only their own shift-related notifications | — | Planned |

---

### M10-F03 — Notification Channels   [Status: Planned]

Per-user channel preferences; configurable SMS provider; cost control per alert type.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M10-F03-R01 | Channels: In-app, SMS, Email, WhatsApp — configurable per user | — | Planned |
| M10-F03-R02 | SMS provider configurable per organization (Telenor, Jazz, custom API) | — | Planned |
| M10-F03-R03 | Owner can enable/disable SMS per alert type for cost control | — | Planned |

---

### M10-F04 — Notification Behavior   [Status: Planned]

Quiet hours (not supported v1), no repeat reminders, no read receipts initially.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M10-F04-R01 | Quiet hours: not supported in v1 | — | Out of Scope (v2) |
| M10-F04-R02 | No repeat reminders — each alert sent once | — | Planned |
| M10-F04-R03 | Read receipts: not in v1 | — | Out of Scope (v2) |

---

### M10-F05 — Summary Reports   [Status: Planned]

Daily and weekly digests.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M10-F05-R01 | Daily summary notification to Owner | — | Planned |
| M10-F05-R02 | Weekly digest with performance across all stations | — | Planned |

---

## M11 — Subscription & Billing

**Purpose:** Trial management, plan tiers (Starter / Professional / Enterprise), manual payment verification, expiry & grace period, and feature gating enforced at API level.

### M11-F01 — Subscription Plans   [Status: Done]

Three tiers seeded; monthly and annual billing; ~17% annual discount.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M11-F01-R01 | Each organization has exactly one active subscription at a time | SUB-001 | Done |
| M11-F01-R02 | Three plans seeded: Starter, Professional, Enterprise | — | Done |
| M11-F01-R03 | Annual billing gives ~17% discount (≈ 2 months free) | SUB-009 | Done |
| M11-F01-R04 | Plan features stored as JSONB flags (for flexible gating without schema changes) | — | Done |
| M11-F01-R05 | Currency: PKR | — | Done |

---

### M11-F02 — Trial Period   [Status: Done]

14-day Professional-tier trial assigned automatically post-onboarding; no credit card.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M11-F02-R01 | Trial period is 14 days from registration date | SUB-002 | Done |
| M11-F02-R02 | Trial gives Professional-plan features so users experience the full product | SUB-003 | Done |
| M11-F02-R03 | Trial limits: 1 station, 2 users (owner + 1 manager) | — | Done |
| M11-F02-R04 | No credit card required to start trial | — | Done |

---

### M11-F03 — Payment & Verification   [Status: Planned]

Manual bank-transfer verification (v1); JazzCash/Easypaisa later.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M11-F03-R01 | Payment methods: Bank transfer (v1), JazzCash/Easypaisa (v2) | — | Planned |
| M11-F03-R02 | Payment verification is manual — admin reviews uploaded receipt | SUB-005 | Planned |
| M11-F03-R03 | Subscription activates only after payment is verified | SUB-006 | Planned |
| M11-F03-R04 | Bank transfer receipt image uploaded as proof | — | Planned |

**Acceptance Criteria:**
- **AC1** Given a submitted payment with receipt, When an admin approves it, Then the subscription transitions to Active and the org is notified.

---

### M11-F04 — Expiry & Grace Period   [Status: Planned]

3-day grace period after expiry; then read-only mode.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M11-F04-R01 | When trial/subscription expires, account becomes read-only | SUB-004 | Planned |
| M11-F04-R02 | 3-day grace period after expiry before read-only mode kicks in | SUB-007 | Planned |
| M11-F04-R03 | Read-only mode: can view data, cannot create/edit/delete | — | Planned |

---

### M11-F05 — Plan Changes (Upgrade / Downgrade)   [Status: Planned]

Upgrade anytime. Downgrade blocked if current usage exceeds target plan limits.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M11-F05-R01 | Downgrade blocked if current usage exceeds target plan limits | SUB-008 | Planned |
| M11-F05-R02 | Upgrade requests recorded and activated post-verification | — | Planned |

---

### M11-F06 — Feature Gating   [Status: In Progress]

Plan-based limits enforced at the API level, not just UI. Locked features show "Upgrade to unlock".

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M11-F06-R01 | Feature gating enforced at API level (not just UI) | SUB-010 | In Progress |
| M11-F06-R02 | Station count checked on station creation against plan's `max_stations` | FG-001 | Planned |
| M11-F06-R03 | User count checked on user creation against plan's `max_users` | FG-002 | Planned |
| M11-F06-R04 | Module access checked via plan's `features` JSONB flags | FG-003 | Planned |
| M11-F06-R05 | Expired/cancelled subscriptions allow read-only access to existing data | FG-004 | Planned |
| M11-F06-R06 | Owner always sees upgrade prompts for gated features | FG-005 | Planned |

**Acceptance Criteria:**
- **AC1** Given a Starter plan (max 1 station), When the Owner tries to create a second station via API directly (bypassing UI), Then API returns `402 Payment Required` (or `403`) with an upgrade prompt.

---

### M11-F07 — Billing History   [Status: Planned]

Past payments, receipts, subscription timeline.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M11-F07-R01 | View all past payments with status (pending / verified / rejected) | — | Planned |
| M11-F07-R02 | Downloadable receipts per payment | — | Planned |
| M11-F07-R03 | Subscription timeline visible (trial → active → renewed) | — | Planned |

---

### M11-F08 — Plan Comparison & Pricing Page   [Status: Planned]

Public-facing pricing page where prospects and existing Owners compare Starter / Professional / Enterprise plans and start a trial or upgrade.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M11-F08-R01 | Public route `/pricing` lists all 3 plans side-by-side | — | Planned |
| M11-F08-R02 | Monthly / yearly billing toggle; yearly applies the ~17% discount visibly | — | Planned |
| M11-F08-R03 | Feature matrix per plan (stations, users, modules, support) | — | Planned |
| M11-F08-R04 | "Start free trial" CTA on each plan → registration flow | — | Planned |
| M11-F08-R05 | Authenticated Owner sees "Upgrade" CTA instead of trial CTA | — | Planned |

**Acceptance Criteria:**
- **AC1** Given a logged-out visitor, When they open `/pricing`, Then they see 3 plans, a monthly/yearly toggle, and a "Start free trial" CTA per plan.
- **AC2** Given an Owner on Starter plan, When they open `/pricing`, Then the Starter row shows "Current Plan" and Professional/Enterprise show "Upgrade".

---

## Appendix A — Legacy → New ID Map

Quick lookup for every legacy business-rule ID. Use this when reading old commits, PRs, code comments, or PRD §5.

| Legacy | New ID | Module | Rule |
|---|---|---|---|
| REG-001 | M01-F01-R01 | User & Access | Email unique across all users |
| REG-002 | M01-F01-R02 | User & Access | Registration creates Owner; org+station deferred to onboarding |
| REG-003 | M01-F01-R03 | User & Access | Phone validated as `+92XXXXXXXXXX` |
| REG-004 | M01-F01-R04 | User & Access | Email verified before first login |
| AUD-001 | M01-F08-R01 | User & Access | Price changes logged with before/after |
| AUD-002 | M01-F08-R02 | User & Access | User create/delete actions logged |
| AUD-003 | M01-F08-R03 | User & Access | Manual stock adjustments logged with reason |
| AUD-004 | M01-F08-R04 | User & Access | Credit entry deletions logged |
| AUD-005 | M01-F08-R05 | User & Access | Audit logs never deleted |
| INV-001 | M02-F05-R01 | Inventory | Stock = Opening Dip + Deliveries − Sales |
| INV-002 | M02-F05-R02 | Inventory | Physical stock from closing dip |
| INV-003 | M02-F05-R03 | Inventory | Variance = Physical − Calculated |
| INV-004 | M02-F05-R04 | Inventory | Variance > threshold triggers alert |
| INV-005 | M02-F06-R05 | Inventory | Short-delivery alert to Owner |
| SH-001 | M04-F03-R01 | Shifts | One open shift per station |
| SH-002 | M04-F03-R02 | Shifts | Opening meter ≥ last closing |
| SH-003 | M04-F04-R01 | Shifts | All nozzles need closing readings before shift close |
| SH-004 | M04-F05-R01 | Shifts | Shortage = Calculated Sales − Collections |
| SH-005 | M04-F05-R02 | Shifts | Shortage added to nozzleman balance-due |
| SH-006 | M04-F05-R03 | Shifts | Excess logged but not credited |
| CR-001 | M05-F01-R01 | Credit | Credit sale blocked at/above limit |
| CR-002 | M05-F01-R02 | Credit | Partial payments reduce outstanding |
| CR-003 | M05-F01-R03 | Credit | Balance = Sum(sales) − Sum(payments) |
| CR-004 | M05-F01-R04 | Credit | Aging from transaction date |
| PR-001 | M06-F01-R01 | Pricing | One active price per fuel/station |
| PR-002 | M06-F02-R01 | Pricing | Double-confirmation on price change |
| PR-003 | M06-F02-R03 | Pricing | Price change notifies all station users |
| PR-004 | M06-F03-R01 | Pricing | Mid-shift price change splits sales by time |
| PR-005 | M06-F05-R01 | Pricing | Customer special rates applied on credit sales |
| SUB-001 | M11-F01-R01 | Subscription | One active subscription per org |
| SUB-002 | M11-F02-R01 | Subscription | 14-day trial |
| SUB-003 | M11-F02-R02 | Subscription | Trial gives Professional features |
| SUB-004 | M11-F04-R01 | Subscription | Expiry → read-only |
| SUB-005 | M11-F03-R02 | Subscription | Manual payment verification |
| SUB-006 | M11-F03-R03 | Subscription | Activation after verification |
| SUB-007 | M11-F04-R02 | Subscription | 3-day grace before read-only |
| SUB-008 | M11-F05-R01 | Subscription | Downgrade blocked if usage exceeds target |
| SUB-009 | M11-F01-R03 | Subscription | Annual billing ~17% discount |
| SUB-010 | M11-F06-R01 | Subscription | Feature gating enforced at API |
| FG-001 | M11-F06-R02 | Feature Gating | Station count vs `max_stations` |
| FG-002 | M11-F06-R03 | Feature Gating | User count vs `max_users` |
| FG-003 | M11-F06-R04 | Feature Gating | Module access via `features` JSONB |
| FG-004 | M11-F06-R05 | Feature Gating | Expired sub → read-only access |
| FG-005 | M11-F06-R06 | Feature Gating | Owner sees upgrade prompts |

**Total legacy IDs mapped: 43** (38 from prior PRD + 5 implementation-derived).

---

## Appendix B — Cross-References

| For… | See… |
|---|---|
| **API endpoint catalogue (authoritative)** | **Swagger** at `/swagger` (auto-generated); summary index in [`server/FuelFlow.Api/CLAUDE.md`](../server/FuelFlow.Api/CLAUDE.md) |
| API conventions, sample request/response payloads | [`server/FuelFlow.Api/CLAUDE.md`](../server/FuelFlow.Api/CLAUDE.md) |
| **Database schema (authoritative)** | **EF Core migrations** in [`server/FuelFlow.Infrastructure/Migrations/`](../server/FuelFlow.Infrastructure/Migrations/) |
| ER diagram + key entities (conceptual) | [`server/FuelFlow.Domain/CLAUDE.md`](../server/FuelFlow.Domain/CLAUDE.md) |
| EF Core conventions, global query filters, important DB rules | [`server/FuelFlow.Infrastructure/CLAUDE.md`](../server/FuelFlow.Infrastructure/CLAUDE.md) |
| Backend tech stack, Clean Architecture, CQRS+MediatR | [`server/CLAUDE.md`](../server/CLAUDE.md) |
| Commands/Queries/DTO patterns, multi-tenancy guards, Mapperly | [`server/FuelFlow.Application/CLAUDE.md`](../server/FuelFlow.Application/CLAUDE.md) |
| Frontend tech stack, state, forms, routing, i18n, PWA | [`fuel-flow-web/CLAUDE.md`](../fuel-flow-web/CLAUDE.md) |
| Route → role mapping, registration / onboarding flows | [`fuel-flow-web/src/routes/CLAUDE.md`](../fuel-flow-web/src/routes/CLAUDE.md) |
| Component patterns (Dialog, Sonner, Recharts, subscription UI) | [`fuel-flow-web/src/components/CLAUDE.md`](../fuel-flow-web/src/components/CLAUDE.md) |
| Architectural decisions & version history | [`CHANGELOG.md`](CHANGELOG.md) |
| Business requirements & user stories | [`ProjectOverView.md`](ProjectOverView.md) |
| EF Core mapping conventions | [`EF_CONFIGURATION_CONVENTIONS.md`](EF_CONFIGURATION_CONVENTIONS.md) |

---

## Maintenance Conventions

1. **Reference IDs in commits & PRs.** Example: `feat(M04-F03): implement open-shift endpoint` and PR title `M04-F03-R01: enforce one-open-shift-per-station`.
2. **Reference IDs in tests.** Example: `[Fact] public Task M04_F03_R01_OnlyOneOpenShiftPerStation()`.
3. **Reference IDs in GitHub Issues.** Filter the board by `M04` to see all Shifts work.
4. **Status flips are atomic with implementation.** The PR that completes `M04-F03-R01` flips it from Planned → Done in the same diff.
5. **Acceptance criteria are the test plan.** Write ACs *before* writing the code. If you can't, the requirement isn't clear enough.
6. **Numbering is append-only.** Never renumber an existing ID. Removed features → mark `Out of Scope`, keep the slot. New features get the next free F-number.
7. **No standalone PRD any more.** New business rules, requirements, and acceptance criteria go directly into this file with a new `MXX-FXX-RXX` row. Tech-stack / architecture / API / schema / UI reference content goes into the scoped `CLAUDE.md` files (see [`docs/CLAUDE.md`](CLAUDE.md) and root [`CLAUDE.md`](../CLAUDE.md) Rule 9).
8. **One doc owner per sprint.** Reviews every PR that touches `MODULES.md`.
