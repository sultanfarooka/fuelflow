# Fuel Flow — Modules, Features & Requirements

> Single source of truth for all modules, features, and requirements.
> Every item has a stable hierarchical ID that can be referenced anywhere — code, commits, PR titles, GitHub Issues, tests, conversations.

**Last Updated:** 2026-06-06 (priority & implementation-order system added)
**Single SoT since:** 2026-05-16 (consolidates the former `PRD.md` §5+§7 and `IMPLEMENTATION_STATUS.md` priority queue; tech-stack / architecture / API / schema / UI reference content moved to scoped `CLAUDE.md` files — see root [`CLAUDE.md`](../CLAUDE.md) Rule 9)

---

## How to Read This File

- **Modules:** `M01` … `M11`
- **Features inside each module:** `F01`, `F02`, …
- **Requirements inside each feature:** `R01`, `R02`, …
- **Acceptance criteria** are referenced as `M03-F02-R01.AC1`, `.AC2`, …
- **Legacy IDs** (SH-001, PR-001, INV-001, CR-001, REG-001, SUB-001, AUD-001, FG-001) are preserved in the Legacy column for backwards compatibility with existing PRs, commits, and code comments.

**Reference an item anywhere as e.g.** `M04-F03-R01` (PR title, commit, test name, issue, code comment).

### Priority & order (how this file is ranked)

Every module and feature carries a **priority tier** and a global **implementation
order**. These are a *separate ordinal layered on top of* the stable `MXX`/`FXX`
IDs — they **never** rename an ID (Maintenance Convention 6 forbids renumbering).

- **Tier (P0 = highest, P3 = lowest)** — a severity class pinned to an explicit rule:
  - **P0 — Critical**: independent (its prerequisites are all `Done`) **and** it blocks revenue or other modules.
  - **P1 — High**: part of the core operational loop — pricing, inventory, nozzle ops, shifts, finance.
  - **P2 — Medium**: requires operational data to already exist — reports, notifications.
  - **P3 — Low**: gated / optional extensions — staff & payroll, lubricants.
- **Module `Order` (1–14)** — the exact build sequence. See [Priority & Implementation Order](#priority--implementation-order).
- **Feature `Order` (`<module>.<n>`)** — build sequence within a module. See [Appendix C — Priority Matrix](#appendix-c--priority-matrix).
- **Ranking rule:** tier by business value first; **within a tier, fewest unmet dependencies wins** (independent items — those depending only on `Done` work — lead; blocked items sink). The `Depends on` columns make this auditable.

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

> Sorted below by `ID`. The **Order** column is the implementation sequence — see
> [Priority & Implementation Order](#priority--implementation-order) for the same
> table sorted by build order, and [Current Priorities](#current-priorities) for
> the Top-5 to plan next.

| Order | Priority | ID | Module | Status | Legacy Rule Prefix |
|---|---|---|---|---|---|
| 4 | P0 | [M01](#m01--user--access-management) | User & Access Management | In Progress | REG-*, AUD-* |
| 8 | P1 | [M02](#m02--fuel-inventory--tank-control) | Fuel Inventory & Tank Control | In Progress | INV-* |
| 9 | P1 | [M03](#m03--pump--nozzle-operations) | Pump & Nozzle Operations | In Progress | — |
| 11 | P1 | [M04](#m04--shift-management) | Shift Management | Planned | SH-* |
| 10 | P1 | [M05](#m05--finance--accounts) | Finance & Accounts | Planned | CR-* |
| 7 | P1 | [M06](#m06--pricing--rate-management) | Pricing & Rate Management | Planned | PR-* |
| 2 | P0 | [M07](#m07--reporting--analytics) | Reporting, Analytics & Platform UI | In Progress | — |
| 6 | P1 | [M08](#m08--settings--configuration) | Settings & Configuration | In Progress | — |
| 14 | P3 | [M09](#m09--lubricants--oil-shop) | Lubricants / Oil Shop | Planned | — |
| 12 | P2 | [M10](#m10--sms--notifications) | SMS / Notifications | Planned | — |
| 3 | P0 | [M11](#m11--subscription--billing) | Subscription & Billing | In Progress | SUB-*, FG-* |
| 5 | P0 | [M12](#m12--onboarding--first-run-experience) | Onboarding & First-Run Experience | In Progress | — |
| 13 | P3 | [M13](#m13--staff--payroll) | Staff & Payroll | Planned | — |
| 1 | P0 | [M14](#m14--per-tenant-database-architecture) | Per-Tenant Database Architecture | Done | — |

---

## Current Priorities

**The Top-5 modules to plan next**, in module `Order` (skipping fully-`Done`
[M14](#m14--per-tenant-database-architecture)). Each row is the highest-priority
module with outstanding work, pointing at its **single next actionable item** —
the ★ row for that module in [Appendix C — Priority Matrix](#appendix-c--priority-matrix)
(continue it if `In Progress`, otherwise its highest-priority independent
`Planned` item). This is the list the `/feature-planning` skill reads. Every item
below is **independent** (its prerequisites are all `Done`).

| # | Module | Next actionable item | Area |
|---|---|---|---|
| 1 | [M07](#m07--reporting--analytics) (order 2) | [M07-F07](#m07-f07--ui-shell) — UI shell (layout, sidebar, navigation); builds on shipped [M07-F09](#m07-f09--design-system--theme-foundation) | Frontend |
| 2 | [M11](#m11--subscription--billing) (order 3) | [M11-F06](#m11-f06--feature-gating) — feature gating (API-level); then [M11-F08](#m11-f08--plan-comparison--pricing-page) pricing page | Backend + Frontend |
| 3 | [M01](#m01--user--access-management) (order 4) | [M01-F05-R02](#m01-f05--roles--hierarchy)/[R03](#m01-f05--roles--hierarchy) + [M01-F06](#m01-f06--granular-permissions) — Owner→Manager→Custom users + granular permissions | Backend |
| 4 | [M12](#m12--onboarding--first-run-experience) (order 5) | [M12-F01-R18](#m12-f01--onboarding-wizard)/[R19](#m12-f01--onboarding-wizard) — opening dip + opening meter readings in the wizard | Frontend + Backend |
| 5 | [M08](#m08--settings--configuration) (order 6) | [M08-F05-R05](#m08-f05--system-preferences) — i18n content sweep (`useTranslation` across shipped screens) | Frontend |

> First below the fold: [M06](#m06--pricing--rate-management) (order 7) → [M06-F01](#m06-f01--price-configuration) price configuration. For the full ranked backlog see [Priority & Implementation Order](#priority--implementation-order); for per-feature numbers see [Appendix C — Priority Matrix](#appendix-c--priority-matrix).
>
> When you pick up an item: flip its row to **In Progress** in the relevant feature table below, in the same commit that starts the work. When done: flip to **Done** in the same PR that ships it.

---

## Priority & Implementation Order

The full module ranking that drives [Current Priorities](#current-priorities).
**Tiers** (P0 = highest): **P0 Critical** (independent + blocks revenue/other
modules), **P1 High** (core operational loop), **P2 Medium** (needs operational
data first), **P3 Low** (gated/optional extensions). **Within a tier, the module
with the fewest unmet dependencies ranks first** — so the most-blocked core
module ([M04](#m04--shift-management)) sorts last in P1 despite being High value.
`Order` is the exact build sequence.

| Order | Priority | Module | Status | Depends on (unmet) | Rationale |
|---|---|---|---|---|---|
| 1 | P0 | [M14](#m14--per-tenant-database-architecture) — Per-Tenant DB | Done ✓ | — | Foundation, shipped |
| 2 | P0 | [M07](#m07--reporting--analytics) — Reporting, Analytics & Platform UI | In Progress | — (design [M07-F09](#m07-f09--design-system--theme-foundation) ✓) | UI shell hosts every page; fully independent unblocker |
| 3 | P0 | [M11](#m11--subscription--billing) — Subscription & Billing | In Progress | — (plans/trial ✓) | Monetization: gating + pricing page; independent |
| 4 | P0 | [M01](#m01--user--access-management) — User & Access Management | In Progress | — (auth ✓) | Access control: roles, permissions, audit; independent |
| 5 | P0 | [M12](#m12--onboarding--first-run-experience) — Onboarding & First-Run | In Progress | M02-F04 dip-conv (for [R18](#m12-f01--onboarding-wizard)) | Conversion funnel; near-done finish |
| 6 | P1 | [M08](#m08--settings--configuration) — Settings & Configuration | In Progress | — | Tank/nozzle config + i18n; mostly independent backbone |
| 7 | P1 | [M06](#m06--pricing--rate-management) — Pricing & Rate Management | Planned | — (fuel types ✓) | Independent; unblocks sales calculation |
| 8 | P1 | [M02](#m02--fuel-inventory--tank-control) — Fuel Inventory & Tank Control | In Progress | F05 variance ← shifts | Tanks/supplier independent; variance waits on shifts |
| 9 | P1 | [M03](#m03--pump--nozzle-operations) — Pump & Nozzle Operations | In Progress | F03 sales ← M06 + readings | Nozzle setup independent; sales calc blocked by M06 |
| 10 | P1 | [M05](#m05--finance--accounts) — Finance & Accounts | Planned | F01 credit-limit ← sales | F03 expenses / F04 banks are independent quick-wins |
| 11 | P1 | [M04](#m04--shift-management) — Shift Management | Planned | M02 dip + M03 readings + M06 prices | Operational heartbeat — **most blocked, so last in core** |
| 12 | P2 | [M10](#m10--sms--notifications) — SMS / Notifications | Planned | event sources (M02/M03/M04/M06) | Needs emitters from other modules first |
| 13 | P3 | [M13](#m13--staff--payroll) — Staff & Payroll | Planned | M04 attendance + M11 gating | Most-blocked extension |
| 14 | P3 | [M09](#m09--lubricants--oil-shop) — Lubricants / Oil Shop | Planned | M11 gating | Independent but low-value gated add-on |

Per-feature priority/order/dependencies are in [Appendix C — Priority Matrix](#appendix-c--priority-matrix).

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
| M01-F08-R08 | Employee HR sensitive events logged: salary structure changes, advance approvals/rejections, employee status changes (Active → Resigned / Terminated) — deferred from [M13-F01-R06](#m13-f01--employee-records), [M13-F02-R06](#m13-f02--salary-management), [M13-F03-R06](#m13-f03--advances--loans) until this module ships | — | Planned |

**Acceptance Criteria:**
- **AC1** Given an admin attempts to delete an audit row, When the delete is issued, Then the operation is blocked at the DB/repo level.
- **AC2** Given an Owner opens the audit log viewer, When they filter by user + date range, Then matching audit rows are returned with before/after values and timestamps.

---

### M01-F09 — Phone-First Authentication   [Status: Done]

> _Discovery (2026-05-19): self-identified gap — own observation, no specific customer ask · outcome = enable signup and recovery in the Pakistani market where many target users lack or lose track of email credentials · maps to ProjectOverView §1.6 Registration & Onboarding and §1.3 Authentication & Security; reinforces Pakistan-market context (M08-F05, M11-F03) · cost-of-not-building: signups abandoned and recovery flows fail for the target audience_

**Tags:** tenant-scope=platform-global; tier=All; capacity-impact=none; locale=PKR-only; sensitive-action=yes; notification-trigger=yes; money-touch=none; shift-lifecycle-touch=none

Phone (+92 format) becomes the primary identifier for registration, login, verification, and recovery. Email is optional and, when provided and verified, can be used as a fallback login and recovery channel. Refines and supersedes parts of [M01-F01](#m01-f01--self-service-registration), [M01-F02](#m01-f02--email-verification), [M01-F03](#m01-f03--login--session), and [M01-F04](#m01-f04--password-recovery). Has a hard dependency on a minimum-viable SMS sender (a subset of [M10-F03](#m10-f03--notification-channels)) being available for pre-organization signup OTP delivery.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M01-F09-R01 | Phone number is required at registration; email is optional | — | Done |
| M01-F09-R02 | Phone number is unique across all users (in addition to format check in [M01-F01-R03](#m01-f01--self-service-registration)) | — | Done |
| M01-F09-R03 | SMS OTP sent at signup; account remains pending and login is blocked until phone is verified | — | Done |
| M01-F09-R04 | OTP is 6 digits, single-use, 5-minute TTL, max 3 verification attempts, max 1 resend per 60 seconds | — | Done |
| M01-F09-R05 | Login accepts phone+password as primary credential; email+password resolves only when the email is set AND verified | — | Done |
| M01-F09-R06 | Existing email-only users are routed through a one-time "add and verify phone" flow on next login; account is restricted to that flow until phone is verified | — | Out of Scope · pre-launch, no email-only users to migrate |
| M01-F09-R07 | When a Manager creates a sub-user, Manager chooses per user whether OTP verification is required before first login (default = required) | — | Planned · deferred to M01-F05-R02 PR |
| M01-F09-R08 | Password recovery offers both channels when both are set (phone OTP and email link); falls back to whichever channel is available when only one is set/verified | — | Done |
| M01-F09-R09 | Sensitive auth actions are written to audit trail (see [M01-F08](#m01-f08--audit-trail)): phone added/changed, OTP failures past threshold, forced-phone-add completion, recovery channel used | — | Planned · deferred to M01-F08 PR |
| M01-F09-R10 | Platform provides a default SMS sender for pre-organization signup OTP (organization-configured providers from [M10-F03-R02](#m10-f03--notification-channels) apply post-onboarding) | — | Done · extended by [M10-F03-R04](#m10-f03--notification-channels) |
| M01-F09-R11 | Authenticated user can change phone number; new number requires SMS OTP verification before the swap is committed | — | Done |
| M01-F09-R12 | OTP issuance is rate-limited per phone (configurable daily cap, default 10) and per IP (sliding window) on `/register`, `/login`, `/verify-phone`, `/resend-otp`, `/forgot-password`, `/phone/change/request`, `/reset-password-otp` | — | Done |

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

The cross-cutting layout that wraps every authenticated page: sidebar, top nav, content area, and route-guard composition. Provides the chrome that the per-module pages (M07-F01..F06, M05, M06, …) plug into. Built on top of the design system from [M07-F09](#m07-f09--design-system--theme-foundation).

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

### M07-F09 — Design System & Theme Foundation   [Status: Done]

> _Discovery (2026-05-24): self-identified gap — own observation that the existing frontend doesn't yet use shadcn primitives or consistent theme tokens · outcome = every authenticated and public page renders through shadcn primitives styled by the `b3lVLqquH` preset, dark mode works everywhere, Urdu / RTL behaves consistently · maps to ProjectOverView (no single motivation — underpins every M07 / M05 / M06 / M11 UI feature; closest narrative anchor is "Bilingual support" under §Localization) · cost-of-not-building: M07-F07, M07-F01..F06 reports, M05 / M06 admin screens, M01-F09 auth screens, and M11-F08 pricing page all get rebuilt twice if shipped without this foundation · install command: `npx shadcn@latest apply --preset b3lVLqquH` (applied to the existing Vite + React 19 project)._

**Tags:** tenant-scope=platform-global; tier=All; capacity-impact=none; locale=Urdu-needed; sensitive-action=no; notification-trigger=no; money-touch=none; shift-lifecycle-touch=none

Provides the shadcn-based design tokens, theme preset, component primitives, dark-mode behaviour, RTL handling, and going-forward conventions that every authenticated and public page is built on. Includes the foundation (tokens, primitives, dark mode, RTL) and the bulk migration of every shipped screen so the codebase ends in a consistent state. Precursor to [M07-F07](#m07-f07--ui-shell), [M11-F08](#m11-f08--plan-comparison--pricing-page), and effectively every other Planned UI feature.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M07-F09-R01 | Apply the `b3lVLqquH` shadcn theme preset to the Vite + React 19 frontend via `npx shadcn@latest apply b3lVLqquH`; design tokens for colours, radii, spacing, and typography come from this preset (preset is Tailwind 4 / shadcn 2.x output; this PR also migrated the project T3.4 → T4.3 via `npx @tailwindcss/upgrade@latest` as a prerequisite) | — | Done |
| M07-F09-R02 | All shadcn baseline primitives needed by the shipped surface (Button, Input, Select, Dialog, Sheet, Sonner, Form, Card, Table, Tabs, Tooltip, Badge, etc.) are installed under `fuel-flow-web/src/components/ui/` using the canonical shadcn structure (the `Form` primitive is intentionally omitted — project uses TanStack Form via `Field` + `FormTextField`) | — | Done |
| M07-F09-R03 | Dark-mode toggle works on every page; switching modes flips theme tokens with no rogue colours, hard-coded hex values, or one-off styles remaining | — | Done |
| M07-F09-R04 | Urdu locale switches layout direction to RTL via `<html dir>` flip in `src/lib/i18n.ts`; all primitives, layouts, icons, and inputs mirror correctly via Tailwind 4 logical utilities (triggered by `<LanguageSwitch />` mounted in every layout header; refines [M08-F05-R02](#m08-f05--system-preferences)) | — | Done |
| M07-F09-R05 | Every authenticated screen shipped before this feature (registration, email verification, login, password recovery, station profile, dashboard summary) is migrated to use shadcn primitives and theme tokens — zero rogue inline styles or one-off colours | — | Done |
| M07-F09-R06 | Every public-facing screen shipped before this feature (registration landing, any marketing route) is migrated to the new system | — | Done |
| M07-F09-R07 | Going-forward standards documented in [`fuel-flow-web/src/components/CLAUDE.md`](../fuel-flow-web/src/components/CLAUDE.md): when to use a shadcn primitive vs build a custom component, naming conventions, theming hooks, RTL guidance, dark-mode test checklist | — | Done |

**Acceptance Criteria:**
- **AC1** Given any authenticated page after migration, When inspected, Then every interactive element resolves to a shadcn primitive (Button, Input, Select, Dialog, …) and no `style={...}` color / radius / spacing overrides exist outside the design-token system.
- **AC2** Given the theme toggle in the top bar, When the user switches dark/light, Then all surfaces, text, borders, and overlays update consistently and no rogue colours persist.
- **AC3** Given the language toggle in the top bar (per [M08-F05-R02](#m08-f05--system-preferences)), When the user switches to Urdu, Then the entire layout flips to RTL, including sidebars, primitive components, and icon positions.
- **AC4** Given the migration is complete, When [`fuel-flow-web/src/components/CLAUDE.md`](../fuel-flow-web/src/components/CLAUDE.md) is opened, Then it documents the going-forward standards for adding new components with examples of compliant vs non-compliant patterns.

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
| M08-F05-R05 | Bootstrap i18next runtime (init code + `main.tsx` wiring + per-user language switcher) and retro-wire `useTranslation` across all auth, dashboard, and onboarding screens. Translation resources for the F09 auth surface (`auth.*` namespace, en + ur) landed via [M01-F09-R12](#m01-f09--phone-first-authentication); this row tracks the runtime hookup and broader-app sweep | — | Planned |

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
| M10-F01-R10 | Payroll-processed alert when Owner finalizes a monthly payroll run (see [M13-F02](#m13-f02--salary-management)) | — | Planned |
| M10-F01-R11 | Advance-approval alert when an employee advance request is approved or rejected (see [M13-F03](#m13-f03--advances--loans)) | — | Planned |
| M10-F01-R12 | Leave-approval alert when an employee leave request is approved or rejected (see [M13-F04](#m13-f04--attendance--leaves)) | — | Planned |

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
| M10-F03-R04 | Production-grade SMS sender for the PK market, replacing the Play-Protect-blocked Android relay used by the [M01-F09-R10](#m01-f09--phone-first-authentication) platform default. Recommended path: USB GSM modem (Huawei E303 / similar) running Gammu or Kannel, exposing an HTTP API consumable by the existing `ISmsSender` contract via a small `GammuSmsSender` impl or a thin Gammu→HTTP shim that `CapcomSmsSender` can already talk to unchanged | — | Planned |

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
| M11-F06-R07 | Employee count per organization checked on creation against plan's `max_employees` JSONB flag; Starter plan limit configurable by Platform Admin via plan seeding | — | Planned |

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

## M12 — Onboarding & First-Run Experience

**Purpose:** Guide a newly registered Owner through the complete first-run setup in a single unified wizard before granting access to the operational dashboard. Covers organization, station, fuel types, opening prices, tanks (with dip charts), nozzles, shift configuration, payment methods, and optional extras (bank account, first manager invite). All step UI is built from scratch; the existing prototype step components in `components/station-setup/` are not reused. Replaces the current single-step `/onboarding` form; the `/dashboard/station/:stationId/setup` route is retained for additional-station setup by multi-station Owners.

### M12-F01 — Onboarding Wizard   [Status: In Progress]

9-step wizard at `/onboarding`. Steps 1–7 are required and sequential. Steps 8–9 are optional (skippable). Step 9 is the Summary. Data is saved progressively (one API call per completed step). Dashboard access is blocked via a route guard until `Station.IsSetupComplete = true`.

**Wizard step map:**

| Step | Name | Required |
|---|---|---|
| 1 | Org + Station | Yes |
| 2 | Fuel types | Yes |
| 3 | Opening prices | Yes |
| 4 | Tanks + dip charts | Yes |
| 5 | Nozzles | Yes |
| 6 | Shift configuration + Payment methods | Yes |
| 7 | Bank account | No — skippable |
| 8 | Invite first manager | No — skippable |
| 9 | Summary + Finish | Yes |

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M12-F01-R01 | Wizard is a 9-step flow at `/onboarding`; Steps 1–7 and 9 cannot be skipped; Steps 8–9 show a "Skip for now" action; dashboard is inaccessible until `isSetupComplete = true` | — | Done |
| M12-F01-R02 | Data is saved progressively — one API call per completed step; on re-visit the wizard auto-advances to the first incomplete step by querying live station data | — | Done |
| M12-F01-R03 | Step 1 — Org + Station: org name (required), station name (required), OMC (required), address + phone (optional); calls existing `POST /onboarding` | — | Done |
| M12-F01-R04 | Step 2 — Fuel types: select from OMC catalog or add custom type (name + unit); at least one required before Next | — | Done |
| M12-F01-R05 | Step 3 — Opening prices: every active fuel type must have a price (PKR/L) set before Next | — | Done |
| M12-F01-R06 | Step 4 — Tanks: every fuel type must have ≥1 tank; each tank requires name, capacity (L), and a dip chart CSV before it can be saved | — | Done |
| M12-F01-R07 | Step 5 — Nozzles: at least one nozzle (linked to a tank, with a nozzle number) must be added before Next | — | Done |
| M12-F01-R08 | Step 6 — Shift configuration + Payment methods: Owner sets shift count per day (2 or 3), each shift's name and start time (required); ticks accepted payment methods (Cash pre-checked; JazzCash, Easypaisa, Card/POS, Bank Transfer optional); calls `POST /stations/{stationId}/shift-config` and `PUT /stations/{stationId}/payment-methods` | — | Done |
| M12-F01-R09 | Step 7 (skippable) — Bank account: bank name (required if not skipped), account number, account title; calls `POST /organizations/{orgId}/bank-accounts`; "Skip for now" bypasses the API call | — | Done |
| M12-F01-R10 | Step 8 (skippable) — Invite first manager: capture phone number (+92 format) and full name; calls `POST /organizations/{orgId}/users` to create a Manager user and dispatch an SMS invite; "Skip for now" bypasses the invite; step shows a clear dependency note if M01-F05-R02 is not yet shipped | — | Done |
| M12-F01-R11 | Step 9 — Summary: read-only view of all configured data grouped by step; "Finish setup" calls `POST /stations/{stationId}/complete-setup`; on success `isSetupComplete = true` and user is redirected to `/dashboard` | — | Done |
| M12-F01-R12 | `Station` entity gains `IsSetupComplete: bool` (default `false`) and `AcceptedPaymentMethods: string[]` (stored as JSONB, default `["Cash"]`); `StationShiftConfig` is a new entity linked to Station with `ShiftCount`, `Shift1Name`, `Shift1StartTime`, `Shift2Name`, `Shift2StartTime`, `Shift3Name?`, `Shift3StartTime?` | — | Done |
| M12-F01-R13 | `BankAccount` is a new entity (`BankName`, `AccountNumber`, `AccountTitle`, `IsPrimary`, `OrganizationId`) scoped to the organization; supports multiple accounts (M05-F04 first implementation) | — | Done |
| M12-F01-R14 | `StationDto` exposes `isSetupComplete` and `acceptedPaymentMethods`; included in auth/login/refresh response so the frontend store has the flag without an extra fetch | — | Done |
| M12-F01-R15 | `POST /stations/{stationId}/complete-setup` validates: shift config exists, ≥1 fuel type, every fuel type has a price, every fuel type has ≥1 tank with a dip chart, ≥1 nozzle; returns `400 { unmetConditions: string[] }` if any check fails | — | Done |
| M12-F01-R16 | Dashboard route guard checks `stations?.[0]?.isSetupComplete`; if false, redirects to `/onboarding` regardless of whether the user has an organization | — | Done |
| M12-F01-R17 | All wizard step UI is built from scratch in `components/onboarding/`; the existing `components/station-setup/` prototype components are not reused in the wizard | — | Done |
| M12-F01-R18 | Step 4 — Tanks: in addition to capacity (L) and dip chart CSV, Owner enters a **current dip reading (mm)** per tank; system converts the mm reading to **current stock in liters** using the just-uploaded dip chart (realizes [M02-F04-R03](#m02-f04--dip-chart-management) in the onboarding context). Both values persisted on the Tank entity as the opening state. Seeds the first opening dip consumed by [M04-F03-R04](#m04-f03--open-shift) ("Opening tank dip readings required for every tank") and the stock calculation in [M02-F05-R01](#m02-f05--dip-readings--stock-variance) ("Stock = Opening Dip + Deliveries − Sales"). | — | Planned |
| M12-F01-R19 | Step 5 — Nozzles: in addition to the nozzle number and tank linkage, Owner enters the **current totalizer meter reading (liters)** per nozzle. Persisted on the Nozzle entity as the opening meter reading. Realizes [M03-F01-R06](#m03-f01--nozzle-setup) ("Initial meter reading captured at nozzle creation") in the onboarding context; seeds the opening reading consumed by [M04-F03-R02](#m04-f03--open-shift) ("Opening meter reading must be ≥ last closing reading") on the first opened shift. | — | Planned |

**Acceptance Criteria:**
- **AC1** Given a newly registered user with no organization, When they log in, Then they are redirected to `/onboarding` Step 1 (Org + Station).
- **AC2** Given a user who completed Steps 1–3 and dropped off, When they log in again, Then the wizard opens at Step 4 (Tanks).
- **AC3** Given the user clicks Next on the fuel-types step with zero types added, When validated, Then an inline error blocks advancement.
- **AC4** Given the user navigates directly to `/dashboard` while `isSetupComplete = false`, When the route guard evaluates, Then they are redirected to `/onboarding`.
- **AC5** Given all required steps complete, When the user clicks "Finish setup" on the Summary step, Then `POST /stations/{stationId}/complete-setup` succeeds, `isSetupComplete` flips to `true`, and the user lands on `/dashboard`.
- **AC6** Given `POST /stations/{stationId}/complete-setup` is called with a missing fuel price, When the handler validates, Then it returns `400` with the unmet condition named.
- **AC7** Given the wizard on a viewport < 640px, When any step is shown, Then the step card and progress indicator are usable without horizontal scrolling.
- **AC8** Given Step 6 (shift config) with no shift names entered, When Next is clicked, Then an inline error blocks advancement.
- **AC9** Given Step 7 (bank account), When the user clicks "Skip for now", Then the wizard advances to Step 8 without making an API call.
- **AC10** Given Step 8 (invite manager), When the user clicks "Skip for now", Then the wizard advances to Step 9 (Summary) without making an API call.
- **AC11** Given Step 4 with a tank that has an uploaded dip chart, When the Owner enters a current dip in mm within the chart's range, Then the form shows the converted liters value live and Next is enabled. _(R18.)_
- **AC12** Given Step 4 with a current dip in mm outside the chart's range (or whose converted liters exceed tank capacity), When validated, Then an inline error blocks advancement and names the tank. _(R18.)_
- **AC13** Given Step 5 with a nozzle, When the Owner enters a negative or non-numeric current meter reading, Then validation blocks Next with a per-nozzle error. _(R19.)_
- **AC14** Given a completed onboarding, When the Owner views Step 9 Summary, Then the opening dip (mm + liters) per tank and the opening meter reading per nozzle are listed under their respective sections. _(R18, R19.)_

---

### M12-F02 — Onboarding Dev Bypass   [Status: Done]

> _Discovery (2026-05-30): self-identified gap — the dashboard route guard ([M12-F01-R16](#m12-f01--onboarding-wizard)) blocks all paths to `/dashboard` until `isSetupComplete=true`; every new wizard requirement (e.g. the just-registered R18/R19) adds friction to that path during active development · outcome = team members and stakeholders can reach the dashboard during active development without completing every step end-to-end · production safety: flag is hard-gated to `IHostEnvironment.IsDevelopment()` in C# code, so it cannot be honored on production binaries even if misconfigured._

**Tags:** tenant-scope=platform-global; tier=All; capacity-impact=none; locale=Urdu-needed; sensitive-action=no; notification-trigger=no; money-touch=none; shift-lifecycle-touch=none

A development-environment-only flag that relaxes the [M12-F01-R16](#m12-f01--onboarding-wizard) dashboard route guard, allowing the dashboard to render even when `Station.IsSetupComplete = false`. Wizard intra-step validation and all backend endpoint preconditions remain strict — this is purely about the entry-gate, not data integrity.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M12-F02-R01 | Backend exposes `devBypassActive: boolean` on the auth response (login, refresh, `GET /auth/me`), computed as `IHostEnvironment.IsDevelopment() && configuration["Features:OnboardingDevBypass"] == "true"`. The `IsDevelopment()` check lives in C# (not config), so a misconfigured production deploy with the env var set still reports `false`. | — | Done |
| M12-F02-R02 | When `devBypassActive` is true, the dashboard `beforeLoad` route guard at `fuel-flow-web/src/routes/dashboard/route.tsx` allows navigation to `/dashboard` even when `stations?.[0]?.isSetupComplete = false`. The onboarding-side guard at `fuel-flow-web/src/routes/onboarding/route.tsx` is unchanged — already-complete users still get redirected from `/onboarding` to `/dashboard`. | — | Done |
| M12-F02-R03 | When `devBypassActive` is true, the wizard shell shows a "Skip to Dashboard (dev only)" affordance between the progress indicator and the step header, visible on every step. Clicking it navigates directly to `/dashboard`. Intra-step validation is not relaxed. | — | Done |
| M12-F02-R04 | When `devBypassActive` is true AND `stations?.[0]?.isSetupComplete = false`, the dashboard renders a persistent banner at the top: "Dev bypass active — onboarding incomplete." When either condition is false the banner is hidden. | — | Done |

**Acceptance Criteria:**

- **AC1** Given `ASPNETCORE_ENVIRONMENT=Production`, When `Features:OnboardingDevBypass=true` is set in env, Then `GET /auth/me` returns `devBypassActive: false`.
- **AC2** Given `ASPNETCORE_ENVIRONMENT=Development` AND `Features:OnboardingDevBypass=true`, When an authenticated user calls `GET /auth/me`, Then the response includes `devBypassActive: true`.
- **AC3** Given `devBypassActive=true` AND `isSetupComplete=false`, When the user navigates to `/dashboard`, Then the dashboard renders without redirect.
- **AC4** Given `devBypassActive=true`, When the user is on any wizard step, Then a "Skip to Dashboard (dev only)" button is visible between the progress bar and step header; clicking it navigates to `/dashboard`.
- **AC5** Given `devBypassActive=true` AND `isSetupComplete=false`, When the dashboard renders, Then a banner "Dev bypass active — onboarding incomplete" is visible at the top.
- **AC6** Given `devBypassActive=true` AND `isSetupComplete=true` (Owner completed onboarding in dev mode), When the dashboard renders, Then no bypass banner is shown.

---

## M13 — Staff & Payroll

**Purpose:** Manage the full HR lifecycle for station employees: records, salary/payroll, advances & loans, and attendance/leaves — with shift-derived attendance (M04-F02) and shortage-deduction integration (M04-F05-R02). Employee records are independent of M01 system-user accounts; an employee may or may not have an app login.

### M13-F01 — Employee Records   [Status: Planned]

> _Discovery (2026-05-30): self-identified gap — own observation · outcome = connect HR operations to station operations so that shift shortages, advances, and attendance all flow into a single payroll calculation instead of being managed on paper/spreadsheets · maps to ProjectOverView §Module 13 Staff & Payroll · cost-of-not-building: payroll computed manually outside the system, creating a disconnect between operational shortage data (M04-F05) and salary deductions; Owner has no real-time HR liability view · implementation note: designed as a self-contained domain (Application/Features/Employees/) so it can be extracted to a reusable library in a later release if needed_

**Tags:** tenant-scope=per-organization; tier=All; capacity-impact=max_employees; locale=PKR-only; sensitive-action=yes; notification-trigger=yes; money-touch=none; shift-lifecycle-touch=none

Employee profile: CNIC, name, phone, hire date, designation, station, employment status. Optional FK to M01 user account. Capacity-limited on Starter plan via `max_employees`.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M13-F01-R01 | Employee CNIC is unique per organization | — | Planned |
| M13-F01-R02 | Employee record stores: full name, CNIC, phone, hire date, designation, primary station assignment, employment status (Active / On Leave / Resigned / Terminated) | — | Planned |
| M13-F01-R03 | Employee record can be optionally linked to an M01 user account (nullable FK); deleting the M01 user does not cascade-delete the employee record | — | Planned |
| M13-F01-R04 | Employee count per organization checked against `max_employees` plan limit on creation (see [M11-F06-R07](#m11-f06--feature-gating)) | — | Planned |
| M13-F01-R05 | Only Owner and Manager can create, update, or terminate employee records | — | Planned |
| M13-F01-R06 | Employee status changes written to audit trail (see [M01-F08-R08](#m01-f08--audit-trail)) | — | Planned |

**Acceptance Criteria:**
- **AC1** Given a duplicate CNIC within the same organization, When a new employee is created, Then API returns `409 Conflict`.
- **AC2** Given the org has reached its `max_employees` plan limit, When Owner attempts to add another employee, Then API returns `402 Payment Required` with an upgrade prompt.
- **AC3** Given an employee linked to an M01 user account, When that M01 user account is deleted, Then the employee record is retained and the FK is set to null.

---

### M13-F02 — Salary Management   [Status: Planned]

Per-employee salary structure; monthly payroll computation that deducts advance repayments (M13-F03), nozzleman shortage balance (M04-F05-R02 ledger), and leave-without-pay (M13-F04-R05). Payroll records are immutable after Owner approval.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M13-F02-R01 | Salary structure per employee: base salary + configurable allowances (house rent, transport, medical) − configurable fixed deductions | — | Planned |
| M13-F02-R02 | Monthly payroll computed as: Salary Structure − Advance/Loan Installments ([M13-F03-R02](#m13-f03--advances--loans)) − Shortage Deductions (balance-due from [M04-F05-R02](#m04-f05--sales--shortage-settlement)) − Leave-Without-Pay Deductions ([M13-F04-R05](#m13-f04--attendance--leaves)) | — | Planned |
| M13-F02-R03 | Salary payment recorded with date, amount paid, payment method, and optional proof image | — | Planned |
| M13-F02-R04 | Payroll history retained per employee; individual payroll records not editable after Owner approval | — | Planned |
| M13-F02-R05 | Only Owner can finalize (approve) a payroll run | — | Planned |
| M13-F02-R06 | Salary structure changes and payroll finalization logged to audit trail (see [M01-F08-R08](#m01-f08--audit-trail)) | — | Planned |

**Acceptance Criteria:**
- **AC1** Given an employee with a Rs. 500 shortage balance and a Rs. 1,000 advance installment due, When payroll is computed for that month, Then net payable = base salary + allowances − fixed deductions − Rs. 500 − Rs. 1,000.
- **AC2** Given a finalized payroll run, When an Owner attempts to edit the amounts, Then API returns `403 Forbidden`.
- **AC3** Given Owner finalizes a payroll run, When the event fires, Then a payroll-processed notification is sent per [M10-F01-R10](#m10-f01--notification-events).

---

### M13-F03 — Advances & Loans   [Status: Planned]

Cash advance against salary with automatic payroll deduction; loans with configurable installment schedule.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M13-F03-R01 | Advance amount cannot exceed one month's net salary by default; Owner can raise the cap per employee | — | Planned |
| M13-F03-R02 | Approved advance deducted automatically from next payroll run (see [M13-F02-R02](#m13-f02--salary-management)) | — | Planned |
| M13-F03-R03 | Loan repayment schedule configurable: full deduction next month, or split across N monthly installments | — | Planned |
| M13-F03-R04 | Advance and loan requests require approval from Owner or Manager before disbursement | — | Planned |
| M13-F03-R05 | Outstanding advance and loan balance visible per employee on their profile | — | Planned |
| M13-F03-R06 | Advance approvals and disbursements logged to audit trail (see [M01-F08-R08](#m01-f08--audit-trail)) | — | Planned |

**Acceptance Criteria:**
- **AC1** Given an advance request where the amount exceeds one month's net salary, When submitted, Then API returns `400 Bad Request` with the max-allowed amount in the response.
- **AC2** Given Owner approves an advance request, When approved, Then the outstanding balance is updated, disbursement is recorded, and a notification is sent per [M10-F01-R11](#m10-f01--notification-events).

---

### M13-F04 — Attendance & Leaves   [Status: Planned]

Shift-derived attendance (M04-F02 assignment = Present); leave types with annual allocations; leave-without-pay feeds payroll deduction.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M13-F04-R01 | Leave types: Annual, Sick, Casual; annual allocation per leave type is Owner-configurable (per organization or per station) | — | Planned |
| M13-F04-R02 | Daily attendance derived from [M04-F02](#m04-f02--nozzleman-assignment) shift assignments: employee has a shift assignment on a given date → marked Present for that date | — | Planned |
| M13-F04-R03 | Leave request submitted by Manager on behalf of employee (or by the employee's linked M01 user if one exists); approved by Owner or Manager | — | Planned |
| M13-F04-R04 | Approved leave deducted from employee's available leave balance for the year | — | Planned |
| M13-F04-R05 | Leave-without-pay applied when leave balance is exhausted; amount deducted in next payroll run per [M13-F02-R02](#m13-f02--salary-management) | — | Planned |
| M13-F04-R06 | Monthly attendance summary (present days, absent days, leave days taken) computed and fed into payroll calculation | — | Planned |

**Acceptance Criteria:**
- **AC1** Given an employee with 0 annual leave remaining, When a leave request is submitted, Then the system records it as Leave Without Pay and the Owner is notified via [M10-F01-R12](#m10-f01--notification-events).
- **AC2** Given an employee has a shift assignment on a given date (M04-F02), When the monthly attendance report is generated, Then that date is counted as Present.
- **AC3** Given Owner approves a leave request, When approved, Then the leave balance decrements and a notification fires per [M10-F01-R12](#m10-f01--notification-events).

---

## M14 — Per-Tenant Database Architecture

> _Discovery (2026-05-30): user-driven architectural pivot away from the previously-planned Option C / M01-F10 "Tenant Isolation Hardening" (shared-DB + global query filters) toward physical database-per-Organization isolation · outcome = each Organization is provisioned its own PostgreSQL database at signup; per-request connection routing resolves the tenant DB from the JWT `org_id` claim; Identity and pre-org flows target a small "control plane" database · maps to root [`CLAUDE.md`](../CLAUDE.md) "Multi-Tenancy Model" section (will be rewritten by M14-F06) and supersedes the strategy-plan artefact at `~/.claude/plans/compaision-for-shifting-to-memoized-tower.md` · cost-of-not-building: cannot offer per-tenant backups/restore, regional data residency, or physical isolation to future enterprise/govt customers · cost-of-building-now: ~4–6 weeks across 6 PRs, pauses M04–M10 MVP velocity, ~5–30s first-signup latency, one Postgres connection pool per tenant, ops complexity scales linearly with tenant count_

**Tags:** tenant-scope=platform-global; tier=All; capacity-impact=high; locale=N/A; sensitive-action=yes; notification-trigger=no; money-touch=none; shift-lifecycle-touch=none

**Purpose.** Split the current single PostgreSQL database into a **control plane** (Identity, Tenants registry, Subscriptions, SubscriptionPlans, OMC reference, FuelType reference, PhoneVerification, RefreshToken) and **per-tenant operational databases** (Organization, Stations, FuelTanks, FuelNozzles, FuelPrices, Shifts, ShiftAssignments, NozzleReadings, FuelTankReadings, DipCharts, StationShiftConfig, BankAccount, UserStation). Each Organization receives its own PostgreSQL database, dynamically provisioned at signup via `ITenantProvisioningService.ProvisionAsync(organizationId)`. Per-request connection routing through `ITenantConnectionResolver` resolves the tenant DB from the JWT `org_id` claim. Pre-org-creation flows (registration, phone OTP, login by phone) target only the control plane.

**Ships as six sequential PRs (F01 → F06).** MVP feature work (M04–M10) is paused for the duration. F01 is the foundational refactor; F02–F06 build the per-tenant infrastructure on top.

---

### M14-F01 — Control Plane / Tenant DbContext Split   [Status: Done]

Establish the conceptual split between control-plane data and tenant data before any infrastructure change. After F01, the application still runs against one PostgreSQL database, but the code knows which tables are platform-wide and which are tenant-scoped. This makes F02–F06 mechanical instead of architectural.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M14-F01-R01 | Two EF Core contexts: `ControlPlaneDbContext` (Identity, `Tenants`, `Subscriptions`, `SubscriptionPlans`, `OMCs`, `OMCFuelTypes`, `FuelTypes`, `PhoneVerifications`, `RefreshTokens`) and `AppDbContext` (`Organizations`, `Stations`, `FuelTanks`, `FuelNozzles`, `FuelPrices`, `StationShifts`, `ShiftAssignments`, `NozzleReadings`, `FuelTankReadings`, `DipCharts`, `DipChartEntries`, `StationShiftConfigs`, `BankAccounts`, `UserStations`). Both target the same physical Postgres database in this feature; per-tenant routing arrives in [M14-F02](#m14-f02--tenant-registry--connection-resolution). | — | Done |
| M14-F01-R02 | Migration histories rewritten as two fresh `Initial` migrations under `server/FuelFlow.Infrastructure/Migrations/ControlPlane/` and `server/FuelFlow.Infrastructure/Migrations/Tenant/`. All 58 existing migration files deleted; dev databases wiped. Acceptable pre-launch (no production data). | — | Done |
| M14-F01-R03 | New `Tenant` entity in `FuelFlow.Domain.Entities` with `Id (Guid, == OrganizationId)`, `DatabaseName (string)`, `Status (TenantStatus enum: Provisioning, Active, Suspended, Deleted)`, `ProvisionedAt (DateTime?)`, `DeletedAt (DateTime?)`. Plus new `TenantStatus` enum in `FuelFlow.Domain.Enums`. Configured in `ControlPlaneDbContext`. `Tenant.Id == Organization.Id` enforced at app layer. | — | Done |
| M14-F01-R04 | Identity-side cross-context navigation properties dropped (`Organization.Owner`, `UserStation.User`, `OMC.Stations` reverse, `FuelType.Station`, `AppUserConfiguration.HasOne<Organization>()` + the `HasOne<AppUser>()` FK declarations on `StationShift`, `FuelTankReading`, `NozzleReadings`, `ShiftAssignment`). Replaced with plain `Guid` FK columns; cross-context referential integrity becomes app-layer concern. The `FuelTank.FuelType`, `Station.OMC`, `FuelPrices.FuelType` navs were retained as F01 shims (registered in `AppDbContext.OnModelCreating` with `ExcludeFromMigrations`) to keep existing `.Include()` queries working in F01; M14-F03 will remove or replicate them. | — | Done |
| M14-F01-R05 | Handlers rebound to use correctly-routed repositories — 7 control-plane-bound (RefreshToken, PhoneVerification, Subscription, SubscriptionPlan, OMC, OMCFuelType, FuelType) and 11 tenant-bound. `OnboardingCommandHandler` becomes the canonical cross-context case (still one physical DB in F01, so `TransactionScope` continues to work). UnitOfWork redesigned to flush both contexts. F03 replaces this with a real saga. | — | Done |

**Acceptance Criteria:**
- **AC1** Given a fresh empty Postgres database, When `dotnet ef database update --context ControlPlaneDbContext` then `--context AppDbContext` are run, Then both `Initial` migrations apply cleanly with zero errors.
- **AC2** Given the full smoke flow (register → verify phone OTP → log in → complete onboarding wizard → CRUD on Station/Tank/Nozzle → log out → log back in), When run on a fresh local dev environment via `./scripts/dev.ps1`, Then every M01-F09 and M12-F01/F02 user-visible behavior works exactly as before; M14-F01 is invisible to users.
- **AC3** Given the `DataSeeder` runs at startup, When the app boots against fresh control-plane tables, Then OMCs, FuelTypes, SubscriptionPlans, and Identity roles are seeded into the control-plane schema. Re-running the app produces no duplicate rows (idempotent).
- **AC4** Given Postgres after a successful migration, When inspecting the schema, Then no FK constraint crosses from a tenant-context table into an Identity table — those references are plain `Guid` columns with app-layer enforcement only.
- **AC5** Given a Playwright e2e run of `fuel-flow-web/e2e-tests/M14-F01.spec.ts`, When the full regression flow executes, Then all assertions pass without modification to pre-existing flows.

---

### M14-F02 — Tenant Registry & Connection Resolution   [Status: Done]

Scoped `TenantDbContextAccessor` wraps `IDbContextFactory<AppDbContext>` and resolves the correct per-tenant `AppDbContext` once per HTTP request from the JWT `org_id` claim. All 11 per-tenant repositories and `UnitOfWork` are refactored to inject the accessor instead of `AppDbContext` directly. Ships in the same PR as M14-F03 so `DatabaseName` is always populated before the resolver runs.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M14-F02-R01 | `ITenantConnectionResolver` interface in `FuelFlow.Application.Interfaces.Services`. Implementation reads `ICurrentUserService.OrganizationId`, queries `ControlPlaneDbContext.Tenants` for the matching row, and derives the connection string by replacing the database name in `DefaultConnection` with `Tenant.DatabaseName`. Returns `null` when `org_id` is absent (unauthenticated / pre-org flows). Throws `TenantNotFoundException` (maps to 503) when `org_id` is present but no `Tenant` row exists. No in-process caching. | — | Done |
| M14-F02-R02 | `TenantDbContextAccessor` scoped service registered in DI. On first access it calls `ITenantConnectionResolver`, builds `DbContextOptions<AppDbContext>` with the resolved connection string, and creates an `AppDbContext` via `IDbContextFactory<AppDbContext>`. Subsequent accesses within the same HTTP request return the same instance. | — | Done |
| M14-F02-R03 | `AddDbContext<AppDbContext>` replaced with `AddDbContextFactory<AppDbContext>` in `DependencyInjection.cs`. `TenantDbContextAccessor` registered as Scoped. The `AppDbContext` scoped registration is removed. | — | Done |
| M14-F02-R04 | All 11 per-tenant repositories (`OrganizationRepository`, `StationRepository`, `FuelTankRepository`, `FuelNozzleRepository`, `FuelPricesRepository`, `StationShiftRepository`, `ShiftAssignmentRepository`, `DipChartRepository`, `UserStationRepository`, `StationShiftConfigRepository`, `BankAccountRepository`) refactored to inject `TenantDbContextAccessor` and access `AppDbContext` via its `.Context` property. | — | Done |
| M14-F02-R05 | `UnitOfWork` refactored to inject `TenantDbContextAccessor` instead of `AppDbContext` directly. `SaveChangesAsync`, `BeginTransactionAsync`, `CommitAsync`, and `RollbackAsync` all operate on `accessor.Context`. | — | Done |

**Acceptance criteria:**

- **AC1** — An authenticated request with a valid `org_id` JWT claim resolves to the correct tenant DB; queries hit the right `AppDbContext` instance.
- **AC2** — An unauthenticated request (no `org_id`) that touches only control-plane repos completes without error; `TenantDbContextAccessor` is never accessed.
- **AC3** — A request with an `org_id` that has no `Tenant` row returns HTTP 503.
- **AC4** — All existing integration tests pass with no behaviour change observable at the API level.

---

### M14-F03 — Tenant Provisioning Service   [Status: Done]

`ITenantProvisioningService.ProvisionAsync` runs synchronously during onboarding step 1: creates a Postgres database named `tenant_<orgId:N>`, applies all tenant migrations, inserts the `Organization` row, and flips the control-plane `Tenant.Status` to `Active`. Compensating actions roll back on any failure. Ships with M14-F02 in one PR.

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| M14-F03-R01 | `ITenantProvisioningService` interface in `FuelFlow.Application.Interfaces.Services` with `Task ProvisionAsync(Guid organizationId, string organizationName, Guid ownerId, CancellationToken ct)`. | — | Done |
| M14-F03-R02 | `TenantProvisioningService` implementation: (1) Insert `Tenant` row into control plane (`Status = Provisioning`, `DatabaseName = "tenant_{organizationId:N}"`); (2) Open a raw `NpgsqlConnection` to the control-plane DB and execute `CREATE DATABASE "tenant_{organizationId:N}"` outside any transaction (DDL auto-commit); (3) Build `DbContextOptions<AppDbContext>` targeting the new DB and call `MigrateAsync` to apply all tenant migrations; (4) Insert `Organization` row (`Id = organizationId`, `Name = organizationName`, `OwnerId = ownerId`) into the new tenant DB; (5) Flip `Tenant.Status` to `Active`, set `ProvisionedAt = UtcNow`. | — | Done |
| M14-F03-R03 | Compensating actions on failure: if the DB was created (step 2 succeeded), execute `DROP DATABASE IF EXISTS "tenant_{organizationId:N}"` before re-throwing. Always delete the `Tenant` row from the control plane on any failure path. | — | Done |
| M14-F03-R04 | `fuelflow` Postgres user granted `CREATEDB` privilege. `server/docker-compose.yml` updated to include an init SQL file (`docker-entrypoint-initdb.d/01-grants.sql`) that runs `ALTER ROLE fuelflow CREATEDB;`. | — | Done |
| M14-F03-R05 | `OnboardingCommandHandler` step 1 rewired: call `ITenantProvisioningService.ProvisionAsync(orgId, orgName, ownerId)` instead of creating the `Organization` row directly. After success: set `AppUser.OrganizationId`, persist via `IUnitOfWork`, re-issue JWT with `org_id` claim. The provisioning call blocks synchronously — no background job in this phase. | — | Done |

**Acceptance criteria:**

- **AC1** — Completing onboarding step 1 creates a new Postgres database named `tenant_<orgId>`, a `Tenant` row (Status `Active`) in the control plane, and an `Organization` row in the tenant DB.
- **AC2** — JWT re-issued after step 1 carries the `org_id` claim. Subsequent authenticated requests (steps 2–9 of the wizard) resolve and route to the tenant DB.
- **AC3** — If provisioning fails at any step, the control-plane `Tenant` row is deleted and no orphaned DB remains. The HTTP response is 500 with a clear error message.
- **AC4** — A Playwright E2E run of the full registration → onboarding → station-CRUD flow passes end-to-end against a fresh dev database.

---

### M14-F04 — Onboarding Flow Adaptation   [Status: Done]

`POST /onboarding` step 1 now creates the control-plane `Tenant` row (status `Provisioning`), calls `ITenantProvisioningService`, re-issues the JWT with the `org_id` claim, and returns. Steps 2–9 of the wizard route by `stationId` and naturally hit the new tenant DB via the resolver. Wizard chrome shows a "Provisioning your workspace…" state during step 1 (~5–30s). Purely frontend — M14-F02/F03 completed the backend provisioning.

| ID | Requirement | Notes | Status |
|---|---|---|---|
| M14-F04-R01 | During step 1 provisioning (mutation in flight), the wizard UI is replaced by a full-screen overlay ("Setting up your workspace…" + spinner + ~30s note); all wizard interaction is blocked; a `beforeunload` listener warns if the user tries to navigate away. | New `ProvisioningOverlay` component rendered in `StepOrgStation` | Done |
| M14-F04-R02 | If step 1 returns HTTP 500, the overlay is dismissed, the form re-enables, a Sonner error toast fires, and the inline `<Alert variant="destructive">` shows the server error; user can retry without a page reload. | Extension of existing `submitError` + `isSubmitting` state | Done |
| M14-F04-R03 | Playwright E2E spec `fuel-flow-web/e2e-tests/M14-F04.spec.ts` walks the full journey: registration → phone OTP → login → onboarding (all 9 steps, provisioning overlay observed during step 1) → station/tank/nozzle CRUD → logout → re-login. | Covers M14-F02/F03-AC7 deferred from that PR | Done |

**Acceptance criteria:**

- **AC1** — After step 1 submission the full-screen overlay replaces the wizard content; no wizard interaction is possible while it is visible; pressing the browser Back button triggers a `beforeunload` warning.
- **AC2** — When `POST /onboarding` succeeds, the overlay disappears and the wizard advances to step 2; the auth store is updated with the new JWT carrying `org_id`.
- **AC3** — When `POST /onboarding` returns HTTP 500, the overlay is dismissed, the form re-enables, a Sonner error toast fires, and the inline `<Alert>` shows the error; the user can retry without a page reload.
- **AC4** — Playwright spec `M14-F04.spec.ts` passes end-to-end: registration → phone OTP → login → onboarding (provisioning overlay observed) → wizard completion → station/tank/nozzle CRUD.

---

### M14-F05 — Identity & Auth Adaptation   [Status: Done]

Pre-org-creation flows (registration, phone OTP, login by phone, password recovery) hit only the control plane — no tenant context needed. After login, JWT carries `org_id`; subsequent requests are tenant-routed. `UserStation` cross-DB link enforced at app layer (no FK). Phone uniqueness enforced via index on control-plane `AspNetUsers`. Purely backend — no frontend changes.

| ID | Requirement | Notes | Status |
|---|---|---|---|
| M14-F05-R01 | Add a unique index on `AspNetUsers.PhoneNumber` in the ControlPlane DB via a new EF Core migration and `AppUserConfiguration` update. PostgreSQL UNIQUE indexes natively allow multiple NULLs, so a standard (non-partial) unique index on the nullable column is correct. The existing app-level check in `RegisterCommandHandler` remains as an earlier-exit guard. | ControlPlane migration + configuration | Done |
| M14-F05-R02 | Verify that all pre-org-creation handlers (`RegisterCommandHandler`, `LoginCommandHandler`, `VerifyPhoneCommandHandler`, `ForgotPasswordCommandHandler`, `ResetPasswordCommandHandler`, `RefreshTokenCommandHandler`, `GetCurrentUserQueryHandler`) touch only `ControlPlaneDbContext`; no `TenantDbContextAccessor` is accessed for users without `org_id`. Document the M14 multi-tenancy contract in each handler's class-level summary. | Verification pass + doc comments; `LoginCommandHandler` guard already correct at line 118 | Done |
| M14-F05-R03 | `UserStation` cross-DB link: document in code that `UserStation.UserId` is a plain `Guid` column (no FK) and that handlers inserting `UserStation` rows must verify user existence via `UserManager.FindByIdAsync` before insert. Note deferred handlers (e.g. `CreateShiftAssignmentCommandHandler`) as `TODO M01-F05` in a code comment. | Code comments only; ShiftAssignment user-existence check deferred to M01-F05 | Done |

**Acceptance criteria:**

- **AC1** — Attempting to register two users with the same phone number results in HTTP 400 for the second attempt, enforced at the DB level (not just application code).
- **AC2** — A freshly-registered user (no `OrganizationId`) can log in, refresh tokens, and call `GET /auth/me` without any 503 or 500 from the tenant-DB stack; the response omits `organization`, `stations`, and `subscription`.
- **AC3** — An onboarded user (JWT carries `org_id`) can log in and receive `organization`, `stations`, and `subscription` populated from the tenant DB.

---

### M14-F06 — Migration Tooling & Dev/Ops   [Status: Done]

`server/db-migration-add.ps1` and `db-update.ps1` already have `-Context` support (shipped with M14-F01). Remaining work: startup task that applies pending tenant migrations to every active tenant DB on app boot; `scripts/dev.ps1 --reset-all` to wipe and rebuild all DBs for local dev; documentation sweep to rewrite the root `CLAUDE.md` Multi-Tenancy Model section and audit all stale M14 references across scoped CLAUDE.md files.

| ID | Requirement | Notes | Status |
|---|---|---|---|
| M14-F06-R01 | On app boot, scan `Tenants` where `Status == Active`, resolve each tenant's connection string via `ITenantConnectionResolver`, and call `AppDbContext.Database.MigrateAsync()` on each. Implemented as an `IHostedService`. On per-tenant failure: log the error and continue — the app starts and serves other tenants; the failing tenant's row is not modified (manual investigation required). | Infrastructure — new `TenantMigrationHostedService` | Done |
| M14-F06-R02 | Extend `scripts/dev.ps1` with a `-ResetAll` switch. When set: (1) drop the control plane DB + all tenant DBs (databases matching the `tenant_*` naming convention via `psql`/docker exec); (2) run `db-update.ps1 -Context ControlPlane` to rebuild; (3) exit. Does not start the app — tenant DBs are provisioned fresh on first onboarding. | Scripts — PowerShell | Done |
| M14-F06-R03 | Documentation sweep: rewrite the root `CLAUDE.md` "Multi-Tenancy Model" section to reflect the current live architecture (per-tenant DBs via `ITenantConnectionResolver`, M14-F01–F05 all Done). Audit `server/CLAUDE.md`, `server/FuelFlow.Infrastructure/CLAUDE.md`, `server/FuelFlow.Api/CLAUDE.md`, `server/FuelFlow.Application/CLAUDE.md`, `server/FuelFlow.Domain/CLAUDE.md`, `fuel-flow-web/CLAUDE.md` for any stale forward-references to M14-F01/F02/F03 as future work and update them. | Docs only — no code changes | Done |

**Acceptance criteria:**

- **AC1** — Fresh `dotnet run` on a DB with 2+ active `Tenant` records applies any pending tenant migrations to each tenant DB before requests are served; if one tenant's migration fails, the error is logged, the app starts, and other tenants are unaffected.
- **AC2** — `./scripts/dev.ps1 -ResetAll` drops the control plane DB and all `tenant_*` databases, runs `db-update.ps1 -Context ControlPlane` successfully, and exits (no server start).
- **AC3** — Root `CLAUDE.md` Multi-Tenancy Model section and all scoped `CLAUDE.md` files contain no stale forward-references to M14 features as future work; the current architecture is accurately described.

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

## Appendix C — Priority Matrix

Every feature, numbered. Grouped by module in implementation **Order** (the same
order as [Priority & Implementation Order](#priority--implementation-order)).

- **Tier:** P0 Critical · P1 High · P2 Medium · P3 Low (P0 = highest). See [Priority & order](#priority--order-how-this-file-is-ranked).
- **Feature Order** = `<moduleOrder>.<n>`, the build sequence inside the module.
- **Depends on** = unmet prerequisites (`—` means all prerequisites are `Done` → independent).
- **★ Next** = the recommended next item to pick up for that module: continue it if `In Progress`, otherwise its highest-priority independent `Planned` item. Fully-`Done` modules have none. The ★ rows are exactly the [Current Priorities](#current-priorities) Top-5 (for the top modules) and the analogous lead item for the rest.

### Order 1 — M14 Per-Tenant DB  ·  P0  ·  Done ✓

| Order | ID | Feature | Tier | Status | Depends on | ★ |
|---|---|---|---|---|---|---|
| 1.1 | M14-F01 | Control Plane / Tenant DbContext Split | P0 | Done | — | |
| 1.2 | M14-F02 | Tenant Registry & Connection Resolution | P0 | Done | — | |
| 1.3 | M14-F03 | Tenant Provisioning Service | P0 | Done | — | |
| 1.4 | M14-F04 | Onboarding Flow Adaptation | P0 | Done | — | |
| 1.5 | M14-F05 | Identity & Auth Adaptation | P0 | Done | — | |
| 1.6 | M14-F06 | Migration Tooling & Dev/Ops | P0 | Done | — | |

### Order 2 — M07 Reporting, Analytics & Platform UI  ·  P0

| Order | ID | Feature | Tier | Status | Depends on | ★ |
|---|---|---|---|---|---|---|
| 2.1 | M07-F09 | Design System & Theme Foundation | P0 | Done | — | |
| 2.2 | M07-F07 | UI Shell | P0 | Planned | — (F09 ✓) | ★ |
| 2.3 | M07-F08 | Progressive Web App (PWA) | P1 | Planned | M07-F07 | |
| 2.4 | M07-F05 | Dashboard Widgets | P2 | In Progress | shift/sales data (M03/M04) | |
| 2.5 | M07-F01 | Daily Sales Report | P2 | Planned | M03/M04 | |
| 2.6 | M07-F02 | Inventory Reports | P2 | Planned | M02 | |
| 2.7 | M07-F03 | Financial Reports | P2 | Planned | M04/M05 | |
| 2.8 | M07-F04 | Export & Automation | P2 | Planned | F01–F03 + M11-F06 | |
| 2.9 | M07-F06 | Consolidated All-Stations View | P2 | Planned | F01/F05 | |

### Order 3 — M11 Subscription & Billing  ·  P0

| Order | ID | Feature | Tier | Status | Depends on | ★ |
|---|---|---|---|---|---|---|
| 3.1 | M11-F01 | Subscription Plans | P0 | Done | — | |
| 3.2 | M11-F02 | Trial Period | P0 | Done | — | |
| 3.3 | M11-F06 | Feature Gating | P0 | In Progress | — (plans ✓) | ★ |
| 3.4 | M11-F08 | Plan Comparison & Pricing Page | P0 | Planned | — (plans ✓) | |
| 3.5 | M11-F03 | Payment & Verification | P1 | Planned | — | |
| 3.6 | M11-F04 | Expiry & Grace Period | P1 | Planned | M11-F03 | |
| 3.7 | M11-F05 | Plan Changes (Upgrade / Downgrade) | P1 | Planned | M11-F03 | |
| 3.8 | M11-F07 | Billing History | P2 | Planned | M11-F03 | |

### Order 4 — M01 User & Access Management  ·  P0

| Order | ID | Feature | Tier | Status | Depends on | ★ |
|---|---|---|---|---|---|---|
| 4.1 | M01-F01 | Self-Service Registration | P0 | Done | — | |
| 4.2 | M01-F02 | Email Verification | P0 | Done | — | |
| 4.3 | M01-F03 | Login & Session | P0 | Done | — | |
| 4.4 | M01-F09 | Phone-First Authentication | P0 | Done | — | |
| 4.5 | M01-F04 | Password Recovery | P0 | Done | — | |
| 4.6 | M01-F05 | Roles & Hierarchy | P0 | In Progress | — (auth ✓) | ★ |
| 4.7 | M01-F06 | Granular Permissions | P0 | Planned | M01-F05 | |
| 4.8 | M01-F07 | Multi-Station Access | P1 | In Progress | M07 dashboards (R04/R05) | |
| 4.9 | M01-F08 | Audit Trail | P1 | Planned | — (consumes events from M01-F09/M06/M13) | |

### Order 5 — M12 Onboarding & First-Run  ·  P0

| Order | ID | Feature | Tier | Status | Depends on | ★ |
|---|---|---|---|---|---|---|
| 5.1 | M12-F01 | Onboarding Wizard | P0 | In Progress | M02-F04 dip-conv (R18) | ★ |
| 5.2 | M12-F02 | Onboarding Dev Bypass | P0 | Done | — | |

### Order 6 — M08 Settings & Configuration  ·  P1

| Order | ID | Feature | Tier | Status | Depends on | ★ |
|---|---|---|---|---|---|---|
| 6.1 | M08-F01 | Station Profile | P1 | Done | — | |
| 6.2 | M08-F02 | Tank Configuration | P1 | In Progress | — | |
| 6.3 | M08-F03 | Nozzle Configuration | P1 | In Progress | — | |
| 6.4 | M08-F05 | System Preferences | P1 | Planned | — (i18n foundation ✓; R05 sweep) | ★ |
| 6.5 | M08-F04 | Dip Chart Management | P1 | Planned | M02-F04 | |
| 6.6 | M08-F06 | Backup & Data | P2 | Planned | — | |

### Order 7 — M06 Pricing & Rate Management  ·  P1

| Order | ID | Feature | Tier | Status | Depends on | ★ |
|---|---|---|---|---|---|---|
| 7.1 | M06-F01 | Price Configuration | P1 | Planned | — (fuel types ✓) | ★ |
| 7.2 | M06-F02 | Price Change Workflow | P1 | Planned | M06-F01 (+ M10 for R03) | |
| 7.3 | M06-F04 | Margins & Discounts | P1 | Planned | M06-F01 | |
| 7.4 | M06-F06 | Promotional Pricing | P2 | Planned | M06-F01 | |
| 7.5 | M06-F05 | Customer Special Rates | P2 | Planned | M06-F01 + M05-F01 | |
| 7.6 | M06-F03 | Mid-Shift Price Handling | P2 | Planned | M06-F01 + M04 shifts | |

### Order 8 — M02 Fuel Inventory & Tank Control  ·  P1

| Order | ID | Feature | Tier | Status | Depends on | ★ |
|---|---|---|---|---|---|---|
| 8.1 | M02-F01 | Fuel Products | P1 | Done | — | |
| 8.2 | M02-F03 | Underground Tank Management | P1 | In Progress | — | ★ |
| 8.3 | M02-F02 | Supplier Tracking | P1 | Planned | — | |
| 8.4 | M02-F04 | Dip Chart Management | P1 | Planned | M02-F03 | |
| 8.5 | M02-F06 | Fuel Receiving (Tanker Delivery) | P1 | Planned | M02-F03/F04 | |
| 8.6 | M02-F05 | Dip Readings & Stock Variance | P2 | Planned | M02-F04 + M04 shifts | |

### Order 9 — M03 Pump & Nozzle Operations  ·  P1

| Order | ID | Feature | Tier | Status | Depends on | ★ |
|---|---|---|---|---|---|---|
| 9.1 | M03-F01 | Nozzle Setup | P1 | In Progress | — | ★ |
| 9.2 | M03-F02 | Meter Reading Entry | P1 | Planned | M03-F01 + M04 shifts | |
| 9.3 | M03-F03 | Sales Calculation | P1 | Planned | M06-F01 + M03-F02 | |
| 9.4 | M03-F04 | Shortage & Excess Tracking | P2 | Planned | M03-F03 + M04-F05 | |

### Order 10 — M05 Finance & Accounts  ·  P1

| Order | ID | Feature | Tier | Status | Depends on | ★ |
|---|---|---|---|---|---|---|
| 10.1 | M05-F03 | Daily Expenses | P1 | Planned | — | ★ |
| 10.2 | M05-F04 | Bank Accounts | P1 | Planned | — (entity seeded by M12 ✓) | |
| 10.3 | M05-F02 | Supplier Payments (Payables) | P1 | Planned | — | |
| 10.4 | M05-F01 | Credit Customers (Udhaar / Receivables) | P1 | Planned | R01 enforce ← M03 sales | |

### Order 11 — M04 Shift Management  ·  P1

| Order | ID | Feature | Tier | Status | Depends on | ★ |
|---|---|---|---|---|---|---|
| 11.1 | M04-F01 | Shift Configuration | P1 | Planned | — | ★ |
| 11.2 | M04-F02 | Nozzleman Assignment | P1 | Planned | M04-F01 | |
| 11.3 | M04-F03 | Open Shift | P1 | Planned | M02-F04 dip + M03-F01 + M06-F01 | |
| 11.4 | M04-F04 | Close Shift | P1 | Planned | M04-F03 + readings | |
| 11.5 | M04-F05 | Sales & Shortage Settlement | P1 | Planned | M03-F03 + M04-F04 | |
| 11.6 | M04-F06 | Cash Collection | P1 | Planned | M04-F04 | |

### Order 12 — M10 SMS / Notifications  ·  P2

| Order | ID | Feature | Tier | Status | Depends on | ★ |
|---|---|---|---|---|---|---|
| 12.1 | M10-F03 | Notification Channels | P2 | Planned | — (R04 SMS sender is independent infra) | ★ |
| 12.2 | M10-F01 | Notification Events | P2 | Planned | event sources (M02/M03/M04/M06) | |
| 12.3 | M10-F02 | Recipients & Targeting | P2 | Planned | M10-F01 | |
| 12.4 | M10-F05 | Summary Reports | P2 | Planned | M10-F01 + reports | |
| 12.5 | M10-F04 | Notification Behavior | P2 | Planned | M10-F01 | |

### Order 13 — M13 Staff & Payroll  ·  P3

| Order | ID | Feature | Tier | Status | Depends on | ★ |
|---|---|---|---|---|---|---|
| 13.1 | M13-F01 | Employee Records | P3 | Planned | M11-F06-R07 (max_employees) | ★ |
| 13.2 | M13-F03 | Advances & Loans | P3 | Planned | M13-F01 | |
| 13.3 | M13-F04 | Attendance & Leaves | P3 | Planned | M13-F01 + M04-F02 | |
| 13.4 | M13-F02 | Salary Management | P3 | Planned | M13-F01/F03/F04 + M04-F05 | |

### Order 14 — M09 Lubricants / Oil Shop  ·  P3

| Order | ID | Feature | Tier | Status | Depends on | ★ |
|---|---|---|---|---|---|---|
| 14.1 | M09-F01 | Product Inventory | P3 | Planned | — (M11 gates to Professional+) | ★ |
| 14.2 | M09-F02 | Lubricant Sales | P3 | Planned | M09-F01 (+ M05-F01 ledger) | |
| 14.3 | M09-F03 | Stock Management | P3 | Planned | M09-F01 | |
| 14.4 | M09-F04 | Lubricant Reporting | P3 | Planned | M09-F01/F02 | |

> **79 features** total. Tier/Order are a ranking ordinal layered on the stable
> IDs — they never renumber an ID (Maintenance Convention 6). When a feature's
> status or dependencies change, update its row here and, if it shifts the module
> ranking, the [Priority & Implementation Order](#priority--implementation-order)
> and [Current Priorities](#current-priorities) tables.

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
