# Fuel Flow — Software Requirements Document

> **Draft** · transitioning from [`MODULES.md`](MODULES.md). New features go to SRD.

High-level index. For detail:

- [`srd/README.md`](srd/README.md) — conventions (template, ID rules, lifecycle, change mechanisms)
- `srd/MXX-*/README.md` — module spec (scope, NFRs, dependencies, feature index)
- `srd/MXX-*/FXX-*.md` — feature spec

## Modules

### M01 — Identity & Authentication
**Lifecycle:** `drafting` · **Spec:** [README](srd/M01-identity-and-authentication/README.md)

| ID | Feature | Lifecycle |
|---|---|---|
| M01-F01 | Self-Service Registration | `drafting` |
| M01-F02 | Phone OTP Verification | `drafting` |
| M01-F03 | Email Verification | `drafting` |
| M01-F04 | Login | `drafting` |
| M01-F05 | Logout & Session Revocation | `drafting` |
| M01-F06 | Password Recovery | `drafting` |
| M01-F07 | PIN Quick Login | `drafting` |
| M01-F08 | Device & Session Management | `drafting` |
| M01-F09 | Phone Number Change | `drafting` |
| M01-F10 | Email Add / Change / Remove | `drafting` |
| M01-F11 | Password Change (authenticated) | `drafting` |
| M01-F12 | Two-Factor Authentication (TOTP) | `drafting` |
| M01-F13 | Account Lockout & Unlock | `drafting` |
| M01-F14 | Password Policy | `drafting` |
| M01-F15 | Suspicious-Activity Alerts | `drafting` |
| M01-F16 | Terms & Privacy Acceptance | `drafting` |

### M16 — Team & Access Management
**Lifecycle:** `drafting` (stub) · **Spec:** [README](srd/M16-team-and-access/README.md)

| ID | Feature | Lifecycle |
|---|---|---|
| M16-F01 | Invite User (Manager / Custom) | _not drafted_ |
| M16-F02 | Roles & Hierarchy | _not drafted_ |
| M16-F03 | Granular Permissions Matrix | _not drafted_ |
| M16-F04 | Multi-Station Access Assignment | _not drafted_ |
| M16-F05 | Edit / Deactivate / Reactivate Member | _not drafted_ |
| M16-F06 | Owner-Initiated Password Reset | _not drafted_ |
| M16-F07 | Team Directory & Search | _not drafted_ |

### M17 — Audit & Compliance
**Lifecycle:** `drafting` (stub) · **Spec:** [README](srd/M17-audit-and-compliance/README.md)

| ID | Feature | Lifecycle |
|---|---|---|
| M17-F01 | Audit Event Schema & Emission Contract | _not drafted_ |
| M17-F02 | Append-Only Sink & Retention | _not drafted_ |
| M17-F03 | Audit Viewer UI (Owner-only) | _not drafted_ |
| M17-F04 | Export (CSV / JSON) | _not drafted_ |
| M17-F05 | Anomaly Highlights | _not drafted_ |

### Unmigrated

Still in [`MODULES.md`](MODULES.md) until each is rewritten into the SRD.

| ID | Title |
|---|---|
| M02 | Fuel Inventory & Tank Control |
| M03 | Pump & Nozzle Operations |
| M04 | Shift Management |
| M05 | Finance & Accounts |
| M06 | Pricing & Rate Management |
| M07 | Reporting, Analytics & Platform UI |
| M08 | Settings & Configuration |
| M09 | Lubricants / Oil Shop |
| M10 | SMS / Notifications |
| M11 | Subscription & Billing |
| M12 | Onboarding & First-Run Experience |
| M13 | Staff & Payroll |
| M14 | Per-Tenant Database Architecture |
| M15 | Credit Customer Management |

## Transition rules

| Case | Rule |
|---|---|
| New feature | Write to SRD only. Don't add MODULES.md rows. |
| In-flight work | Finish against whichever document started it. |
| Migrating a module | Replace the MODULES.md section with `→ moved to <SRD path>` in the same PR. |
| Cutover | When every `In Progress` / `Planned` / `Done` MODULES.md row has an SRD counterpart, MODULES.md becomes an archive and root [`CLAUDE.md`](../CLAUDE.md) Rule 1 flips its pointer to the SRD. |
