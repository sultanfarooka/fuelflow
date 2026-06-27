---
id: M01-F01
module: M01-identity-and-authentication
title: Self-Service Registration
lifecycle: drafting
design: ../../../fuel-flow-web/src/design/screens/M01/F01-registration.tsx
legacy: M01-F01 (MODULES.md)
last-updated: 2026-06-27
---

# M01-F01 — Self-Service Registration

## 1. Purpose

An owner creates a Fuel Flow account with a Pakistani phone number and password.
Email is optional. The account starts `phone-unverified` and the user is routed
into [F02 Phone OTP Verification](./F02-phone-otp-verification.md). Org + first
station are deferred to [M12 Onboarding](../../MODULES.md#m12--onboarding--first-run-experience).

## 2. User stories

| As a | I want to | So that |
|---|---|---|
| Prospective owner without email | sign up with only my phone | I'm not blocked by an email requirement |
| Prospective owner with email | add it during signup | I have a fallback login channel |
| Owner with duplicate phone | see a clear error + login link | I don't waste time retrying |
| Platform | rate-limit every attempt | SMS spend isn't burned by bots |

## 3. Functional requirements

| ID | Requirement | Status |
|---|---|---|
| R01 | Phone required; E.164 `+92XXXXXXXXXX` | Planned |
| R02 | Phone unique; duplicate → 409 | Planned |
| R03 | Email optional; when set, format-valid + unique | Planned |
| R04 | Password ≥ 6 chars, ≥ 1 digit | Planned |
| R05 | `firstName` (1–50, trimmed), `lastName` (1–50, trimmed) both required | Planned |
| R06 | Account created `phone-unverified`; login blocked until [F02](./F02-phone-otp-verification.md) | Planned |
| R07 | On success, SMS OTP queued via [M10-F03](../../MODULES.md#m10-f03--notification-channels), user routed to F02 | Planned |
| R08 | Creates **Owner** user only; org + station deferred to [M12](../../MODULES.md#m12--onboarding--first-run-experience) | Planned |
| R09 | T&C / Privacy version-id stamped on user row (see [F16](./F16-terms-and-privacy-acceptance.md)) | Planned |
| R10 | Per-IP sliding-window rate limit on register; per-phone daily OTP cap | Planned |

## 4. Non-functional requirements

| Concern | Requirement |
|---|---|
| Security | Password bcrypt cost ≥ 12. Phone stored E.164. Email case-folded. T&C version immutable. |
| Performance | p95 < 300 ms (excluding SMS dispatch, which is enqueued). |
| Accessibility | Inputs labelled. Password rules announced. Error summary takes focus on submit failure. |
| i18n | All strings localised `en` + `ur`. Phone accepts `+92…` or `0…`; normalises on blur. |
| Rate limiting | Per-IP: 5 attempts / 10 min. Per-phone OTP cap: 10 / day (configurable). |
| Privacy | Audit logs `phoneHash` + `emailHash`, never plaintext. |
| Idempotency | Concurrent same-phone requests resolve to one row via DB unique index. |

## 5. Acceptance criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC1 | Valid `{firstName, lastName, phone, password}` | `POST /auth/register` | 201, row with `PhoneNumberConfirmed=false`, OTP queued, SPA routes to F02 |
| AC2 | Phone already on file | Register | 409 `phone_already_registered`, no SMS, no row, SPA shows "Sign in with this number" link |
| AC3 | Email already on file | Register | 409 `email_already_registered`, no row, SPA shows "Sign in with this email" link |
| AC4 | Phone fails `+92XXXXXXXXXX` after normalisation | Register | 400 with field-level `phone` error |
| AC5 | Password < 6 chars or no digit | Register | 400 with field-level `password` error |
| AC6 | Per-IP rate limit exceeded | Register | 429 with `Retry-After`, no row |
| AC7 | Fresh registration succeeded | SPA reloads | Lands on F02; guards keep user out of post-onboarding routes |

## 6. Design flow

Design: [`F01-registration.tsx`](../../../fuel-flow-web/src/design/screens/M01/F01-registration.tsx) · live at `/design/M01/M01-F01`.

**Screens:** Sign-up form → submit (pending) → handoff to [F02](./F02-phone-otp-verification.md).

**States in the design:** default, mobile. **Pending:** field-validation, duplicate-server-error, 429 explicit error.

## 7. Dependencies

| Relation | Target | Why |
|---|---|---|
| Depends on | [F02 Phone OTP Verification](./F02-phone-otp-verification.md) | Consumes the queued OTP |
| Depends on | [M10-F03 Notification Channels](../../MODULES.md#m10-f03--notification-channels) | SMS sender; pre-org OTPs use platform default |
| Depends on | [F16 Terms & Privacy](./F16-terms-and-privacy-acceptance.md) | Supplies the T&C version id |
| Downstream | [M12 Onboarding](../../MODULES.md#m12--onboarding--first-run-experience) | Picks up verified user for org + station |
| Out of scope | F02 OTP UI, F03 email-link click, F06 recovery, F09/F10 phone/email change | Owned by their respective features |

## 8. Audit emissions

| Event | Fields | Sink |
|---|---|---|
| `auth.registration.attempted` | `phoneHash, emailHash?, ip, ua, outcome` | [M17](../../SRD.md#m17--audit--compliance-stub) |
| `auth.registration.succeeded` | `userId, phoneHash, emailHash?, tcVersion, ip` | [M17](../../SRD.md#m17--audit--compliance-stub) |
| `auth.otp.issued` *(emitted by F02; listed for traceability)* | `userId, purpose=registration, phoneHash, ip` | [M17](../../SRD.md#m17--audit--compliance-stub) |

`outcome` ∈ `{success, duplicate_phone, duplicate_email, validation_failed, rate_limited}`.

## 9. API surface

| Method | Path | Body | Responses |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | `{firstName, lastName, phone, email?, password}` | 201 · 400 · 409 · 429 |

Full schemas in Swagger (`/swagger`). Side effect: enqueues SMS OTP via M10-F03.

## 10. Open questions

_None._ See section 11 for resolved-at-draft history.

## 11. Change history

- **2026-06-27** — Initial draft. Folds in M01-F09 phone-first rules (R01–R02, R06).
- **2026-06-27** — **OQ1 resolved →** hard-fail 409 + "Sign in" link (AC2/AC3).
- **2026-06-27** — **OQ2 resolved →** CAPTCHA deferred; track as a follow-up feature if bots become a problem.
- **2026-06-27** — **OQ3 resolved →** sales-assisted signup out of scope.
- **2026-06-27** — **OQ4 resolved →** `firstName` + `lastName` (R05, AC1, §9); design playground sync owed at PR-merge.
