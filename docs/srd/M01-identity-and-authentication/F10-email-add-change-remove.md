# M01-F10 — Email Add / Change / Remove

| | |
|---|---|
| **Lifecycle** | `drafting` |
| **Design** | _pending_ |
| **Last updated** | 2026-06-28 |

## 1. Purpose

A signed-in user manages the **optional** email address on their account:
**add** an email where there was none, **change** to a different email, or
**remove** the email entirely. Email enables an alternative login channel
([F04](./F04-login.md)) and a recovery channel ([F06](./F06-password-recovery.md)),
so every state change re-runs verification ([F03](./F03-email-verification.md))
and notifies the old address. Because phone remains the primary channel,
removing the email is permitted at any time (phone-only accounts are a valid state).

## 2. User stories

| As a | I want to | So that |
|---|---|---|
| User who skipped email at signup | add an email later | I gain email login + recovery |
| User who left a company | change to a personal email | I keep account ownership |
| Privacy-conscious user | remove the email I added | I revert to phone-only |
| User whose email was compromised | be notified at the old address when it changes | I notice an unauthorised change |

## 3. Functional requirements

| ID | Requirement | Status |
|---|---|---|
| R01 | All endpoints require fresh password re-auth (≤ 5 min); PIN not sufficient | Drafting |
| R02 | **Add** `POST /auth/email/add {email}` — only when no email on file; validates format + global uniqueness; issues verification link via [F03](./F03-email-verification.md) (`purpose=email-add`); email stays `EmailConfirmed=false` until link clicked | Drafting |
| R03 | **Change** `POST /auth/email/change {newEmail}` — only when an email exists; same validation; queues link to **new** email with `purpose=email-change`; existing email stays active until new is verified (no auth-loss window) | Drafting |
| R04 | On successful change verification, atomically swap to new email, mark `EmailConfirmed=true`, invalidate any pending tokens on the old address, **revoke other sessions** ([F05](./F05-logout-and-session-revocation.md), `reason=email_change`), notify the **old** address (courtesy email) | Drafting |
| R05 | **Remove** `POST /auth/email/remove` — clears email, sets `EmailConfirmed=false`, kills any pending change, sends a courtesy notice to the removed address, **revokes other sessions** | Drafting |
| R06 | Duplicate email at add/change time → 409 `email_already_registered` | Drafting |
| R07 | Max 3 email changes per rolling 30 days; 4th → 429 `email_change_quota` | Drafting |
| R08 | Remove is allowed regardless of 2FA-via-email state because 2FA in M01 is TOTP-only ([F12](./F12-two-factor-authentication.md)); revisit if email-2FA is ever added | Drafting |
| R09 | Per-IP rate limit on add/change/remove; per-email cooldown shared with [F03](./F03-email-verification.md) | Drafting |

## 4. Non-functional requirements

| Concern | Requirement |
|---|---|
| Security | Email format validated server-side; case-folded; verification token rules per [F03](./F03-email-verification.md). |
| Continuity | During change, both old and new remain query-able as identifiers, but only the verified one is a login channel. Prevents lock-out if user mistypes new email. |
| Privacy | Courtesy notices reveal only that a change/removal occurred, not the new address. |
| i18n | Verification + courtesy emails localised `en` + `ur`. |
| Performance | Add/change/remove p95 < 250 ms. |

## 5. Acceptance criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC1 | Fresh-auth user, no email on file, new email available | `POST /auth/email/add` | 202; verification link queued; SPA shows "Check inbox" |
| AC2 | User clicks valid verify link (`purpose=email-add`) | F03 confirm | `EmailConfirmed=true`; email login unlocked |
| AC3 | Fresh-auth user with existing email, new available email | `POST /auth/email/change` | 202; new-email verification queued; **old email still active** as login + recovery |
| AC4 | Valid change link clicked | F03 confirm | Atomic swap; courtesy email to old address; other sessions revoked; `EmailConfirmed=true` |
| AC5 | Email already on file (any user) | Add or change | 409 `email_already_registered`; no email sent |
| AC6 | Fresh-auth user, email exists | `POST /auth/email/remove` | 200; email cleared; `EmailConfirmed=false`; pending change tokens invalidated; courtesy email sent; other sessions revoked |
| AC7 | Endpoint called without re-auth | Any | 401 `reauth_required` |
| AC8 | 4th change within 30 days | Change | 429 `email_change_quota` |
| AC9 | Pending change exists; user calls change again with a different new email | Change | 202; old pending tokens invalidated; new tokens queued |

## 6. Design flow

Design: _pending_.

**Screens:** Profile → Account → Email row with state-aware CTA (Add / Change / Remove) → password re-auth → email entry (for add/change) or confirm dialog (for remove) → "Check inbox" success or "Email removed" toast.

## 7. Dependencies

| Relation | Target | Why |
|---|---|---|
| Depends on | [F03 Email Verification](./F03-email-verification.md) | Reuses link-token flow |
| Depends on | [F04 Login](./F04-login.md) | Fresh-auth gate |
| Depends on | [F05 Session Revocation](./F05-logout-and-session-revocation.md) | Revoke other sessions on commit |
| Depends on | [M10-F03 Notification Channels](../../MODULES.md#m10-f03--notification-channels) | SMTP for verify + courtesy mail |
| Out of scope | Owner-managed email of team members | Lives in [M16](../M16-team-and-access/README.md) |

## 8. Audit emissions

| Event | Fields | Sink |
|---|---|---|
| `auth.email.add_started` | `userId, newEmailHash, ip` | [M17](../M17-audit-and-compliance/README.md) |
| `auth.email.change_started` | `userId, oldEmailHash, newEmailHash, ip` | M17 |
| `auth.email.change_completed` | `userId, oldEmailHash, newEmailHash, sessionsRevoked` | M17 |
| `auth.email.removed` | `userId, removedEmailHash, sessionsRevoked` | M17 |
| `auth.email.change_failed` | `userId?, ip, outcome` | M17 |

`outcome` ∈ `{duplicate, invalid_format, quota, reauth_required}`.

## 9. API surface

| Method | Path | Body | Responses |
|---|---|---|---|
| `POST` | `/api/v1/auth/email/add` | `{email}` | 202 · 400 · 401 (`reauth_required`) · 409 · 429 |
| `POST` | `/api/v1/auth/email/change` | `{newEmail}` | 202 · 400 · 401 · 409 · 429 |
| `POST` | `/api/v1/auth/email/remove` | _none_ | 200 · 401 |

Verification (`GET /auth/verify-email`) lives in [F03](./F03-email-verification.md).
Full schemas in Swagger.

## 10. Open questions

- **OQ1** — On remove, do we keep `removedEmailHash` on the user row (a one-slot history) so suspicious-activity rules can detect "remove + immediate add of different email"? Leaning yes — minor cost, useful signal.
- **OQ2** — Should change require *also* an OTP to the current phone, given email is a recovery channel? Trade-off: extra friction vs. defence-in-depth. Currently only fresh-password is required.

## 11. Change history

- **2026-06-28** — Initial draft.
