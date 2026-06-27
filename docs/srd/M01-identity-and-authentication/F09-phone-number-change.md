# M01-F09 — Phone Number Change

| | |
|---|---|
| **Lifecycle** | `drafting` |
| **Design** | _pending_ |
| **Last updated** | 2026-06-28 |

## 1. Purpose

A signed-in user replaces the phone number on their account. Because phone is
the **primary login channel** ([F04](./F04-login.md)) and the recovery channel
([F06](./F06-password-recovery.md)), the change is high-risk and must:

1. Re-authenticate the user (fresh password, not PIN).
2. Verify the **new** number via OTP before the swap.
3. Notify the **old** number that a change is in progress (cancellation window).
4. Revoke all other sessions on success.

## 2. User stories

| As a | I want to | So that |
|---|---|---|
| User who changed SIM / carrier | update my phone on file | I can keep logging in |
| User whose phone was stolen | flag the change so I'm warned if it wasn't me | a thief can't quietly steal my account |
| Platform | bound how often phone can change | the field doesn't become a churn vector |

## 3. Functional requirements

| ID | Requirement | Status |
|---|---|---|
| R01 | Endpoint requires fresh password re-auth (≤ 5 min old); PIN ([F07](./F07-pin-quick-login.md)) is **not** sufficient | Drafting |
| R02 | Step 1 `POST /auth/phone-change/start {newPhone}` validates E.164 `+92XXXXXXXXXX`, uniqueness, issues OTP to **new** phone (TTL 10 min, hashed at rest) | Drafting |
| R03 | Step 1 also dispatches a notification to the **old** phone: "A phone change to +92••••3210 is pending — cancel: /auth/phone-change/cancel?token=…" | Drafting |
| R04 | Cancel link TTL = 24 h; clicking it cancels the pending change and locks further attempts for 1 h | Drafting |
| R05 | Step 2 `POST /auth/phone-change/confirm {code}` verifies the OTP; on success: atomic swap `User.PhoneNumber = newPhone`, `PhoneNumberConfirmed=true`, burn OTP, revoke all sessions except the current via [F05](./F05-logout-and-session-revocation.md) (`reason=phone_change`) | Drafting |
| R06 | New phone already in use → 409 `phone_already_registered`; no SMS sent (no enumeration leak beyond duplicate signal acceptable here because the user is authenticated) | Drafting |
| R07 | Max 3 phone changes per rolling 30 days per user; 4th → 429 `phone_change_quota` | Drafting |
| R08 | Per-IP rate limit on start; per-new-phone OTP cap shared with [F02](./F02-phone-otp-verification.md) | Drafting |
| R09 | After successful change, send a courtesy notification to email (if [F03](./F03-email-verification.md) verified) | Drafting |

## 4. Non-functional requirements

| Concern | Requirement |
|---|---|
| Security | OTP hashed (SHA-256 + pepper). Constant-time OTP verify. New phone E.164-validated server-side. |
| Performance | Start enqueue p95 < 100 ms; confirm p95 < 250 ms. |
| Privacy | Old-phone notification masks the new number (`+92••••3210`); old number is informed *that* a change is happening, not the destination in full. |
| i18n | OTP body, cancellation message, courtesy email localised `en` + `ur`. |
| Auditability | Both old and new `phoneHash` recorded on every event so the trail is complete. |

## 5. Acceptance criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC1 | Fresh-auth user supplies a valid, unused new phone | `POST /auth/phone-change/start` | 202; OTP queued to new phone; cancellation SMS sent to old phone |
| AC2 | New phone already on file | Start | 409 `phone_already_registered`; no SMS; no pending row |
| AC3 | Correct OTP within 10 min | `POST /auth/phone-change/confirm` | 200; `PhoneNumber` swapped; `PhoneNumberConfirmed=true`; **all other sessions revoked**; courtesy email sent (if verified email) |
| AC4 | OTP expired or wrong (5+ attempts within window) | Confirm | 410 `phone_change_token_invalid` / 401 `invalid_otp`; pending row remains until TTL or attempt cap |
| AC5 | User (or someone) clicks cancellation link on old phone | `GET /auth/phone-change/cancel?token=…` | 200; pending change cleared; new attempts blocked for 1 h |
| AC6 | User attempts to start without fresh re-auth | Start | 401 `reauth_required` |
| AC7 | 4th change within 30 days | Start | 429 `phone_change_quota` with `Retry-After` |

## 6. Design flow

Design: _pending_.

**Screens:** Profile → Account → "Change phone" → password re-auth prompt → enter new phone (E.164 input) → "We sent an OTP to +92… and a heads-up to your old number" → OTP entry → success ("Phone updated — sign in continues here, other devices have been signed out"). **States:** new-phone-taken, OTP-expired, quota-hit.

## 7. Dependencies

| Relation | Target | Why |
|---|---|---|
| Depends on | [F02 Phone OTP](./F02-phone-otp-verification.md) | OTP infrastructure |
| Depends on | [F10 Email](./F10-email-add-change-remove.md) (soft) | Courtesy email |
| Depends on | [F05 Session Revocation](./F05-logout-and-session-revocation.md) | Revoke other sessions |
| Triggered re-auth check | [F04 Login](./F04-login.md) | Establishes the 5-min auth freshness clock |
| Out of scope | Owner-forced phone change of another team member | Lives in [M16](../M16-team-and-access/README.md) |

## 8. Audit emissions

| Event | Fields | Sink |
|---|---|---|
| `auth.phone_change.started` | `userId, oldPhoneHash, newPhoneHash, ip, ua` | [M17](../M17-audit-and-compliance/README.md) |
| `auth.phone_change.cancelled` | `userId, oldPhoneHash, newPhoneHash, source` | M17 |
| `auth.phone_change.confirmed` | `userId, oldPhoneHash, newPhoneHash, sessionsRevoked` | M17 |
| `auth.phone_change.failed` | `userId, newPhoneHash, ip, outcome` | M17 |
| `auth.phone_change.quota_exceeded` | `userId, ip` | M17 |

`source` ∈ `{user, old_phone_link, system_timeout}`. `outcome` ∈ `{invalid_otp, expired, duplicate}`.

## 9. API surface

| Method | Path | Body / Params | Responses |
|---|---|---|---|
| `POST` | `/api/v1/auth/phone-change/start` | `{newPhone}` | 202 · 400 · 401 (`reauth_required`) · 409 · 429 |
| `POST` | `/api/v1/auth/phone-change/confirm` | `{code}` | 200 · 401 (`invalid_otp`) · 410 |
| `GET` | `/api/v1/auth/phone-change/cancel` | `?token=<string>` | 200 · 410 |

Full schemas in Swagger.

## 10. Open questions

- **OQ1** — Should we require both old-OTP **and** new-OTP (double confirmation) for higher-risk accounts? Currently single-OTP-to-new + old-phone cancellation link is the v1 plan.
- **OQ2** — Cancellation lock duration after click — 1 h is conservative; should it be 24 h to give the legitimate owner time to investigate?

## 11. Change history

- **2026-06-28** — Initial draft.
