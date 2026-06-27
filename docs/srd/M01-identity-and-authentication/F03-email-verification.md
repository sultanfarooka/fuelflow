# M01-F03 — Email Verification

| | |
|---|---|
| **Lifecycle** | `drafting` |
| **Design** | [`F03-email-verification.tsx`](../../../fuel-flow-web/src/design/screens/M01/F03-email-verification.tsx) |
| **Last updated** | 2026-06-27 |

## 1. Purpose

A user proves ownership of the optional email they supplied during
[F01 Registration](./F01-registration.md) (or later via
[F10 Email Change](./F10-email-change.md)) by clicking a time-limited link
sent to that address. Success flips `EmailConfirmed` to true and unlocks
email as an alternative login channel ([F04 Login](./F04-login.md)).
Phone-only accounts are unaffected — email verification is never blocking.

## 2. User stories

| As a | I want to | So that |
|---|---|---|
| User who gave an email at signup | click the link in the verification email | I can log in with email in addition to my phone |
| User who missed or deleted the email | request a resend from the check-inbox screen | I'm not permanently locked out of email login |
| User whose link expired | get a fresh link easily | I don't have to start over |
| Platform | bound token lifetime and resend rate | email delivery cost and abuse surface stay bounded |

## 3. Functional requirements

| ID | Requirement | Status |
|---|---|---|
| R01 | Token is cryptographically random (≥ 32 bytes, URL-safe base64); not derived from user data | Drafting |
| R02 | Token TTL 24 hours from issuance | Drafting |
| R03 | Only one active token per email address at a time; a new resend invalidates the previous token | Drafting |
| R04 | Clicking a valid, unexpired token → `EmailConfirmed=true`, token burnt (single-use) | Drafting |
| R05 | Expired or already-burnt token → distinct `email_token_expired` / `email_token_invalid` error with resend CTA | Drafting |
| R06 | Email already confirmed → idempotent `200` with `alreadyVerified=true`; no side effects | Drafting |
| R07 | Resend rate-limited: 60-second cooldown per email address; daily cap (default 10, configurable) | Drafting |
| R08 | Per-IP rate limit on both verify and resend endpoints (sliding window) | Drafting |
| R09 | Email verification never blocks account access — phone-verified accounts operate fully without it | Drafting |

## 4. Non-functional requirements

_Module-wide NFRs apply. Feature-specific overrides:_

| Concern | Requirement |
|---|---|
| Security | Token stored hashed (SHA-256 + pepper); plaintext only in the outbound email. Invalidate all tokens for an email on successful verify. |
| Performance | Token-verify redirect p95 < 200 ms. Resend enqueue p95 < 100 ms (excluding SMTP dispatch). |
| Deliverability | Email from a dedicated sending domain; SPF/DKIM/DMARC configured. |
| i18n | Email body and SPA strings localised `en` + `ur`. |

## 5. Acceptance criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC1 | Valid, unexpired token for an unverified email | `GET /auth/verify-email?token=<t>` | 200, `EmailConfirmed=true`, token burnt, SPA shows "Email verified — sign in to continue" screen (no auto-sign-in; applies whether same or different device) |
| AC2 | Token past 24-hour TTL | Verify | 410 `email_token_expired`; SPA shows "Link expired — resend?" CTA |
| AC3 | Token already burnt (re-click) | Verify | 410 `email_token_invalid`; same "Link expired — resend?" CTA |
| AC4 | Email already verified | Verify (any token) | 200 with `alreadyVerified=true`; no state changes; audit event emitted |
| AC5 | Resend within 60 s of last issuance | `POST /auth/resend-email-verification {email}` | 429 with `Retry-After` header; no new token queued |
| AC6 | Resend, daily cap hit | Resend | 429 `email_daily_cap`; user told to retry tomorrow |
| AC7 | Resend, cooldown elapsed, cap not hit | Resend | 202; new token queued; old active token invalidated; countdown resets on screen |

## 6. Design flow

Design: [`F03-email-verification.tsx`](../../../fuel-flow-web/src/design/screens/M01/F03-email-verification.tsx) · live at `/design/M01/M01-F03`.

**Screens:** Check-inbox (with resend + countdown) → verified success.

**States in the design:** check-inbox default, resend cooldown active. **Pending:** expired-link, invalid-link, daily-cap-reached, already-verified.

## 7. Dependencies

| Relation | Target | Why |
|---|---|---|
| Depends on | [F01 Registration](./F01-registration.md) | Queues the first verification email when an email is supplied |
| Depends on | [M10-F03 Notification Channels](../../MODULES.md#m10-f03--notification-channels) | SMTP sender for verification emails |
| Used by | [F04 Login](./F04-login.md) | Email login channel requires `EmailConfirmed=true` |
| Used by | [F10 Email Change](./F10-email-change.md) | Re-runs this flow for the new address before swapping |
| Out of scope | Phone OTP verification (→ [F02](./F02-phone-otp-verification.md)) · magic-link login (not planned) | Owned by their respective features |

## 8. Audit emissions

| Event | Fields | Sink |
|---|---|---|
| `auth.email.verification_sent` | `userId, emailHash, ip, purpose` | [M17](../M17-audit-and-compliance/README.md) |
| `auth.email.verified` | `userId, emailHash, ip` | [M17](../M17-audit-and-compliance/README.md) |
| `auth.email.already_verified` | `userId, emailHash, ip` | [M17](../M17-audit-and-compliance/README.md) |
| `auth.email.verification_failed` | `userId?, emailHash, ip, outcome` | [M17](../M17-audit-and-compliance/README.md) |
| `auth.email.resend_rate_limited` | `userId?, emailHash, ip, reason` | [M17](../M17-audit-and-compliance/README.md) |

`purpose` ∈ `{registration, email-change}`. `outcome` ∈ `{expired, invalid}`. `reason` ∈ `{cooldown, daily_cap, ip_window}`.

## 9. API surface

| Method | Path | Body / Params | Responses |
|---|---|---|---|
| `GET` | `/api/v1/auth/verify-email` | `?token=<string>` | 200 · 410 (`email_token_expired` / `email_token_invalid`) · 429 |
| `POST` | `/api/v1/auth/resend-email-verification` | `{email}` | 202 · 429 (`cooldown` / `email_daily_cap`) |

Full schemas in Swagger. Side effect on resend: enqueues email via M10-F03.

## 10. Open questions

_None._ All initial open questions resolved 2026-06-27 — see section 11.

## 11. Change history

- **2026-06-27** — Initial draft.
- **2026-06-27** — **OQ1 resolved →** always show "verified — sign in" screen; no auto-sign-in. Keeps server logic stateless (no session detection); matches the cross-device case naturally. AC1 updated.
- **2026-06-27** — **OQ2 resolved →** same as OQ1 decision — verify succeeds, SPA shows success + login CTA regardless of device. No separate handling needed.
- **2026-06-27** — **OQ3 resolved →** no security-notification email. User just clicked the link themselves; a second email is noise with no meaningful security gain.
