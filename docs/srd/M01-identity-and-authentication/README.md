---
id: M01
title: Identity & Authentication
lifecycle: drafting
last-updated: 2026-06-27
---

# M01 — Identity & Authentication

Everything a user does to **prove who they are** to Fuel Flow: sign up, verify
channels, log in / out, recover access, change credentials, and harden access
with PIN / 2FA / policy guards. Team membership, roles, permissions, and
multi-station scope live in [M16](../M16-team-and-access/README.md).

## Scope

| In scope | Out of scope (lives in) |
|---|---|
| Account creation (phone-first, email optional) | Roles, permissions, multi-station — [M16](../M16-team-and-access/README.md) |
| Channel verification (phone OTP, email link) | Owner-forced password reset on others — [M16](../M16-team-and-access/README.md) |
| Authentication (password, PIN, TOTP) | Audit sinks + viewer UI — [M17](../M17-audit-and-compliance/README.md) |
| Session lifecycle (login, logout, refresh, devices) | Per-tenant DB routing — [M14](../../MODULES.md#m14--per-tenant-database-architecture) |
| Credential modification (phone, email, password) | |
| Security policy (lockout, password policy, alerts) | |
| Legal acceptance (T&C / Privacy versioning) | |

## Module-wide NFRs

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

## Dependencies

| Strength | Target | Why |
|---|---|---|
| Hard | [M10-F03 Notification Channels](../../MODULES.md#m10-f03--notification-channels) | SMS for OTP; email for verify + recovery |
| Hard | [M14 Per-Tenant DB Architecture](../../MODULES.md#m14--per-tenant-database-architecture) | Control-plane DB hosts identity tables pre-tenant |
| Soft | [M17 Audit & Compliance](../M17-audit-and-compliance/README.md) | M01 emits; M17 owns the sink + viewer |
| Downstream | [M12 Onboarding](../../MODULES.md#m12--onboarding--first-run-experience) | Consumes verified user for org + station |
| Downstream | [M16 Team & Access Management](../M16-team-and-access/README.md) | Consumes authenticated identity |

## Feature index

Ordered by **user lifecycle**: identity creation → daily auth → alternative auth →
session control → credential modification → security hardening → compliance.

| ID | Feature | Lifecycle | Design |
|---|---|---|---|
| [M01-F01](./F01-registration.md) | Self-Service Registration | `drafting` | [↗](../../../fuel-flow-web/src/design/screens/M01/F01-registration.tsx) |
| [M01-F02](./F02-phone-otp-verification.md) | Phone OTP Verification | `drafting` | — |
| [M01-F03](./F03-email-verification.md) | Email Verification | `drafting` | — |
| [M01-F04](./F04-login.md) | Login | `drafting` | — |
| [M01-F05](./F05-logout-and-session-revocation.md) | Logout & Session Revocation | `drafting` | — |
| [M01-F06](./F06-password-recovery.md) | Password Recovery | `drafting` | — |
| [M01-F07](./F07-pin-quick-login.md) | PIN Quick Login | `drafting` | — |
| [M01-F08](./F08-device-and-session-management.md) | Device & Session Management | `drafting` | — |
| [M01-F09](./F09-phone-number-change.md) | Phone Number Change | `drafting` | — |
| [M01-F10](./F10-email-add-change-remove.md) | Email Add / Change / Remove | `drafting` | — |
| [M01-F11](./F11-password-change.md) | Password Change (authenticated) | `drafting` | — |
| [M01-F12](./F12-two-factor-authentication.md) | Two-Factor Authentication (TOTP) | `drafting` | — |
| [M01-F13](./F13-account-lockout-and-unlock.md) | Account Lockout & Unlock | `drafting` | — |
| [M01-F14](./F14-password-policy.md) | Password Policy | `drafting` | — |
| [M01-F15](./F15-suspicious-activity-alerts.md) | Suspicious-Activity Alerts | `drafting` | — |
| [M01-F16](./F16-terms-and-privacy-acceptance.md) | Terms & Privacy Acceptance | `drafting` | — |

> `Lifecycle` is denormalised from each feature's frontmatter — keep in sync when you flip.
