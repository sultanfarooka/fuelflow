# M01-F04 — Login

| | |
|---|---|
| **Lifecycle** | `drafting` |
| **Design** | _pending_ |
| **Last updated** | 2026-06-27 |

## 1. Purpose

An existing user authenticates with **phone + password** (primary channel) or
**email + password** (only if email is verified per [F03](./F03-email-verification.md)).
A successful login issues an access + refresh token pair, opens a device session
(see [F08](./F08-device-and-session-management.md)), and lands the user on the
correct route based on tenant onboarding state. Wrong credentials must look
indistinguishable from "user does not exist" to prevent enumeration.

## 2. User stories

| As a | I want to | So that |
|---|---|---|
| Phone-verified owner | sign in with my phone number | I can use the app daily |
| Owner who added a verified email | sign in with email when I'm at a laptop | I don't have to type my phone every time |
| Owner with 2FA enabled | be prompted for a TOTP code after password | a stolen password alone isn't enough |
| Anyone with the wrong password | see a generic error | attackers can't enumerate accounts |
| Platform | bound brute-force attempts | password guessing is uneconomical |

## 3. Functional requirements

| ID | Requirement | Status |
|---|---|---|
| R01 | Identifier is either E.164 phone or email; one input field auto-detects | Drafting |
| R02 | Phone login allowed only if `PhoneNumberConfirmed=true`; otherwise route to [F02](./F02-phone-otp-verification.md) resume | Drafting |
| R03 | Email login allowed only if `EmailConfirmed=true`; unverified email → generic `invalid_credentials` (no leak) | Drafting |
| R04 | Password verified with bcrypt; constant-time compare | Drafting |
| R05 | Bad credentials → 401 `invalid_credentials` (single error code regardless of which field was wrong, or whether user exists) | Drafting |
| R06 | Successful password + no 2FA → issue access (15 min) + refresh (30 days) tokens; both as `HttpOnly`, `Secure`, `SameSite=Lax` cookies | Drafting |
| R07 | Successful password + 2FA enabled ([F12](./F12-two-factor-authentication.md)) → return 200 `{twoFactorRequired: true, twoFactorToken}`; no auth cookies issued yet | Drafting |
| R08 | TOTP step exchanges `twoFactorToken` + 6-digit code → final tokens; `twoFactorToken` TTL 5 min, single-use | Drafting |
| R09 | Locked account ([F13](./F13-account-lockout-and-unlock.md)) → 423 `account_locked` with unlock guidance; lockout itself decided in F13 | Drafting |
| R10 | Per-IP sliding-window + per-identifier counter feed F13 (5 fails / 15 min → lock) | Drafting |
| R11 | Each successful login creates a `Session` row (device id, ua, ip) used by [F08](./F08-device-and-session-management.md) | Drafting |
| R12 | Post-login redirect: owner without org → [M12 Onboarding](../../MODULES.md#m12--onboarding--first-run-experience); otherwise → role-default home | Drafting |
| R13 | If user has un-accepted current T&C version ([F16](./F16-terms-and-privacy-acceptance.md)) → 200 `{tcAcceptanceRequired: true}`; SPA blocks further routes until accepted | Drafting |
| R14 | "Remember this device" extends refresh-token TTL to 90 days; otherwise 30 days | Drafting |

## 4. Non-functional requirements

| Concern | Requirement |
|---|---|
| Security | Constant-time password verify. No `Login` field hint in error response. Refresh token rotated on use; previous token blacklisted (jti). |
| Performance | p95 < 250 ms incl. bcrypt (cost 12). |
| Rate limiting | Per-IP: 20 attempts / 10 min. Per-identifier: feeds F13 counter. |
| Accessibility | Single-field identifier with `inputmode="email"` switching when `@` detected. Password reveal toggle. |
| i18n | Errors localised `en` + `ur`. Identifier accepts `+92…` or `0…`. |
| Observability | Outcome (success / wrong_password / unknown_user / locked / 2fa_required) logged with `phoneHash`/`emailHash`, ip, ua. |

## 5. Acceptance criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC1 | Phone-verified user, correct password, 2FA off | `POST /auth/login {phone, password}` | 200, access + refresh cookies set, session row created, redirect target returned |
| AC2 | Verified email, correct password, 2FA off | `POST /auth/login {email, password}` | 200, cookies set |
| AC3 | Wrong password (or unknown identifier, or unverified phone, or unverified email) | Login | 401 `invalid_credentials` (identical body for all four cases); F13 counter incremented for known users |
| AC4 | 2FA enabled, correct password | Login | 200 `{twoFactorRequired: true, twoFactorToken}`; no auth cookies set |
| AC5 | Valid `twoFactorToken` + correct TOTP | `POST /auth/login/2fa {twoFactorToken, code}` | 200, full auth cookies, session row created |
| AC6 | Invalid TOTP | 2FA step | 401 `invalid_2fa_code`; F13 counter incremented |
| AC7 | Account locked | Any login attempt | 423 `account_locked` with `Retry-After`; no counter increment |
| AC8 | Owner whose org is incomplete | Login success | Redirect `/onboarding/...` per M12 state |
| AC9 | User has not accepted current T&C | Login success | 200 with `tcAcceptanceRequired=true`; SPA shows F16 modal |
| AC10 | "Remember device" checked | Login | Refresh-token cookie `Max-Age=90d`; device flagged trusted in `Session` |
| AC11 | Per-IP rate limit exceeded | Login | 429 with `Retry-After`; F13 counter not incremented |

## 6. Design flow

Design: _pending_.

**Screens:** Login form (one identifier field + password) → optional 2FA step → success redirect. **States:** default, password-revealed, 2fa-step, error (generic invalid_credentials), locked, T&C-required modal, 429 throttled.

## 7. Dependencies

| Relation | Target | Why |
|---|---|---|
| Depends on | [F02 Phone OTP Verification](./F02-phone-otp-verification.md) | Phone channel must be verified |
| Depends on | [F03 Email Verification](./F03-email-verification.md) | Email channel must be verified |
| Depends on | [F12 2FA](./F12-two-factor-authentication.md) | Second-factor challenge when enabled |
| Depends on | [F13 Lockout](./F13-account-lockout-and-unlock.md) | Owns the failure counter and the 423 |
| Depends on | [F16 T&C Acceptance](./F16-terms-and-privacy-acceptance.md) | Owns the current version pointer |
| Used by | [F08 Sessions](./F08-device-and-session-management.md) | Each login creates a session row |
| Out of scope | PIN login (→ [F07](./F07-pin-quick-login.md)) · social/SSO | Owned by F07 / not planned |

## 8. Audit emissions

| Event | Fields | Sink |
|---|---|---|
| `auth.login.attempted` | `identifierHash, channel, ip, ua` | [M17](../M17-audit-and-compliance/README.md) |
| `auth.login.succeeded` | `userId, sessionId, channel, ip, ua, trustedDevice` | M17 |
| `auth.login.failed` | `identifierHash, ip, ua, outcome` | M17 |
| `auth.login.2fa_required` | `userId, ip` | M17 |
| `auth.login.2fa_verified` | `userId, ip` | M17 |
| `auth.login.2fa_failed` | `userId, ip` | M17 |

`channel` ∈ `{phone, email}`. `outcome` ∈ `{wrong_password, unknown_user, unverified_phone, unverified_email, locked, rate_limited}`.

## 9. API surface

| Method | Path | Body | Responses |
|---|---|---|---|
| `POST` | `/api/v1/auth/login` | `{identifier, password, rememberDevice?}` | 200 (cookies or `{twoFactorRequired,...}`) · 401 · 423 · 429 |
| `POST` | `/api/v1/auth/login/2fa` | `{twoFactorToken, code}` | 200 (cookies) · 401 · 410 (`twoFactorToken_expired`) · 429 |

Full schemas in Swagger.

## 10. Open questions

- **OQ1** — Should "remember device" be a per-device opt-in cookie or a server-side flag on `Session`? (Leaning server-side so [F08](./F08-device-and-session-management.md) can revoke trust.)
- **OQ2** — Do we surface "this device is new" alerts via [F15](./F15-suspicious-activity-alerts.md) on the first login from an unknown ua/ip, or only on country mismatch?

## 11. Change history

- **2026-06-27** — Initial draft.
