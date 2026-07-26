# M01-F01 — Self-Service Registration

| | |
|---|---|
| **Lifecycle** | `design-approved` |
| **Design** | [`M01-F01/`](../../../fuel-flow-web/src/designs/M01-F01/) — [`registration-form.tsx`](../../../fuel-flow-web/src/designs/M01-F01/registration-form.tsx), [`registration-alerts.tsx`](../../../fuel-flow-web/src/designs/M01-F01/registration-alerts.tsx). Plan: [`M01-F01.md`](../../plans/M01/M01-F01.md) |
| **Last updated** | 2026-07-27 |

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
| R04 | Password validated by [F14 Password Policy](./F14-password-policy.md)'s **active profile** (default profile = ≥ 6 chars, ≥ 1 digit; plus F14 R03 always-on bans). Server returns **all** failed rule codes as an array per [F14 R07](./F14-password-policy.md), never just the first | Planned |
| R05 | `firstName` (1–50, trimmed), `lastName` (1–50, trimmed) both required | Planned |
| R06 | Account created `phone-unverified`; login blocked until [F02](./F02-phone-otp-verification.md) | Planned |
| R07 | On success, SMS OTP queued via [M10-F03](../../MODULES.md#m10-f03--notification-channels), user routed to F02 | Planned |
| R08 | Creates **Owner** user only; org + station deferred to [M12](../../MODULES.md#m12--onboarding--first-run-experience) | Planned |
| R09 | T&C + Privacy acceptance stamped **atomically with the user row**: two `UserAcceptance` rows (one per kind) inserted per [F16 R05](./F16-terms-and-privacy-acceptance.md), **and** `User.AcceptedTcVersion` set to the accepted TOS version as a denormalised fast-path for [F04](./F04-login.md)'s `tcAcceptanceRequired` gate check. The rows are the audit trail of record; the scalar is a read optimisation, never the sole record | Planned |
| R10 | Per-IP sliding-window rate limit on register; per-phone daily OTP cap | Planned |
| R11 | Duplicate phone whose existing account is still `phone-unverified` returns 409 with `resumable=true`; the SPA offers "Continue verifying this number", which issues a pending-verification session for the **pre-existing** user and re-issues an OTP via [F02](./F02-phone-otp-verification.md) (`purpose=registration`). The resume path consumes the per-phone daily OTP cap ([F02 R06](./F02-phone-otp-verification.md)) and the per-IP window in R10 — it gets **no separate allowance**, so it cannot be used to burn a victim's cap or spam SMS to their number | Planned |

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
| AC2 | Phone already on file on a **phone-verified** account | Register | 409 `phone_already_registered` with `resumable=false`, no SMS, no row, SPA shows "Sign in with this number" link |
| AC3 | Email already on file | Register | 409 `email_already_registered`, no row, SPA shows "Sign in with this email" link |
| AC4 | Phone fails `+92XXXXXXXXXX` after normalisation | Register | 400 with field-level `phone` error |
| AC5 | Password < 6 chars or no digit | Register | 400 with field-level `password` error |
| AC6 | Per-IP rate limit exceeded | Register | 429 with `Retry-After`, no row |
| AC7 | Fresh registration succeeded | SPA reloads | Lands on F02; guards keep user out of post-onboarding routes |
| AC8 | Password is on the banned-common list (e.g. `password1`) | Register | 400 `[password_common]` per [F14 R03](./F14-password-policy.md), no row, no SMS |
| AC9 | Password contains `firstName`, `lastName`, the phone, or the email (case-insensitive substring) | Register | 400 `[password_contains_personal]`, no row, no SMS |
| AC10 | Phone already on file but that account is **`phone-unverified`** | Register | 409 `phone_already_registered` with `resumable=true`; SPA offers "Continue verifying this number"; pending-verification session issued for the existing user and a fresh OTP re-issued into [F02](./F02-phone-otp-verification.md) — subject to the daily cap, which a capped-out number exhausts rather than bypassing |

## 6. Design flow

Design: [`registration-form.tsx`](../../../fuel-flow-web/src/designs/M01-F01/registration-form.tsx) · live at `/designs/M01-F01`.

**Screens:** Sign-up form → submit (pending) → handoff to [F02](./F02-phone-otp-verification.md).

**States in the design:** default, mobile. **Pending:** field-validation, duplicate-server-error, 429 explicit error.

## 7. Dependencies

| Relation | Target | Why |
|---|---|---|
| Depended on by | [F02 Phone OTP Verification](./F02-phone-otp-verification.md) | F01 creates the user, sets the pending-verification session, and queues the first OTP; F02 consumes it |
| Depends on | [M10-F03 Notification Channels](../../MODULES.md#m10-f03--notification-channels) | SMS sender; pre-org OTPs use platform default |
| Depends on | [F14 Password Policy](./F14-password-policy.md) | Owns password validation and the rule-code array returned by R04 |
| Depends on | [F16 Terms & Privacy](./F16-terms-and-privacy-acceptance.md) | Supplies the T&C version id |
| Downstream | [M12 Onboarding](../../MODULES.md#m12--onboarding--first-run-experience) | Picks up verified user for org + station |
| Out of scope | F02 OTP UI, F03 email-link click, F06 recovery, F09/F10 phone/email change | Owned by their respective features |

## 8. Audit emissions

| Event | Fields | Sink |
|---|---|---|
| `auth.registration.attempted` | `phoneHash, emailHash?, ip, ua, outcome` | [M17](../M17-audit-and-compliance/README.md) |
| `auth.registration.succeeded` | `userId, phoneHash, emailHash?, tcVersion, ip` | [M17](../M17-audit-and-compliance/README.md) |
| `auth.otp.issued` *(emitted by F02; listed for traceability)* | `userId, purpose=registration, phoneHash, ip` | [M17](../M17-audit-and-compliance/README.md) |

`outcome` ∈ `{success, duplicate_phone, duplicate_phone_unverified, duplicate_email, validation_failed, rate_limited}`.
`duplicate_phone_unverified` is the R11 resumable case and must be distinguishable from `duplicate_phone`
so abuse of the resume path is separately observable.

> **M17 registration owed.** [M17-F01 Audit Event Schema](../M17-audit-and-compliance/README.md) does not exist
> on disk yet (M17 is a stub whose README links an unwritten file). These events — including the new
> `duplicate_phone_unverified` outcome — must be registered there in the same PR that implements F01.

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
- **2026-07-27** — **R04 rewritten** to delegate password validation to [F14](./F14-password-policy.md)'s active profile instead of hardcoding "≥ 6 chars, ≥ 1 digit". F01 had no acceptance criterion for any of F14 R03's always-on bans; added AC8 (banned-common) and AC9 (contains-personal). F01 and F14 co-ship. Surfaced during `/plan-feature M01-F01`.
- **2026-07-27** — **R09 reworded.** Previous wording ("version-id stamped on user row") under-specified against [F16 R05](./F16-terms-and-privacy-acceptance.md), which requires two atomic `UserAcceptance` rows. R09 now states both: the rows are the record, `User.AcceptedTcVersion` is a denormalised fast-path for F04's gate check. No change to the field's shape — [F04](./F04-login.md) is unaffected.
- **2026-07-27** — **R11 added (new)** — abandoned-registration recovery. AC2 hard-409'd every duplicate phone, permanently locking a user out of their own number when they registered but never completed F02: [F04](./F04-login.md) deliberately returns a generic `invalid_credentials` for unverified-phone (enumeration resistance, so it can never hint at the fix), and [F06](./F06-password-recovery.md) would let them reset a password they still cannot log in with (R06 blocks login until phone-verified). The registration 409 was the only viable resume point. AC2 narrowed to verified accounts; AC10 added for the unverified case. R11 pins the resume path to the existing per-phone daily cap and per-IP window so it cannot be used to spam SMS at a known-registered number.
- **2026-07-27** — **Lifecycle `spec-locked` → `design-approved`** on completion of `/design-feature M01-F01`. 9 states × 3 viewports = 27 reviewed frames. The generic `api-409` was split three ways and `password-policy-error` added, giving AC2, AC3, AC8, AC9, AC10 and R11 their first visual surface. Design is throwaway preview only — no production code.
- **2026-07-27** — **Lifecycle `drafting` → `spec-locked`** on completion of [`/plan-feature M01-F01`](../../plans/M01/M01-F01.md). Every AC maps to a surface; remaining open questions are design/implementation detail. Note OQ1 (pending-verification session cookie contract, which [F02](./F02-phone-otp-verification.md) consumes) must be pinned before F02 implementation.
- **2026-07-27** — **§6 design path corrected** (`src/design/screens/M01/…` → `src/designs/M01-F01/registration-form.tsx`); **§7 F02 relation direction corrected** (was "Depends on", F01 is the producer — [F02 §7](./F02-phone-otp-verification.md) already held the correct reciprocal); **§7 F14 dependency added** (implied by the R04 rewrite); **§8 `outcome` enum extended** for R11.
