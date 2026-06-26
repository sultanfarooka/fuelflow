---
id: M01-F01
module: M01-authentication
title: Self-Service Registration
lifecycle: drafting
design: ../../../fuel-flow-web/src/design/screens/M01/F01-registration.tsx
legacy: M01-F01 (MODULES.md)
last-updated: 2026-06-27
---

# M01-F01 — Self-Service Registration

## 1. Purpose

A prospective filling-station owner creates a Fuel Flow account using their
Pakistani phone number (+92 format) and a password — no email or organisation
required up-front. The account is created in a `phone-unverified` state and the
user is immediately routed into [M01-F02 Phone OTP Verification](./F02-phone-otp-verification.md).
Email is an optional fallback channel; if supplied, it is captured here and
verified later via [M01-F03](./F03-email-verification.md). Organisation and
first-station creation are deferred to [M12 Onboarding](../../MODULES.md#m12--onboarding--first-run-experience)
after the user can log in.

## 2. User stories

- **As a** prospective owner without an email account, **I want to** sign up
  using only my phone number, **so that** I'm not blocked by an email
  requirement I can't satisfy.
- **As a** prospective owner with an email, **I want to** add it during signup,
  **so that** I have a fallback login channel later.
- **As a** prospective owner who fat-fingers a duplicate phone, **I want** a
  clear error and an offer to log in instead, **so that** I don't waste time.
- **As the** platform, **I want** every registration attempt rate-limited per
  IP and per phone, **so that** SMS costs don't get burned by bot signups.

## 3. Functional requirements

| ID | Requirement | Status |
|---|---|---|
| M01-F01-R01 | Phone number is required; format must be `+92XXXXXXXXXX` (E.164) | Planned |
| M01-F01-R02 | Phone number is unique across all users; duplicate returns `409 Conflict` | Planned |
| M01-F01-R03 | Email is optional; when provided, format must be valid and unique across all users | Planned |
| M01-F01-R04 | Password minimum 6 characters, must include at least one number | Planned |
| M01-F01-R05 | Full name is required; 2–100 characters; trimmed; no leading/trailing whitespace | Planned |
| M01-F01-R06 | Registration creates an account in `phone-unverified` state; login is blocked until verification (see [M01-F02](./F02-phone-otp-verification.md)) | Planned |
| M01-F01-R07 | On success, an SMS OTP is queued via [M10-F03](../../MODULES.md#m10-f03--notification-channels) and the user is routed to the verification screen | Planned |
| M01-F01-R08 | Registration creates an **Owner** user only; no organisation, no station — those are deferred to [M12](../../MODULES.md#m12--onboarding--first-run-experience) | Planned |
| M01-F01-R09 | T&C + Privacy version-id at signup time is recorded on the user row (see [M01-F16](./F16-terms-and-privacy-acceptance.md)) | Planned |
| M01-F01-R10 | Per-IP sliding-window rate limit on `POST /auth/register`; per-phone daily cap on OTP issuance | Planned |

## 4. Non-functional requirements

| Concern | Requirement |
|---|---|
| Security | Password hashed with bcrypt cost ≥ 12 before insert. Phone stored in E.164 only. Email stored case-folded. T&C version stored as immutable string. |
| Performance | p95 response time under 300 ms excluding SMS dispatch (which is enqueued, not awaited). |
| Accessibility | All inputs labelled; password rule chips announced; error summary moved into focus on submit failure; OTP boxes (handled by F02) are a single accessible group. |
| i18n | Every label, placeholder, hint, and error string localised in `en` + `ur`. Phone field accepts both `+92…` and `0…` notation; normalises on blur. |
| Rate limiting | Per-IP sliding window: 5 attempts per 10 minutes. Per-phone daily OTP cap: 10 (configurable). |
| Privacy | Phone E.164 hash + email SHA-256 logged in audit, never the plaintext value. |
| Idempotency | Two simultaneous requests for the same phone resolve to a single account row (DB-level unique index, retry-on-409 from the client). |

## 5. Acceptance criteria

- **AC1** Given a valid `{ fullName, phone, password }` payload (no email), when posted to `POST /auth/register`, then the API returns `201 Created`, a row is inserted with `PhoneNumberConfirmed = false`, an SMS OTP is queued, and the response carries the unverified-account session signal that the SPA uses to route into F02.
- **AC2** Given a phone number already on file, when a new registration uses it, then the API returns `409 Conflict` with error code `phone_already_registered` and no SMS is sent.
- **AC3** Given an email already on file, when a new registration uses it, then the API returns `409 Conflict` with error code `email_already_registered` and no row is inserted.
- **AC4** Given a phone number that doesn't match `+92XXXXXXXXXX` after normalisation, when registration is submitted, then the API returns `400 Bad Request` with field-level error on `phone`.
- **AC5** Given a password shorter than 6 characters OR missing a number, when registration is submitted, then the API returns `400 Bad Request` with field-level error on `password`.
- **AC6** Given the per-IP rate-limit is exceeded, when another registration is attempted from that IP, then the API returns `429 Too Many Requests` with `Retry-After` header and no row is inserted.
- **AC7** Given a fresh registration succeeds, when the user reloads the SPA, then they land on the F02 verification screen (the unverified-account session signal is persisted; org/dashboard guards keep them out of post-onboarding routes).

## 6. Design flow

Design lives at [`fuel-flow-web/src/design/screens/M01/F01-registration.tsx`](../../../fuel-flow-web/src/design/screens/M01/F01-registration.tsx) — rendered in dev at `/design/M01/M01-F01`.

Ordered screens:

1. **Sign-up entry** — owner-info form: full name, phone (required, +92), email (optional), password with rule chips.
2. **Submit → loading** — button enters pending state; cannot resubmit.
3. **Success handoff** → routes into [M01-F02 Phone OTP Verification](./F02-phone-otp-verification.md).

States covered by the design file:

- Default (populated mock)
- Mobile preview
- (Pending design) Validation-error state on individual fields
- (Pending design) Server-error state on duplicate phone / email
- (Pending design) Rate-limit (429) explicit error

## 7. Dependencies

- **Depends on** [M01-F02 Phone OTP Verification](./F02-phone-otp-verification.md) — the verification flow that consumes the queued OTP.
- **Depends on** [M10-F03 Notification Channels](../../MODULES.md#m10-f03--notification-channels) — SMS sender for the queued OTP. Pre-organisation OTPs route through the platform default sender ([M01-F09-R10 legacy](../../MODULES.md#m01-f09--phone-first-authentication)).
- **Depends on** [M01-F16 Terms & Privacy Acceptance](./F16-terms-and-privacy-acceptance.md) — supplies the current T&C version id that's stamped on the new user row.
- **Downstream:** [M12 Onboarding](../../MODULES.md#m12--onboarding--first-run-experience) — picks up the verified user to collect organisation + first station.
- **Out of scope:** OTP entry & verification UI (F02), email link click handler (F03), email/phone change after signup (F09/F10), password recovery (F06).

## 8. Audit emissions

| Event | Captured fields | Sink |
|---|---|---|
| `auth.registration.attempted` | `phoneHash`, `emailHash?`, `ip`, `userAgent`, `outcome` (one of: `success`, `duplicate_phone`, `duplicate_email`, `validation_failed`, `rate_limited`) | [M17 audit log](../M17-audit-and-compliance/README.md) |
| `auth.registration.succeeded` | `userId`, `phoneHash`, `emailHash?`, `tcVersion`, `ip` | [M17 audit log](../M17-audit-and-compliance/README.md) |
| `auth.otp.issued` (emitted by F02, listed for traceability) | `userId`, `purpose=registration`, `phoneHash`, `ip` | [M17 audit log](../M17-audit-and-compliance/README.md) |

## 9. API surface

- `POST /api/v1/auth/register`
  - Body: `{ fullName, phone, email?, password }`
  - Responses: `201` (created), `400` (validation), `409` (duplicate phone or email), `429` (rate limit)
  - Side effect: enqueues SMS OTP via M10-F03

Full request / response schemas live in Swagger at `/swagger`.

## 10. Open questions

- **OQ1** — When a duplicate phone is detected, do we soft-redirect to login with the phone pre-filled, or hard-fail with 409 and a "go to login" link? Defaults to hard-fail for clarity; product call needed.
- **OQ2** — Should CAPTCHA be enforced on the first registration attempt or only after the per-IP rate-limit threshold is crossed? Affects friction vs. bot exposure trade-off.
- **OQ3** — Do we want a "register on behalf of" admin path for sales-assisted signups? Currently not in scope; revisit when sales onboarding starts.
- **OQ4** — Should `fullName` be split into `firstName` / `lastName` at signup or kept as a single field? Single field matches current implementation; split would simplify formal correspondence later.

## 11. Change history

- **2026-06-27** — Initial draft. Carries forward today's M01-F01 (registration) + relevant rules from M01-F09 (phone-first auth: phone required, +92 format, unique). Section 7 explicitly defers OTP entry to M01-F02, email link verification to M01-F03, and org/station creation to M12.
