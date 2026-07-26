# M01-F11 — Password Change (authenticated)

| | |
|---|---|
| **Lifecycle** | `drafting` |
| **Design** | _pending_ |
| **Last updated** | 2026-06-28 |

## 1. Purpose

A signed-in user replaces their existing password with a new one **without
losing their session**. Distinct from [F06 Password Recovery](./F06-password-recovery.md),
which is for users who can't sign in at all. Successful change rotates the
current session and **revokes every other session** so any compromised tokens
are killed.

## 2. User stories

| As a | I want to | So that |
|---|---|---|
| User who suspects an old password leaked | rotate it from inside my account | I don't have to "forgot password" myself |
| User on a routine password refresh | change it quickly | normal hygiene takes seconds |
| User who mistypes the current password | get a clear field-level error | I retry without losing my work |
| Platform | guarantee other sessions die on success | a compromised co-session can't outlive the change |

## 3. Functional requirements

| ID | Requirement | Status |
|---|---|---|
| R01 | `POST /auth/password/change {currentPassword, newPassword}` requires an authenticated session | Drafting |
| R02 | `currentPassword` verified with bcrypt, constant-time; wrong → 401 `invalid_current_password` (feeds [F13](./F13-account-lockout-and-unlock.md) counter) | Drafting |
| R03 | `newPassword` validated per [F14 Password Policy](./F14-password-policy.md); must differ from `currentPassword` | Drafting |
| R04 | On success: update password hash; **revoke all other sessions** ([F05](./F05-logout-and-session-revocation.md), `reason=password_change`); **revoke all device PINs** ([F07](./F07-pin-quick-login.md)); rotate the current session's refresh token | Drafting |
| R05 | On success: send notification to verified email **and** to phone (cross-channel) — see [F15](./F15-suspicious-activity-alerts.md) for content | Drafting |
| R06 | Rate limit: 5 attempts / 10 min per user; further attempts → 429 | Drafting |
| R07 | Endpoint is **not** PIN-acceptable — PIN ([F07](./F07-pin-quick-login.md)) is a per-device convenience, never a re-auth for password change | Drafting |
| R08 | If 2FA enabled ([F12](./F12-two-factor-authentication.md)), require a fresh TOTP code in the same request: `{currentPassword, newPassword, totp}` | Drafting |

## 4. Non-functional requirements

| Concern | Requirement |
|---|---|
| Security | bcrypt cost ≥ 12. Constant-time current-password verify. No reveal of previous password hash in any response. |
| Performance | p95 < 400 ms (two bcrypt operations: verify + hash). |
| Atomicity | Hash update + session revocation + PIN revocation in a single transaction; failure → rollback. |
| Observability | Outcome (success / invalid_current / weak_new / same_as_current / 2fa_required / 2fa_invalid / rate_limited) logged. |

## 5. Acceptance criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC1 | Correct current password + valid new password + 2FA off | `POST /auth/password/change` | 200; password updated; other sessions revoked; PINs revoked; current refresh token rotated; cross-channel notice sent |
| AC2 | Wrong current password | Change | 401 `invalid_current_password`; F13 counter incremented |
| AC3 | New password fails policy ([F14](./F14-password-policy.md)) | Change | 400 with field-level error |
| AC4 | New password equals current | Change | 400 `new_password_same_as_current` |
| AC5 | 2FA enabled, missing TOTP | Change | 400 `totp_required` |
| AC6 | 2FA enabled, wrong TOTP | Change | 401 `invalid_2fa_code` |
| AC7 | Rate limit hit | Change | 429 with `Retry-After` |
| AC8 | After AC1 success, another open session refreshes | `/auth/refresh` | 401 `session_revoked` |
| AC9 | After AC1 success, any device tries PIN unlock | `/auth/pin/unlock` | 423 `pin_revoked` |

## 6. Design flow

Design: _pending_.

**Screens:** Profile → Security → "Change password" → form with current / new / confirm-new fields (and TOTP field if 2FA on) → submit → success toast + "You've been signed out of other devices". **States:** field-level errors, inline policy meter, 2fa-required, throttled.

## 7. Dependencies

| Relation | Target | Why |
|---|---|---|
| Depends on | [F14 Password Policy](./F14-password-policy.md) | Validates new password |
| Depends on | [F12 2FA](./F12-two-factor-authentication.md) | Adds TOTP gate when enabled |
| Triggers | [F05 Session Revocation](./F05-logout-and-session-revocation.md) | Revoke other sessions |
| Triggers | [F07 PIN Revocation](./F07-pin-quick-login.md) | Wipes device PINs |
| Triggers | [F15 Activity Alerts](./F15-suspicious-activity-alerts.md) | Cross-channel notice |
| Feeds | [F13 Lockout](./F13-account-lockout-and-unlock.md) | Wrong current password → counter |

## 8. Audit emissions

| Event | Fields | Sink |
|---|---|---|
| `auth.password.change_attempted` | `userId, ip, ua` | [M17](../M17-audit-and-compliance/README.md) |
| `auth.password.change_succeeded` | `userId, ip, sessionsRevoked, pinsRevoked` | M17 |
| `auth.password.change_failed` | `userId, ip, outcome` | M17 |

`outcome` ∈ `{invalid_current, weak_new, same_as_current, totp_required, invalid_2fa, rate_limited}`.

## 9. API surface

| Method | Path | Body | Responses |
|---|---|---|---|
| `POST` | `/api/v1/auth/password/change` | `{currentPassword, newPassword, totp?}` | 200 · 400 · 401 · 429 |

Full schemas in Swagger.

## 10. Open questions

- **OQ1** — Should we enforce a **password history** (cannot reuse last N) here, deferring the actual rule definition to [F14](./F14-password-policy.md)? Currently no history; revisit with F14.
- **OQ2** — On success, allow the user to keep all sessions if they tick "I trust all my devices"? Leaning **no** — defaults must be safe; sessions list ([F08](./F08-device-and-session-management.md)) lets them re-add devices intentionally.

## 11. Change history

- **2026-06-28** — Initial draft.
