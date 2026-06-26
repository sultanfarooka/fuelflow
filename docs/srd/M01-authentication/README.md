---
id: M01
title: Authentication
lifecycle: drafting
last-updated: 2026-06-27
---

# M01 — Authentication

## Purpose

Everything a user does to **prove who they are** to Fuel Flow:
sign up, verify a phone number or email, log in, log out, recover access, change
the credentials attached to their account, and harden access with PIN / 2FA /
policy guards.

Team membership, role assignment, granular permissions, and which stations a
user can access are **not in this module** — they live in
[M16 Team & Access Management](../M16-team-and-access/README.md).

## Scope

**In scope**
- Account creation (phone-first, email optional)
- Channel verification (phone OTP, email link)
- Authentication (password, PIN, TOTP)
- Session lifecycle (login, logout, refresh, device list)
- Credential modification (phone change, email change, password change)
- Security policy (account lockout, password policy, suspicious-activity alerts)
- Legal acceptance (Terms & Privacy versioning)

**Out of scope** (lives elsewhere)
- Roles, granular permissions, multi-station assignment → [M16](../M16-team-and-access/README.md)
- Audit-event sinks & viewer UI → [M17](../M17-audit-and-compliance/README.md)
  (M01 features emit audit events into M17; the viewer is M17's responsibility)
- Owner-forced password resets on other users → [M16](../M16-team-and-access/README.md)
- Per-tenant database routing → [M14 in MODULES.md](../../MODULES.md#m14--per-tenant-database-architecture)

## Feature ordering rationale

Features are ordered by **the user's lifecycle**, not by domain:

1. Identity creation (F01 → F03): how a user enters the system
2. Daily authentication (F04 → F06): how they get in and out, and recover
3. Alternative authentication (F07): PIN for shared-device contexts
4. Active-session control (F08): a logged-in user's device list
5. Credential modification (F09 → F11): swapping the credentials on file
6. Security hardening (F12 → F15): optional / policy-level protection
7. Compliance (F16): legal acceptance tracking

## Feature index

The `Lifecycle` column is read directly from each feature file's
`lifecycle:` frontmatter — it's denormalised here for a single-page glance.
Keep it in sync when you flip a feature's lifecycle. The `Design` column
references the design playground component file (or `—` if not yet drawn).

| ID | Feature | Lifecycle | Design | File |
|---|---|---|---|---|
| M01-F01 | Self-Service Registration | `drafting` | [F01-registration.tsx](../../../fuel-flow-web/src/design/screens/M01/F01-registration.tsx) | [F01-registration.md](./F01-registration.md) |
| M01-F02 | Phone OTP Verification | `drafting` | — | [F02-phone-otp-verification.md](./F02-phone-otp-verification.md) |
| M01-F03 | Email Verification | `drafting` | — | [F03-email-verification.md](./F03-email-verification.md) |
| M01-F04 | Login | `drafting` | — | [F04-login.md](./F04-login.md) |
| M01-F05 | Logout & Session Revocation | `drafting` | — | [F05-logout-and-session-revocation.md](./F05-logout-and-session-revocation.md) |
| M01-F06 | Password Recovery | `drafting` | — | [F06-password-recovery.md](./F06-password-recovery.md) |
| M01-F07 | PIN Quick Login | `drafting` | — | [F07-pin-quick-login.md](./F07-pin-quick-login.md) |
| M01-F08 | Device & Session Management | `drafting` | — | [F08-device-and-session-management.md](./F08-device-and-session-management.md) |
| M01-F09 | Phone Number Change | `drafting` | — | [F09-phone-number-change.md](./F09-phone-number-change.md) |
| M01-F10 | Email Add / Change / Remove | `drafting` | — | [F10-email-add-change-remove.md](./F10-email-add-change-remove.md) |
| M01-F11 | Password Change (authenticated) | `drafting` | — | [F11-password-change.md](./F11-password-change.md) |
| M01-F12 | Two-Factor Authentication (TOTP) | `drafting` | — | [F12-two-factor-authentication.md](./F12-two-factor-authentication.md) |
| M01-F13 | Account Lockout & Unlock | `drafting` | — | [F13-account-lockout-and-unlock.md](./F13-account-lockout-and-unlock.md) |
| M01-F14 | Password Policy | `drafting` | — | [F14-password-policy.md](./F14-password-policy.md) |
| M01-F15 | Suspicious-Activity Alerts | `drafting` | — | [F15-suspicious-activity-alerts.md](./F15-suspicious-activity-alerts.md) |
| M01-F16 | Terms & Privacy Acceptance | `drafting` | — | [F16-terms-and-privacy-acceptance.md](./F16-terms-and-privacy-acceptance.md) |

## Non-functional requirements (module-wide)

These apply to every M01 feature unless explicitly overridden in the feature file.

| Concern | Requirement |
|---|---|
| Security — credentials at rest | Passwords: bcrypt cost ≥ 12. OTPs: SHA-256 with pepper, never plaintext. Refresh tokens: hashed at rest. |
| Security — transport | All endpoints HTTPS only. Auth cookies `HttpOnly`, `Secure`, `SameSite=Lax`. |
| Performance | Every M01 endpoint p95 < 300 ms excluding outbound SMS / email dispatch. |
| Rate limiting | Per-IP sliding window + per-phone daily cap on `/register`, `/login`, `/verify-phone`, `/resend-otp`, `/forgot-password`, `/phone/change/request`, `/reset-password-otp`. Defaults: 10 OTPs / phone / day, 1 resend per 60 s. |
| Accessibility | Forms WCAG 2.1 AA; focus management on multi-step flows; OTP boxes are a single accessible group. |
| i18n | Every user-facing string is localised in `en` + `ur`; flows render RTL when `<html dir="rtl">`. |
| Error messages | No internal details leak; same generic message for "bad credentials" regardless of whether the user exists. |
| Observability | Every auth attempt emits a structured Serilog event with `userId?`, `ip`, `ua`, `outcome`. Audit emissions per feature are documented in section 8 of each file. |

## Dependencies

- **Hard:** [M10-F03 Notification Channels](../../MODULES.md#m10-f03--notification-channels) — SMS sender for OTP delivery; email sender for verification & recovery links.
- **Hard:** [M14 Per-Tenant Database Architecture](../../MODULES.md#m14--per-tenant-database-architecture) — control-plane DB hosts `AspNetUsers`, `RefreshToken`, `PhoneVerification`, etc. before a tenant DB exists.
- **Soft:** [M17 Audit & Compliance](../M17-audit-and-compliance/README.md) — M01 emits structured audit events; M17 owns the sink + viewer UI.
- **Downstream:** [M12 Onboarding](../../MODULES.md#m12--onboarding--first-run-experience) consumes the freshly-verified user; [M16 Team & Access Management](../M16-team-and-access/README.md) consumes the authenticated user identity.
