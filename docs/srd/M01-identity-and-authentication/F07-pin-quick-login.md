# M01-F07 — PIN Quick Login

| | |
|---|---|
| **Lifecycle** | `drafting` |
| **Design** | _pending_ |
| **Last updated** | 2026-06-27 |

## 1. Purpose

On a **trusted device** (one the user has signed into with full password at least
once), a user can opt-in to unlock subsequent sessions with a short 4–6 digit PIN
instead of re-typing the full password. PIN never replaces the password
universally — it's a per-device convenience that returns to a full password
prompt after too many failures, too long an idle period, or any
sensitive-action gate ([F11](./F11-password-change.md), [F12](./F12-two-factor-authentication.md), [F09](./F09-phone-number-change.md)).

Targeted at attendants and cashiers ([M16](../M16-team-and-access/README.md)) on
shared station tablets, where typing a long password between shifts is friction.

## 2. User stories

| As a | I want to | So that |
|---|---|---|
| Cashier | unlock the till tablet with a 4-digit PIN | shift handover is fast |
| Owner | turn PIN login off globally for my team | I can enforce a stricter policy |
| User who forgot their PIN | fall back to a full password login | a forgotten PIN doesn't lock me out |
| Platform | rate-limit PIN attempts hard | a 4-digit PIN isn't brute-forceable |

## 3. Functional requirements

| ID | Requirement | Status |
|---|---|---|
| R01 | PIN setup requires a fresh password re-auth (≤ 5 min old) and is a per-device opt-in | Drafting |
| R02 | PIN length 4–6 digits, numeric only; forbidden patterns: all same (`0000`), sequential (`1234`, `4321`), birth year if known | Drafting |
| R03 | PIN stored as bcrypt hash (cost ≥ 12) **plus** device-bound salt (random ≥ 16 bytes per device) — hash is useless if exfiltrated to another device | Drafting |
| R04 | PIN unlock is **device-scoped** — a PIN set on device A does not unlock device B | Drafting |
| R05 | PIN unlock issues a fresh access token + rotates the refresh token; session remains the same row | Drafting |
| R06 | 5 wrong PINs in a row → device PIN is revoked; user must use full password to re-enable PIN | Drafting |
| R07 | After 7 days of inactivity on a device → PIN unlock disabled; full password required on next open | Drafting |
| R08 | Any of these **invalidate PIN on every device**: password change ([F11](./F11-password-change.md)), 2FA enable/disable ([F12](./F12-two-factor-authentication.md)), forced reset, suspicious-activity escalation ([F15](./F15-suspicious-activity-alerts.md)) | Drafting |
| R09 | Sensitive actions never accept PIN as re-auth: changing password, phone, email, 2FA, or sessions | Drafting |
| R10 | Owner can disable PIN login org-wide via a setting in [M16](../M16-team-and-access/README.md); when disabled, all PINs are revoked | Drafting |
| R11 | PIN feature toggled per-tenant by feature gate — default ON | Drafting |

## 4. Non-functional requirements

| Concern | Requirement |
|---|---|
| Security | Device-bound salt prevents replay if hash leaked. PIN attempts use exponential back-off after 3 failures (1s → 5s → 30s). |
| Performance | PIN unlock p95 < 150 ms incl. bcrypt. |
| Storage | PIN hash + salt stored against `Session.DeviceId`, not against `User`; revoking device wipes PIN. |
| Accessibility | Large-touch numeric keypad; haptic feedback on failure; voice-over reads "PIN entry, 4 of 6". |
| i18n | Numeric only — locale-agnostic; surrounding strings localised `en` + `ur`. |

## 5. Acceptance criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC1 | Logged-in user on device A re-auths password ≤ 5 min ago | `POST /auth/pin/setup {pin}` | 201; PIN hash + salt stored on device A's session row |
| AC2 | Correct PIN within attempt limit | `POST /auth/pin/unlock {deviceId, pin}` | 200; new access token + rotated refresh token; back-off counter reset |
| AC3 | Wrong PIN | Unlock | 401 `invalid_pin`; counter incremented; back-off applied |
| AC4 | 5 wrong PINs in a row | Unlock | 423 `pin_revoked`; PIN deleted; user must log in with password |
| AC5 | Device inactive ≥ 7 days | Open app | PIN screen not shown; full login screen instead |
| AC6 | User changes password on any device | Password-change handler | All device PINs revoked; SPA returns to full-login on next open |
| AC7 | User tries to use PIN to confirm a password change | UI | UI does not offer PIN as re-auth; password prompt only |
| AC8 | Owner disables PIN org-wide | M16 setting toggle | Every active PIN revoked; next open requires password |
| AC9 | PIN set to `1234` | Setup | 400 `pin_forbidden_pattern` |
| AC10 | User attempts setup without re-auth | Setup | 401 `reauth_required` |

## 6. Design flow

Design: _pending_.

**Screens:** Profile → "Enable quick PIN" → password re-auth → PIN entry → confirm PIN → success. **Daily unlock:** PIN keypad with avatar + name → success goes to home. **States:** wrong-PIN with countdown, PIN-revoked banner with "Sign in with password" CTA.

## 7. Dependencies

| Relation | Target | Why |
|---|---|---|
| Depends on | [F04 Login](./F04-login.md) | First-time password login bootstraps the device session |
| Depends on | [F08 Sessions](./F08-device-and-session-management.md) | PIN hash + salt live on the session row |
| Triggered by | [F11 Password Change](./F11-password-change.md) | Revokes all PINs |
| Triggered by | [F12 2FA](./F12-two-factor-authentication.md) | Revokes all PINs on enable/disable |
| Triggered by | [F15 Suspicious Activity](./F15-suspicious-activity-alerts.md) | Revokes all PINs on critical escalation |
| Configured by | [M16 Team & Access](../M16-team-and-access/README.md) | Org-wide enable/disable |
| Out of scope | Biometric unlock (Touch / Face ID) | Future feature; not in M01 |

## 8. Audit emissions

| Event | Fields | Sink |
|---|---|---|
| `auth.pin.setup` | `userId, sessionId, deviceId, ip` | [M17](../M17-audit-and-compliance/README.md) |
| `auth.pin.unlock_succeeded` | `userId, sessionId, deviceId, ip` | M17 |
| `auth.pin.unlock_failed` | `userId, sessionId, deviceId, ip, consecutiveFails` | M17 |
| `auth.pin.revoked` | `userId, sessionId, deviceId, reason` | M17 |
| `auth.pin.org_disabled` | `orgId, actorUserId, pinsRevoked` | M17 |

`reason` ∈ `{too_many_fails, inactivity, password_change, 2fa_change, forced_reset, suspicious_activity, org_disabled, user}`.

## 9. API surface

| Method | Path | Body | Responses |
|---|---|---|---|
| `POST` | `/api/v1/auth/pin/setup` | `{pin}` | 201 · 400 (`pin_forbidden_pattern`) · 401 (`reauth_required`) |
| `POST` | `/api/v1/auth/pin/unlock` | `{deviceId, pin}` | 200 · 401 · 423 (`pin_revoked`) · 429 |
| `DELETE` | `/api/v1/auth/pin` | _none_ | 204 |

Full schemas in Swagger.

## 10. Open questions

- **OQ1** — Should PIN be allowed only for Cashier / Attendant roles ([M16](../M16-team-and-access/README.md)), or also for Owner / Manager? Leaning "available to all roles but org policy can restrict per role".
- **OQ2** — On 7-day inactivity expiry, do we keep the PIN hash (for instant re-enable after fresh password login) or wipe it? Leaning wipe — simpler audit story.

## 11. Change history

- **2026-06-27** — Initial draft.
