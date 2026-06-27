---
id: M01-F02
module: M01-identity-and-authentication
title: Phone OTP Verification
lifecycle: drafting
design: ../../../fuel-flow-web/src/design/screens/M01/F02-phone-otp-verification.tsx
legacy: M01-F09-R03/R04/R10/R12 (MODULES.md)
last-updated: 2026-06-27
---

# M01-F02 — Phone OTP Verification

## 1. Purpose

A user proves they hold the phone number on file by entering a 6-digit SMS OTP.
Triggered by [F01 Registration](./F01-registration.md), by login attempts on a
phone-unverified account (per [F04 Login](./F04-login.md)), and by
[F09 Phone Number Change](./F09-phone-number-change.md). Success flips
`PhoneNumberConfirmed` to true and routes the user back to whichever flow sent
them here.

## 2. User stories

| As a | I want to | So that |
|---|---|---|
| New user who just registered | enter the SMS code I received | I can finish creating my account |
| User on a slow network who didn't get the SMS | request a resend after a short cooldown | I'm not stuck if the first SMS didn't arrive |
| User who fat-fingered the code | see attempts remaining + an easy retry | I don't get locked out on a single typo |
| Platform | bound OTP lifetime, attempt count, and daily issuance | SMS spend and brute-force surface stay bounded |

## 3. Functional requirements

| ID | Requirement | Status |
|---|---|---|
| R01 | OTP entry page accepts a Pakistani phone in E.164 form (from query param or pending-verification session) | Planned |
| R02 | Code is exactly 6 numeric digits | Planned |
| R03 | OTP TTL 5 minutes from issuance; expired codes fail with a distinct error | Planned |
| R04 | Max 3 verification attempts per OTP; on the 3rd failure the OTP is permanently locked (must request a new one) | Planned |
| R05 | Resend permitted after a 60-second cooldown | Planned |
| R06 | Per-phone daily issuance cap (default 10, configurable) | Planned |
| R07 | OTP stored hashed (SHA-256 + pepper); plaintext only exists in the outbound SMS payload | Planned |
| R08 | Successful verification sets `PhoneNumberConfirmed=true`, invalidates the OTP row, routes back to the originating flow (registration → onboarding; login → dashboard; phone-change → settings) | Planned |
| R09 | Rate-limit `POST /verify-phone` and `POST /resend-otp` per IP (sliding window) and per phone (daily cap) | Planned |
| R10 | OTP record carries a `purpose` enum (`registration` / `login` / `phone-change`) so the post-verify routing knows where to send the user | Planned |

## 4. Non-functional requirements

| Concern | Requirement |
|---|---|
| Security | OTP at rest: SHA-256 + per-tenant pepper. Never log plaintext. Pepper rotation procedure documented separately. |
| Performance | Verify endpoint p95 < 200 ms. Resend endpoint p95 < 100 ms excluding SMS dispatch (enqueued). |
| Accessibility | OTP boxes are one `<input>` underneath six visual cells (single accessible group) with `inputmode="numeric"`, `autocomplete="one-time-code"`, paste-from-clipboard support, and per-cell focus management. |
| i18n | Resend countdown, attempt-remaining, and error strings localised `en` + `ur`. Timer text reads correctly in RTL. |
| Idempotency | A repeat verify of a code that just succeeded returns `200` with the same final-state payload; doesn't re-trigger the post-verify side-effects (routing token already burnt). |

## 5. Acceptance criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC1 | Valid OTP within TTL for `purpose=registration` | `POST /auth/verify-phone {phone, code}` | 200, `PhoneNumberConfirmed=true`, OTP row burnt, SPA routes to `/onboarding` |
| AC2 | Wrong code, attempts left | Verify | 400 with `attemptsRemaining` in body; OTP row attempt-counter incremented |
| AC3 | Wrong code, 3rd attempt | Verify | 410 `Gone` with code `otp_locked`; OTP row marked locked; SPA shows "Request a new code" affordance |
| AC4 | OTP past 5-minute TTL | Verify | 410 `Gone` with code `otp_expired`; same "Request a new code" affordance |
| AC5 | Resend requested within 60 s of last issuance | `POST /auth/resend-otp {phone, purpose}` | 429 with `Retry-After` header; no new OTP queued |
| AC6 | Resend requested, per-phone daily cap already hit | Resend | 429 with code `otp_daily_cap`; no new OTP queued; user told to retry tomorrow |
| AC7 | Old OTP locked / expired, fresh OTP requested | Resend | 202 with a new OTP queued; attempt counter resets; old row stays in DB with status for audit |
| AC8 | Already-verified phone | Verify | See [OQ1](#10-open-questions) |
| AC9 | Login flow OTP verified | Verify with `purpose=login` | 200, session promoted to authenticated, SPA routes to `/dashboard` |
| AC10 | Phone-change flow OTP verified | Verify with `purpose=phone-change` | 200, `User.PhoneNumber` swaps to the pending value, `PhoneNumberConfirmed` stays true (handled in [F09](./F09-phone-number-change.md)) |

## 6. Design flow

Design: `../../../fuel-flow-web/src/design/screens/M01/F02-phone-otp-verification.tsx` *(pending rename — currently lives at [`F09-phone-first-auth.tsx`](../../../fuel-flow-web/src/design/screens/M01/F09-phone-first-auth.tsx) inside the design playground; the OtpStep + VerifiedStep components are the F02 screens)*.

**Screens:** OTP entry (6 boxes, countdown, resend) → success (handoff to originating flow).

**States in the design:** OTP entry (cursor on next empty box), verified success. **Pending:** wrong-code (with attempts-remaining banner), locked (with "Request new code" CTA), expired, resend-cooldown countdown explicit, daily-cap reached.

## 7. Dependencies

| Relation | Target | Why |
|---|---|---|
| Depends on | [M10-F03 Notification Channels](../../MODULES.md#m10-f03--notification-channels) | SMS sender that actually delivers the OTP |
| Depends on | [F01 Registration](./F01-registration.md) | Queues the first OTP on signup |
| Used by | [F04 Login](./F04-login.md) | Login on unverified accounts re-queues an OTP and routes here |
| Used by | [F09 Phone Number Change](./F09-phone-number-change.md) | Verifies the new number before committing the swap |
| Out of scope | Voice-call OTP fallback (see [OQ3](#10-open-questions)) · email-link verification (→ [F03](./F03-email-verification.md)) · TOTP / authenticator apps (→ [F12](./F12-two-factor-authentication.md)) | Owned by their respective features |

## 8. Audit emissions

| Event | Fields | Sink |
|---|---|---|
| `auth.otp.verified` | `userId, phoneHash, purpose, attemptNumber, ip` | [M17](../M17-audit-and-compliance/README.md) |
| `auth.otp.failed` | `userId, phoneHash, purpose, attemptNumber, outcome, ip` | [M17](../M17-audit-and-compliance/README.md) |
| `auth.otp.resent` | `userId, phoneHash, purpose, ip` | [M17](../M17-audit-and-compliance/README.md) |
| `auth.otp.rate_limited` | `userId?, phoneHash, ip, reason` | [M17](../M17-audit-and-compliance/README.md) |

`purpose` ∈ `{registration, login, phone-change}`. `outcome` ∈ `{wrong_code, expired, locked}`. `reason` ∈ `{cooldown, daily_cap, ip_window}`.

## 9. API surface

| Method | Path | Body | Responses |
|---|---|---|---|
| `POST` | `/api/v1/auth/verify-phone` | `{phone, code, purpose?}` | 200 · 400 · 410 (`otp_expired` / `otp_locked`) · 429 |
| `POST` | `/api/v1/auth/resend-otp` | `{phone, purpose}` | 202 · 429 (`cooldown` / `otp_daily_cap`) |

Full schemas in Swagger. Side effect on resend: enqueues SMS OTP via M10-F03.

## 10. Open questions

- **OQ1** — Verifying an already-verified phone: idempotent `200` (don't surprise the user) or `409 Conflict` (signal that something's off, e.g., stale SPA cache, repeated submit)?
- **OQ2** — Should the SMS body include a magic deep link the user can tap, or strictly manual code entry? Deep links improve UX on smartphones but are unreliable / spoofable on Pakistani feature-phone SMS clients.
- **OQ3** — Voice-call OTP fallback for users who can't receive SMS reliably (very common in rural areas + on shared SIMs). Adds gateway cost + complexity. In scope for F02 or a separate feature?
- **OQ4** — After OTP is locked (3 wrong attempts), should the user be free to immediately request a new code, or should we impose a short cooldown (e.g. 2 minutes) before allowing resend? Brute-force-attempt counter vs. annoyance trade-off.
- **OQ5** — `purpose` is currently sent client-side in the verify payload. Should it instead be inferred server-side from the OTP row (single source of truth, harder to spoof) and the client just sends `{phone, code}`?

## 11. Change history

- **2026-06-27** — Initial draft. Carries forward M01-F09-R03 (SMS OTP, blocking login until verified), R04 (6 digits, 5-min TTL, 3 attempts, 60 s resend), R10 (platform SMS sender pre-onboarding), R12 (rate limits) from MODULES.md. Splits from F01 to make OTP entry a first-class feature with its own audit emissions and design surface.
