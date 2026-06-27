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
| [M01-F01](srd/M01-identity-and-authentication/F01-registration.md) | Self-Service Registration | `drafting` |
| [M01-F02](srd/M01-identity-and-authentication/F02-phone-otp-verification.md) | Phone OTP Verification | `drafting` |
| [M01-F03](srd/M01-identity-and-authentication/F03-email-verification.md) | Email Verification | `drafting` |
| [M01-F04](srd/M01-identity-and-authentication/F04-login.md) | Login | `drafting` |
| [M01-F05](srd/M01-identity-and-authentication/F05-logout-and-session-revocation.md) | Logout & Session Revocation | `drafting` |
| [M01-F06](srd/M01-identity-and-authentication/F06-password-recovery.md) | Password Recovery | `drafting` |
| [M01-F07](srd/M01-identity-and-authentication/F07-pin-quick-login.md) | PIN Quick Login | `drafting` |
| [M01-F08](srd/M01-identity-and-authentication/F08-device-and-session-management.md) | Device & Session Management | `drafting` |
| [M01-F09](srd/M01-identity-and-authentication/F09-phone-number-change.md) | Phone Number Change | `drafting` |
| [M01-F10](srd/M01-identity-and-authentication/F10-email-add-change-remove.md) | Email Add / Change / Remove | `drafting` |
| [M01-F11](srd/M01-identity-and-authentication/F11-password-change.md) | Password Change (authenticated) | `drafting` |
| [M01-F12](srd/M01-identity-and-authentication/F12-two-factor-authentication.md) | Two-Factor Authentication (TOTP) | `drafting` |
| [M01-F13](srd/M01-identity-and-authentication/F13-account-lockout-and-unlock.md) | Account Lockout & Unlock | `drafting` |
| [M01-F14](srd/M01-identity-and-authentication/F14-password-policy.md) | Password Policy | `drafting` |
| [M01-F15](srd/M01-identity-and-authentication/F15-suspicious-activity-alerts.md) | Suspicious-Activity Alerts | `drafting` |
| [M01-F16](srd/M01-identity-and-authentication/F16-terms-and-privacy-acceptance.md) | Terms & Privacy Acceptance | `drafting` |

### M16 — Team & Access Management
**Lifecycle:** `drafting` (stub) · **Spec:** [README](srd/M16-team-and-access/README.md)

| ID | Feature | Lifecycle |
|---|---|---|
| [M16-F01](srd/M16-team-and-access/F01-invite-user.md) | Invite User (Manager / Custom) | _not drafted_ |
| [M16-F02](srd/M16-team-and-access/F02-roles-and-hierarchy.md) | Roles & Hierarchy | _not drafted_ |
| [M16-F03](srd/M16-team-and-access/F03-granular-permissions-matrix.md) | Granular Permissions Matrix | _not drafted_ |
| [M16-F04](srd/M16-team-and-access/F04-multi-station-access-assignment.md) | Multi-Station Access Assignment | _not drafted_ |
| [M16-F05](srd/M16-team-and-access/F05-edit-deactivate-reactivate-member.md) | Edit / Deactivate / Reactivate Member | _not drafted_ |
| [M16-F06](srd/M16-team-and-access/F06-owner-initiated-password-reset.md) | Owner-Initiated Password Reset | _not drafted_ |
| [M16-F07](srd/M16-team-and-access/F07-team-directory-and-search.md) | Team Directory & Search | _not drafted_ |

### M17 — Audit & Compliance
**Lifecycle:** `drafting` (stub) · **Spec:** [README](srd/M17-audit-and-compliance/README.md)

| ID | Feature | Lifecycle |
|---|---|---|
| [M17-F01](srd/M17-audit-and-compliance/F01-audit-event-schema-and-emission-contract.md) | Audit Event Schema & Emission Contract | _not drafted_ |
| [M17-F02](srd/M17-audit-and-compliance/F02-append-only-sink-and-retention.md) | Append-Only Sink & Retention | _not drafted_ |
| [M17-F03](srd/M17-audit-and-compliance/F03-audit-viewer-ui.md) | Audit Viewer UI (Owner-only) | _not drafted_ |
| [M17-F04](srd/M17-audit-and-compliance/F04-export.md) | Export (CSV / JSON) | _not drafted_ |
| [M17-F05](srd/M17-audit-and-compliance/F05-anomaly-highlights.md) | Anomaly Highlights | _not drafted_ |

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
