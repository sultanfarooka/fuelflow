# M01-F06 — Password Recovery

| | |
|---|---|
| **Lifecycle** | `drafting` |
| **Design** | _pending_ |
| **Last updated** | 2026-06-27 |

## 1. Purpose

A user who forgot their password proves channel ownership and sets a new one
without contacting support. Two channels are supported:

- **Phone reset** — SMS OTP (default; always available because phone is mandatory).
- **Email reset** — time-limited reset link (only if the email is verified per [F03](./F03-email-verification.md)).

The reset never reveals whether an identifier is on file, must invalidate all
existing sessions on success, and must not become a brute-force or SMS-pumping vector.

## 2. User stories

| As a | I want to | So that |
|---|---|---|
| User who forgot their password | reset via SMS OTP to my phone | I can regain access without support |
| User with a verified email | reset via email link as an alternative | I can recover even if I changed SIM |
| Anyone | not learn whether a phone/email is registered | account enumeration is impossible |
| Platform | bound resets per day and per IP | SMS spend and brute-force are bounded |
| User who just reset | be signed out of every old session | a compromised attacker is locked out |

## 3. Functional requirements

| ID | Requirement | Status |
|---|---|---|
| R01 | `POST /auth/password-reset/request` accepts `{identifier, channel}` where `identifier` is phone or email and `channel ∈ {phone, email}` | Drafting |
| R02 | Response is always 202 `{message: "If the identifier is on file, a reset has been sent."}` — never leaks existence | Drafting |
| R03 | Phone-channel reset issues a 6-digit OTP via [M10-F03](../../MODULES.md#m10-f03--notification-channels); TTL 10 min; SHA-256 + pepper at rest | Drafting |
| R04 | Email-channel reset only when `EmailConfirmed=true`; issues a random ≥32-byte URL-safe token; TTL 1 hour; hashed at rest | Drafting |
| R05 | Only one active reset token per identifier+channel; re-request invalidates the previous | Drafting |
| R06 | `POST /auth/password-reset/confirm` accepts `{identifier, channel, token, newPassword}` and validates per [F14 Password Policy](./F14-password-policy.md) | Drafting |
| R07 | Confirm with valid token → update password, burn token, **revoke every existing session** ([F05](./F05-logout-and-session-revocation.md) `reason=password_change`), do not auto-sign-in | Drafting |
| R08 | Expired / invalid / already-used token → 410 `reset_token_expired` / `reset_token_invalid` (distinct codes); no state change | Drafting |
| R09 | Resend rate-limit: 60 s per identifier+channel; daily cap shared with [F02](./F02-phone-otp-verification.md) / [F03](./F03-email-verification.md) caps to keep totals bounded | Drafting |
| R10 | Per-IP sliding-window rate limit on both request and confirm | Drafting |
| R11 | After successful reset, send a courtesy notification to **the other** channel ("Your password was changed") to surface unauthorised resets — see [F15](./F15-suspicious-activity-alerts.md) | Drafting |
| R12 | A locked account ([F13](./F13-account-lockout-and-unlock.md)) is **not** unlocked by reset; reset succeeds, but lockout TTL still applies until expiry — UI explains | Drafting |

## 4. Non-functional requirements

| Concern | Requirement |
|---|---|
| Security | Tokens hashed (SHA-256 + pepper). Constant-time compare on OTP confirm. New password validated server-side per [F14](./F14-password-policy.md). |
| Performance | Request enqueue p95 < 100 ms; confirm p95 < 250 ms incl. bcrypt. |
| Privacy | Audit logs `identifierHash` only. Generic message regardless of existence. |
| Deliverability | Same SMS / SMTP guarantees as F02 / F03. |
| i18n | OTP message + reset email + SPA strings localised `en` + `ur`. |

## 5. Acceptance criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC1 | Phone-channel reset for a real, phone-verified user | `POST /auth/password-reset/request {phone, channel:phone}` | 202; OTP queued; old reset token (if any) invalidated |
| AC2 | Phone-channel reset for an unknown phone | Request | 202 (same body); no SMS, no row |
| AC3 | Email-channel reset for verified email | Request | 202; reset link queued; old token invalidated |
| AC4 | Email-channel reset for unverified or unknown email | Request | 202 (same body); no email sent |
| AC5 | Valid OTP + new password meeting policy | `POST /auth/password-reset/confirm` | 200; password updated; **all sessions revoked**; courtesy email sent (if email on file); SPA shows "Password reset — sign in" |
| AC6 | Valid email token + new password | Confirm | 200; same effects as AC5; courtesy SMS sent |
| AC7 | Expired token | Confirm | 410 `reset_token_expired`; password unchanged |
| AC8 | Already-burnt token | Confirm | 410 `reset_token_invalid`; password unchanged |
| AC9 | New password fails policy | Confirm | 400 with field-level error; token NOT burnt (single retry allowed within TTL) |
| AC10 | Resend within 60 s | Request | 429 with `Retry-After`; no new token |
| AC11 | Daily cap hit | Request | 429 `daily_cap`; user told to retry tomorrow |
| AC12 | Per-IP rate limit exceeded | Request or Confirm | 429 with `Retry-After` |

## 6. Design flow

Design: _pending_.

**Screens:** "Forgot password" identifier entry → channel chooser (phone / email — email hidden if no verified email exists) → OTP or "Check your inbox" → new-password form → success ("Sign in with your new password"). **States:** rate-limited, expired-token, invalid-token, weak-password, success.

## 7. Dependencies

| Relation | Target | Why |
|---|---|---|
| Depends on | [F02 Phone OTP](./F02-phone-otp-verification.md) | Reuses OTP infrastructure |
| Depends on | [F03 Email Verification](./F03-email-verification.md) | Reuses token infrastructure + verified-email gate |
| Depends on | [F14 Password Policy](./F14-password-policy.md) | Validates new password |
| Depends on | [F05 Session Revocation](./F05-logout-and-session-revocation.md) | Revoke-all-sessions on success |
| Triggers | [F15 Suspicious-Activity Alerts](./F15-suspicious-activity-alerts.md) | Cross-channel courtesy notification |
| Out of scope | Owner-initiated reset of another user's password | Lives in [M16](../M16-team-and-access/README.md) |
| Out of scope | Lockout removal | Owned by [F13](./F13-account-lockout-and-unlock.md) |

## 8. Audit emissions

| Event | Fields | Sink |
|---|---|---|
| `auth.password_reset.requested` | `identifierHash, channel, ip, ua` | [M17](../M17-audit-and-compliance/README.md) |
| `auth.password_reset.sent` | `userId, channel, ip` *(only when user exists; not visible in response)* | M17 |
| `auth.password_reset.confirmed` | `userId, channel, ip, sessionsRevoked` | M17 |
| `auth.password_reset.failed` | `identifierHash, channel, ip, outcome` | M17 |
| `auth.password_reset.rate_limited` | `identifierHash, channel, ip, reason` | M17 |

`outcome` ∈ `{expired, invalid, weak_password}`. `reason` ∈ `{cooldown, daily_cap, ip_window}`.

## 9. API surface

| Method | Path | Body | Responses |
|---|---|---|---|
| `POST` | `/api/v1/auth/password-reset/request` | `{identifier, channel}` | 202 · 429 |
| `POST` | `/api/v1/auth/password-reset/confirm` | `{identifier, channel, token, newPassword}` | 200 · 400 · 410 · 429 |

Full schemas in Swagger.

## 10. Open questions

- **OQ1** — When a user has no verified email and picks "email" channel, do we still respond 202 (current default — keeps the no-leak guarantee) or surface a "no email on file" hint? Leaning 202.
- **OQ2** — Should the new password be required to be **different from the previous N passwords** (history check)? Currently no. Revisit if [F14](./F14-password-policy.md) introduces history.

## 11. Change history

- **2026-06-27** — Initial draft.
