# M01-F12 — Two-Factor Authentication (TOTP)

| | |
|---|---|
| **Lifecycle** | `drafting` |
| **Design** | _pending_ |
| **Last updated** | 2026-06-28 |

## 1. Purpose

A user adds a **TOTP authenticator** (Google Authenticator, Authy, 1Password,
etc.) as a second factor. Once enabled, [F04 Login](./F04-login.md) requires
a 6-digit code after correct password. The user is issued **recovery codes**
to break the glass if they lose the authenticator. SMS-based 2FA is **not**
offered in M01 (SMS is the primary identifier; reusing it for 2FA gives no
defence-in-depth against SIM-swap).

## 2. User stories

| As a | I want to | So that |
|---|---|---|
| Security-conscious owner | enable TOTP 2FA on my account | a stolen password isn't enough |
| User who lost their authenticator | use a recovery code to get back in | I'm not permanently locked out |
| User upgrading phones | re-enrol the authenticator app | 2FA continues working |
| Owner | require 2FA for all Owner / Manager users in my org | I can enforce a stricter policy |

## 3. Functional requirements

| ID | Requirement | Status |
|---|---|---|
| R01 | `POST /auth/2fa/setup/start` requires fresh password re-auth (≤ 5 min); returns `{secret, otpauthUri, qrSvg}` — secret is base32, 160 bits, generated server-side; **not** persisted until enrolment confirms | Drafting |
| R02 | `POST /auth/2fa/setup/confirm {code}` verifies a TOTP code from the in-flight secret; on success, persists hashed secret on user row, marks `TwoFactorEnabled=true`, generates **10 single-use recovery codes** (16 chars each, base32) returned **once** | Drafting |
| R03 | Recovery codes stored hashed (SHA-256 + pepper); never retrievable again — only regen-able | Drafting |
| R04 | Login flow ([F04](./F04-login.md)) accepts either a current 6-digit TOTP **or** an unused recovery code in the `code` field; recovery use burns the code | Drafting |
| R05 | TOTP uses RFC-6238: SHA-1 default, 30-second period, 6-digit code, ±1 step skew tolerance | Drafting |
| R06 | `POST /auth/2fa/recovery/regenerate` (requires fresh password + current TOTP) invalidates all old codes, returns 10 fresh codes once | Drafting |
| R07 | `POST /auth/2fa/disable` (requires fresh password + current TOTP **or** recovery code) clears secret + recovery codes, flips `TwoFactorEnabled=false`, **revokes all other sessions** ([F05](./F05-logout-and-session-revocation.md), `reason=2fa_reset`), **revokes all PINs** ([F07](./F07-pin-quick-login.md)) | Drafting |
| R08 | Enable also revokes other sessions + PINs (same reasoning — co-sessions started without 2FA in effect should not survive) | Drafting |
| R09 | Org-level policy (configured in [M16](../M16-team-and-access/README.md)) can **require** 2FA for any role; user without 2FA on a required role is forced into setup after next login | Drafting |
| R10 | Per-user rate limit: 10 TOTP attempts / 10 min on login; 5 attempts / 10 min on enable/disable; further → 429 | Drafting |

## 4. Non-functional requirements

| Concern | Requirement |
|---|---|
| Security | Secret hashed at rest (AES-256-GCM column-encrypted; key in user-secrets / KMS). Recovery codes hashed. QR served as inline SVG, never persisted. |
| Performance | TOTP verify p95 < 50 ms. Setup endpoints p95 < 250 ms. |
| Usability | QR code on setup page; tap-to-copy secret as fallback. Recovery-code page has copy + download as `.txt`. |
| Accessibility | Recovery codes presented in monospace with copy buttons; setup page reads QR alt-text with manual instructions. |
| i18n | All strings localised `en` + `ur`. Authenticator label = `Fuel Flow (<phone or email>)`. |

## 5. Acceptance criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC1 | Fresh-auth user starts setup | `POST /auth/2fa/setup/start` | 200 with `{secret, otpauthUri, qrSvg}`; **no DB write** yet |
| AC2 | User scans QR and submits a valid TOTP within 5 min | `POST /auth/2fa/setup/confirm` | 200 with `{recoveryCodes:[...10]}`; `TwoFactorEnabled=true`; other sessions + PINs revoked |
| AC3 | Setup-confirm with wrong TOTP | Confirm | 401 `invalid_2fa_code`; no state change |
| AC4 | Login step-2 with correct TOTP | `POST /auth/login/2fa` | 200 with full auth cookies |
| AC5 | Login step-2 with valid recovery code | Same endpoint | 200; code burnt (one fewer in pool); user reminded "X codes remaining" |
| AC6 | Login step-2 with used recovery code | Endpoint | 401 `invalid_2fa_code` |
| AC7 | User regenerates recovery codes | `POST /auth/2fa/recovery/regenerate` | 200 with 10 new codes; old codes invalidated atomically |
| AC8 | Disable with correct factors | `POST /auth/2fa/disable` | 200; `TwoFactorEnabled=false`; recovery codes purged; other sessions + PINs revoked |
| AC9 | Org policy requires 2FA for Owner; user has none | Next login | 200 `{tcAcceptanceRequired:false, twoFactorRequired:false, setupRequired:true}`; SPA forces setup before any other route |

## 6. Design flow

Design: _pending_.

**Screens:** Security → "Enable 2FA" → password re-auth → QR + secret + verify code → recovery codes page (one-time) → "2FA enabled" banner. **Login add-on:** step-2 code entry with "Use a recovery code instead" link. **Disable:** password re-auth + current code → confirm dialog.

## 7. Dependencies

| Relation | Target | Why |
|---|---|---|
| Used by | [F04 Login](./F04-login.md) | Step-up second factor |
| Used by | [F11 Password Change](./F11-password-change.md) | Requires TOTP when enabled |
| Used by | [F09 Phone Change](./F09-phone-number-change.md) | Future: may add TOTP gate |
| Triggers | [F05 Revocation](./F05-logout-and-session-revocation.md) | On enable / disable / regenerate |
| Triggers | [F07 PIN](./F07-pin-quick-login.md) | Revoke PINs on enable / disable |
| Configured by | [M16 Team & Access](../M16-team-and-access/README.md) | Per-role enforcement |
| Out of scope | SMS / email 2FA, hardware WebAuthn keys | Future; SMS specifically rejected for SIM-swap risk |

## 8. Audit emissions

| Event | Fields | Sink |
|---|---|---|
| `auth.2fa.setup_started` | `userId, ip, ua` | [M17](../M17-audit-and-compliance/README.md) |
| `auth.2fa.enabled` | `userId, ip, sessionsRevoked, pinsRevoked` | M17 |
| `auth.2fa.disabled` | `userId, ip, sessionsRevoked, pinsRevoked, factor` | M17 |
| `auth.2fa.recovery_used` | `userId, ip, remaining` | M17 |
| `auth.2fa.recovery_regenerated` | `userId, ip` | M17 |
| `auth.2fa.code_failed` | `userId, ip, context, consecutiveFails` | M17 |

`factor` ∈ `{totp, recovery}`. `context` ∈ `{login, setup, disable, change_password}`.

## 9. API surface

| Method | Path | Body | Responses |
|---|---|---|---|
| `POST` | `/api/v1/auth/2fa/setup/start` | _none_ | 200 (`{secret, otpauthUri, qrSvg}`) · 401 (`reauth_required`) |
| `POST` | `/api/v1/auth/2fa/setup/confirm` | `{code}` | 200 (`{recoveryCodes:[...10]}`) · 401 (`invalid_2fa_code`) |
| `POST` | `/api/v1/auth/2fa/recovery/regenerate` | `{currentPassword, code}` | 200 (`{recoveryCodes:[...10]}`) · 401 |
| `POST` | `/api/v1/auth/2fa/disable` | `{currentPassword, code}` | 200 · 401 |
| `POST` | `/api/v1/auth/login/2fa` *(defined in [F04](./F04-login.md))* | `{twoFactorToken, code}` | 200 · 401 · 410 |

Full schemas in Swagger.

## 10. Open questions

- **OQ1** — Recovery code count: 10 vs 16. 10 matches GitHub / Google defaults; 16 lowers regen rate. Leaning 10.
- **OQ2** — Should we offer **backup TOTP secret printout** at setup (so the user can restore in another app) instead of relying on recovery codes? Currently no — adds confusion; recovery codes are the standard pattern.

## 11. Change history

- **2026-06-28** — Initial draft.
