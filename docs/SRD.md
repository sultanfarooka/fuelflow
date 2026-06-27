# Fuel Flow — Software Requirements Document

> **Draft** · transitioning from [`MODULES.md`](MODULES.md). Both are sources of
> truth during transition. **Write new features into the SRD.**

This file holds the conventions plus per-module scope, NFRs, dependencies, and
feature indexes. Each feature flow lives in its own file at
`docs/srd/MXX-<kebab>/FXX-<kebab>.md`.

## Contents

- [Conventions](#conventions) — how to write a feature file
- [Module index](#module-index)
- Module specs — [M01](#m01--authentication) · [M16](#m16--team--access-management-stub) · [M17](#m17--audit--compliance-stub)
- [Transition rules](#transition-rules) — MODULES.md interaction

---

## Conventions

### File layout

```
docs/
├── SRD.md                    # this file: conventions + module-level info
└── srd/
    └── MXX-<kebab>/          # one folder per module (created when first feature lands)
        └── FXX-<kebab>.md    # one file per feature flow
```

- Module dirs: `MXX-<kebab>` — `M01-authentication`, `M16-team-and-access`.
- Feature files: `FXX-<kebab>.md` — `F01-registration.md`, `F04-login.md`.
- One feature flow per file. Split into N features if a "feature" turns into N flows.

### Feature file template

Sections 1–11 in order. Empty sections write `_None._` — never omit.

```markdown
---
id: M01-F01
module: M01-authentication
title: <title>
lifecycle: drafting                # see Lifecycle below
design: ../../../fuel-flow-web/src/design/screens/MXX/FXX-<slug>.tsx
legacy: <MODULES.md ID(s) | none>
last-updated: 2026-06-27
# Off-ramp only — uncomment when applicable:
# superseded_by: M01-F17
# superseded_at: 2026-08-15
# supersedes: [M01-F12]
# removed_at: 2026-08-15
# removed_reason: "<one-line why>"
---

# M01-F01 — <title>

## 1. Purpose
2–3 sentences. Trigger, success state, why it exists.

## 2. User stories
| As a | I want to | So that |

## 3. Functional requirements
| ID | Requirement | Status |

## 4. Non-functional requirements
| Concern | Requirement |

## 5. Acceptance criteria
| ID | Given | When | Then |

## 6. Design flow
Link to playground file + ordered screen list + states covered.

## 7. Dependencies
| Relation | Target | Why |

## 8. Audit emissions
| Event | Fields | Sink |

## 9. API surface
| Method | Path | Body | Responses |

## 10. Open questions
Append-only.

## 11. Change history
`- **YYYY-MM-DD** — <change>.`  Trivial edits don't go here; `git log` covers those.
```

### Section rules

| Section | Rule |
|---|---|
| §1 Purpose | 2–3 sentences. Longer → probably two features. |
| §3 Requirements | `MXX-FXX-RXX` IDs, contiguous from `R01`. Dropped rows → `Removed` status, never renumbered. |
| §4 NFRs | Module-wide NFRs apply by default — only list overrides or feature-specific concerns here. |
| §5 Acceptance criteria | Gherkin (Given / When / Then). One per row. Every failure mode must map to an AC. |
| §6 Design flow | Working relative link to the playground file. If no design yet: `_Design pending — see §10._` |
| §8 Audit emissions | M17's read contract. No events → `_None._` (explicit, not an oversight). |

### ID rules

- IDs stable once shipped. Renumber only during `drafting`.
- `FXX` flow-ordered inside each module — rationale lives in the module section below.
- `RXX` append-only inside each feature.
- **Never reuse IDs.** Removed `RXX` rows and `superseded` / `removed` features keep their slots forever so every branch / commit / comment reference stays valid.
- Cross-feature links use full paths: `[M16-F01 Invite User](../M16-team-and-access/F01-invite-user.md)`.

### Lifecycle

`lifecycle:` is the single source of truth for *where a feature is*. Monotonic for healthy features; off-ramps for the edges. Bump in the same PR as the work — never ahead of state.

| State | Meaning | Gate to advance |
|---|---|---|
| `drafting` | Spec being written | §§ 1–10 frozen |
| `spec-locked` | Spec frozen; no design yet | Playground file `approved` in [`catalogue.ts`](../fuel-flow-web/src/design/catalogue.ts) |
| `design-approved` | Design locked; no impl | First impl PR opens |
| `in-implementation` | At least one impl PR open / merged | Backend + frontend + E2E all on `main` |
| `shipped` | All R-rows `Done`, E2E green | terminal |
| `superseded` | Replaced by another feature | terminal; set `superseded_by:` |
| `removed` | Dropped before shipping | terminal; set `removed_reason:` |

At the **module level** the same vocabulary summarises every feature inside: `drafting` if ≥ 1 feature is still drafting, `shipped` when all are.

### R-row statuses

Independent of feature `lifecycle:` — a feature can be `in-implementation` with some R-rows `Done`, others `Planned`.

| Status | Meaning |
|---|---|
| `Drafting` | Wording still negotiable (feature is `drafting`) |
| `Planned` | Spec locked; not implemented |
| `In Progress` | At least one PR in flight |
| `Done` | Implemented + tested + on `main` |
| `Removed` | Dropped; row kept (never renumbered) with one-line reason |

### Changing or replacing a feature

| Change | Mechanism |
|---|---|
| Typo / link fix | Edit in place. `git log` is the record. No §11 entry. |
| Add / remove R, change AC | Edit in place. Flip dropped R-rows to `Removed`. **Add a §11 entry** with the why. |
| Wholesale replace | Old file: `lifecycle: superseded`, `superseded_by:`. New file: next free `FXX`, `supersedes: [<old>]`. Both stay forever. |
| Drop entirely | File: `lifecycle: removed`, `removed_reason:`, `removed_at:`. Module feature index renders struck through; link still works. |

### Relationship to other docs

| Doc | Answers | Lifecycle |
|---|---|---|
| SRD feature file | *What* + *why* + when "done" (AC). | Stable; rarely changes after `spec-locked`. |
| [`docs/implementation/<MXX>/<feature>.md`](implementation/) | *How*: phase order, file list, migrations, tests. | Disposable; archived after PR ships. |
| [`docs/MODULES.md`](MODULES.md) | Legacy registry during transition. | Frozen for unmigrated modules; replaced with `→ moved to <SRD path>` on migration. |

**Implementation plans:** skip for trivial features (single file, copy-only, one endpoint reusing patterns). Generate via the `feature-planning` skill for anything crossing Domain → Application → Infrastructure → Api → Frontend.

**Design files:** the `/design` playground component IS the design — no separate Figma. Update the SRD `design:` frontmatter + §6 link in the same commit as any playground rename.

---

## Module index

| ID | Title | Lifecycle | Folder |
|---|---|---|---|
| M01 | [Authentication](#m01--authentication) | `drafting` | [`srd/M01-authentication/`](srd/M01-authentication/) |
| M02 | Fuel Inventory & Tank Control | _MODULES.md_ | _unmigrated_ |
| M03 | Pump & Nozzle Operations | _MODULES.md_ | _unmigrated_ |
| M04 | Shift Management | _MODULES.md_ | _unmigrated_ |
| M05 | Finance & Accounts | _MODULES.md_ | _unmigrated_ |
| M06 | Pricing & Rate Management | _MODULES.md_ | _unmigrated_ |
| M07 | Reporting, Analytics & Platform UI | _MODULES.md_ | _unmigrated_ |
| M08 | Settings & Configuration | _MODULES.md_ | _unmigrated_ |
| M09 | Lubricants / Oil Shop | _MODULES.md_ | _unmigrated_ |
| M10 | SMS / Notifications | _MODULES.md_ | _unmigrated_ |
| M11 | Subscription & Billing | _MODULES.md_ | _unmigrated_ |
| M12 | Onboarding & First-Run Experience | _MODULES.md_ | _unmigrated_ |
| M13 | Staff & Payroll | _MODULES.md_ | _unmigrated_ |
| M14 | Per-Tenant Database Architecture | _MODULES.md_ | _unmigrated_ |
| M15 | Credit Customer Management | _MODULES.md_ | _unmigrated_ |
| M16 | [Team & Access Management](#m16--team--access-management-stub) | `drafting` (stub) | _not created yet_ |
| M17 | [Audit & Compliance](#m17--audit--compliance-stub) | `drafting` (stub) | _not created yet_ |

---

## M01 — Authentication

Everything a user does to **prove who they are** to Fuel Flow: sign up, verify
channels, log in / out, recover access, change credentials, and harden access
with PIN / 2FA / policy guards. Team membership, roles, permissions, and
multi-station scope live in [M16](#m16--team--access-management-stub).

### Scope

| In scope | Out of scope (lives in) |
|---|---|
| Account creation (phone-first, email optional) | Roles, permissions, multi-station — [M16](#m16--team--access-management-stub) |
| Channel verification (phone OTP, email link) | Owner-forced password reset on others — [M16](#m16--team--access-management-stub) |
| Authentication (password, PIN, TOTP) | Audit sinks + viewer UI — [M17](#m17--audit--compliance-stub) |
| Session lifecycle (login, logout, refresh, devices) | Per-tenant DB routing — [M14](MODULES.md#m14--per-tenant-database-architecture) |
| Credential modification (phone, email, password) | |
| Security policy (lockout, password policy, alerts) | |
| Legal acceptance (T&C / Privacy versioning) | |

### Module-wide NFRs

Apply to every M01 feature unless overridden in §4 of the feature file.

| Concern | Requirement |
|---|---|
| Credentials at rest | Passwords bcrypt cost ≥ 12. OTPs SHA-256 + pepper. Refresh tokens hashed. |
| Transport | HTTPS only. Cookies `HttpOnly`, `Secure`, `SameSite=Lax`. |
| Performance | p95 < 300 ms excluding outbound SMS / email dispatch. |
| Rate limiting | Per-IP sliding window + per-phone daily cap on every auth endpoint. Default: 10 OTP/phone/day, 1 resend / 60 s. |
| Accessibility | WCAG 2.1 AA. Focus management on multi-step flows. OTP boxes one accessible group. |
| i18n | All strings `en` + `ur`. RTL when `<html dir="rtl">`. |
| Error messages | No internal leaks. Same shape for "bad credentials" regardless of user existence. |
| Observability | Every attempt → structured Serilog event (`userId?, ip, ua, outcome`). |

### Dependencies

| Strength | Target | Why |
|---|---|---|
| Hard | [M10-F03 Notification Channels](MODULES.md#m10-f03--notification-channels) | SMS for OTP; email for verify + recovery |
| Hard | [M14 Per-Tenant DB Architecture](MODULES.md#m14--per-tenant-database-architecture) | Control-plane DB hosts identity tables pre-tenant |
| Soft | [M17 Audit & Compliance](#m17--audit--compliance-stub) | M01 emits; M17 owns the sink + viewer |
| Downstream | [M12 Onboarding](MODULES.md#m12--onboarding--first-run-experience) | Consumes verified user for org + station |
| Downstream | [M16 Team & Access Management](#m16--team--access-management-stub) | Consumes authenticated identity |

### Feature index

Ordered by **user lifecycle**: identity creation → daily auth → alternative auth →
session control → credential modification → security hardening → compliance.

| ID | Feature | Lifecycle | Design | File |
|---|---|---|---|---|
| M01-F01 | Self-Service Registration | `drafting` | [↗](../fuel-flow-web/src/design/screens/M01/F01-registration.tsx) | [F01](srd/M01-authentication/F01-registration.md) |
| M01-F02 | Phone OTP Verification | `drafting` | — | [F02](srd/M01-authentication/F02-phone-otp-verification.md) |
| M01-F03 | Email Verification | `drafting` | — | [F03](srd/M01-authentication/F03-email-verification.md) |
| M01-F04 | Login | `drafting` | — | [F04](srd/M01-authentication/F04-login.md) |
| M01-F05 | Logout & Session Revocation | `drafting` | — | [F05](srd/M01-authentication/F05-logout-and-session-revocation.md) |
| M01-F06 | Password Recovery | `drafting` | — | [F06](srd/M01-authentication/F06-password-recovery.md) |
| M01-F07 | PIN Quick Login | `drafting` | — | [F07](srd/M01-authentication/F07-pin-quick-login.md) |
| M01-F08 | Device & Session Management | `drafting` | — | [F08](srd/M01-authentication/F08-device-and-session-management.md) |
| M01-F09 | Phone Number Change | `drafting` | — | [F09](srd/M01-authentication/F09-phone-number-change.md) |
| M01-F10 | Email Add / Change / Remove | `drafting` | — | [F10](srd/M01-authentication/F10-email-add-change-remove.md) |
| M01-F11 | Password Change (authenticated) | `drafting` | — | [F11](srd/M01-authentication/F11-password-change.md) |
| M01-F12 | Two-Factor Authentication (TOTP) | `drafting` | — | [F12](srd/M01-authentication/F12-two-factor-authentication.md) |
| M01-F13 | Account Lockout & Unlock | `drafting` | — | [F13](srd/M01-authentication/F13-account-lockout-and-unlock.md) |
| M01-F14 | Password Policy | `drafting` | — | [F14](srd/M01-authentication/F14-password-policy.md) |
| M01-F15 | Suspicious-Activity Alerts | `drafting` | — | [F15](srd/M01-authentication/F15-suspicious-activity-alerts.md) |
| M01-F16 | Terms & Privacy Acceptance | `drafting` | — | [F16](srd/M01-authentication/F16-terms-and-privacy-acceptance.md) |

> `Lifecycle` is denormalised from each feature's frontmatter — keep in sync when you flip.

---

## M16 — Team & Access Management (stub)

> Module ID reserved. Feature shapes not yet drafted; folder gets created when the first feature file lands.

People-administration **inside** an organisation — once they've authenticated via [M01](#m01--authentication). Invite, role assignment, granular permissions, multi-station scoping, edit / deactivate, owner-initiated password resets.

### Provisional feature list

| ID | Feature | Source |
|---|---|---|
| M16-F01 | Invite User (Manager / Custom) | new |
| M16-F02 | Roles & Hierarchy | from M01-F05 in MODULES.md |
| M16-F03 | Granular Permissions Matrix | from M01-F06 |
| M16-F04 | Multi-Station Access Assignment | from M01-F07 |
| M16-F05 | Edit / Deactivate / Reactivate Member | new |
| M16-F06 | Owner-Initiated Password Reset | from M01-F04-R03 |
| M16-F07 | Team Directory & Search | new |

**Out of scope:** authentication (→ [M01](#m01--authentication)) · cross-org user mobility · seat enforcement (→ [M11](MODULES.md#m11--subscription--billing)) · audit-log emission consumers (→ [M17](#m17--audit--compliance-stub)).

**Hard deps:** [M01](#m01--authentication), [M11](MODULES.md#m11--subscription--billing). **Soft:** [M17](#m17--audit--compliance-stub).

---

## M17 — Audit & Compliance (stub)

> Module ID reserved. Feature shapes not yet drafted; folder gets created when the first feature file lands.

The platform-wide immutable record of *who did what, when, what changed*. Every other module emits structured audit events into M17; M17 owns the schema, the append-only sink, the retention policy, the Owner-only viewer, and the exports.

### Provisional feature list

| ID | Feature | Source |
|---|---|---|
| M17-F01 | Audit Event Schema & Emission Contract | new (cross-cutting) |
| M17-F02 | Append-Only Sink & Retention | from M01-F08 in MODULES.md |
| M17-F03 | Audit Viewer UI (Owner-only) | from M01-F08-R06 |
| M17-F04 | Export (CSV / JSON) | new |
| M17-F05 | Anomaly Highlights | new (optional) |

**Out of scope:** real-time SIEM streaming · cross-org aggregated reporting.

**Hard deps:** every emitting module. Each feature SRD lists its emissions in §8; M17-F01 codifies the contract.

---

## Transition rules

| Case | Rule |
|---|---|
| New feature | Write to SRD only. Don't add MODULES.md rows. |
| In-flight work | Finish against whichever document started it. |
| Migrating a module | Replace the MODULES.md section with `→ moved to <SRD path>` in the same PR. |
| Cutover | When every `In Progress` / `Planned` / `Done` MODULES.md row has an SRD counterpart, MODULES.md becomes an archive and root [`CLAUDE.md`](../CLAUDE.md) Rule 1 flips its pointer to the SRD. |
