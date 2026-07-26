# M01-F13 — Account Lockout & Unlock

| | |
|---|---|
| **Lifecycle** | `drafting` |
| **Design** | _pending_ |
| **Last updated** | 2026-06-28 |

## 1. Purpose

Defends accounts against online password / OTP / TOTP brute-force by counting
failed credential attempts and **temporarily disabling** the account after
a threshold. Lockout is a per-account state; it short-circuits
[F04 Login](./F04-login.md) with a `423 account_locked` before bcrypt is even
attempted, killing the brute-force economics. Unlock paths: time-based
(automatic), self-service via [F06 Password Recovery](./F06-password-recovery.md)
(does **not** clear the lock; it just lets the user prove ownership for the
next attempt), or Owner-initiated unlock via [M16](../M16-team-and-access/README.md).

## 2. User stories

| As a | I want to | So that |
|---|---|---|
| Attacker | be slowed down then stopped | brute-force is uneconomical |
| Legitimate user with a fat-fingered password | wait a short cooldown or recover | I'm not permanently locked |
| Owner | unlock a team member who genuinely forgot | the org isn't paralysed by a 30-min wait |
| Platform | recognise distributed brute-force across IPs | one IP-rate-limit alone isn't enough |

## 3. Functional requirements

| ID | Requirement | Status |
|---|---|---|
| R01 | Counter incremented on: wrong password ([F04](./F04-login.md), [F11](./F11-password-change.md)), wrong OTP ([F02](./F02-phone-otp-verification.md)), wrong TOTP / recovery ([F12](./F12-two-factor-authentication.md)), wrong PIN ([F07](./F07-pin-quick-login.md) — separate sub-counter) | Drafting |
| R02 | Counter reset on **any** successful authentication for that account | Drafting |
| R03 | Threshold: **5 consecutive failures within 15 minutes** → status `Locked`; lock TTL **30 minutes** (configurable) | Drafting |
| R04 | Subsequent failures during lock do **not** extend it (no infinite-lock vector) | Drafting |
| R05 | Lock auto-clears at TTL expiry; first attempt after expiry is treated as a fresh attempt (counter back to 0) | Drafting |
| R06 | While locked: 423 `account_locked` with `Retry-After` seconds; no credential check performed; no F15 alerts spammed (one alert per lock event) | Drafting |
| R07 | Successful password reset ([F06](./F06-password-recovery.md)) does **not** clear the lock — but updating the password may render the brute-force moot. Doc this in UI: "Account is locked until HH:MM, your new password is ready for use after that." | Drafting |
| R08 | Owner-initiated unlock via [M16](../M16-team-and-access/README.md) clears the lock immediately and audits with `actorUserId` | Drafting |
| R09 | A separate **escalation** rule fires at 20 failures across **any** sliding-30-day window → status `EscalatedLock`, only Owner can unlock, F15 critical alert emitted | Drafting |
| R10 | Per-IP sliding-window rate limit on the login endpoint stays in effect *in addition to* account lockout (defence-in-depth for distributed attacks) | Drafting |

## 4. Non-functional requirements

| Concern | Requirement |
|---|---|
| Security | Lock status check is the **first** branch in the login handler, before bcrypt — denies attackers the ability to use the endpoint as a hash oracle. |
| Performance | Lock check < 5 ms (single PK read). |
| Storage | Counter + lockedUntil + escalationCount on `AspNetUsers` row (existing Identity columns repurposed where possible). |
| Privacy | 423 response includes `Retry-After` only; no exact failure count revealed. |
| Observability | Each lock + unlock + escalation emitted; daily Serilog summary of lock counts per org. |

## 5. Acceptance criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC1 | Account with 4 prior fails | 5th wrong password within 15 min | Account locked; response 423 with `Retry-After=1800`; F15 alert "Account locked" emitted once |
| AC2 | Locked account | Any login attempt within TTL | 423 `account_locked`; no bcrypt invoked; F15 not re-alerted |
| AC3 | Locked account | 30 min has elapsed; user submits correct password | 200, success, counter reset to 0 |
| AC4 | Locked account | User completes F06 password reset | Password updated; lock remains until TTL; SPA shows "Locked until HH:MM" message |
| AC5 | User racks up 20 failures across 30 days (e.g. 5 fails / day for 4 separate locks) | The 4th lock | Status `EscalatedLock`; only Owner unlock clears it; F15 **critical** alert |
| AC6 | Owner clicks "Unlock" in M16 team UI | Owner action | Lock cleared; counter reset; audit row with `reason=admin_unlock, actorUserId=…` |
| AC7 | Per-IP rate limit hit before lock threshold | Login | 429 with `Retry-After`; lockout counter **not** incremented (prevents amplification from IP throttling) |

## 6. Design flow

Design: _pending_.

**Surfaces:** Login screen shows lock state ("Account locked. Try again at 14:32."); F06 form shows "Lock remains until 14:32 — new password is ready after that." Team UI ([M16](../M16-team-and-access/README.md)) shows lock badge + "Unlock now" for Owners.

## 7. Dependencies

| Relation | Target | Why |
|---|---|---|
| Feeds from | [F04 Login](./F04-login.md), [F02 Phone OTP](./F02-phone-otp-verification.md), [F07 PIN](./F07-pin-quick-login.md), [F11 Password Change](./F11-password-change.md), [F12 2FA](./F12-two-factor-authentication.md) | Counter source |
| Used by | [F06 Password Recovery](./F06-password-recovery.md) | Surface lock state in UI; reset does not unlock |
| Used by | [M16 Team & Access](../M16-team-and-access/README.md) | Owner unlock action |
| Triggers | [F15 Suspicious Activity](./F15-suspicious-activity-alerts.md) | Lock event + escalation |
| Out of scope | CAPTCHA / proof-of-work challenges before lock | Future hardening |

## 8. Audit emissions

| Event | Fields | Sink |
|---|---|---|
| `auth.lockout.fail_counted` | `userId, ip, source, consecutiveFails` | [M17](../M17-audit-and-compliance/README.md) |
| `auth.lockout.locked` | `userId, ip, lockTtlSec, escalationCount` | M17 |
| `auth.lockout.escalated` | `userId, escalationCount` | M17 |
| `auth.lockout.unlocked` | `userId, reason, actorUserId?` | M17 |

`source` ∈ `{login_password, otp, totp, recovery_code, pin, password_change_current}`. `reason` ∈ `{ttl_expired, admin_unlock}`.

## 9. API surface

Lockout is **state**, not endpoints — surfaced through 423 responses on existing
endpoints. The Owner-side **unlock action** lives in [M16](../M16-team-and-access/README.md)'s
team-management API and is not part of M01.

| Method | Path | Body | Responses |
|---|---|---|---|
| _(any auth endpoint while locked)_ | _(varies)_ | _(varies)_ | 423 (`account_locked`, `Retry-After` header) |

## 10. Open questions

- **OQ1** — Should escalation thresholds be **per-org** configurable (an Owner with a security-conscious org may want 10 not 20)? Currently global default; configurable hooks deferred to M16.
- **OQ2** — When the same identifier is hit from many IPs (distributed brute-force), should we widen the lock to include "any login from any IP" or specifically block the *successful* IP too? Currently account-wide lock; that's correct because the attack is identifier-targeted.

## 11. Change history

- **2026-06-28** — Initial draft.
