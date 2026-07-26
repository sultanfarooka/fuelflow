# M01-F05 — Logout & Session Revocation

| | |
|---|---|
| **Lifecycle** | `drafting` |
| **Design** | _pending_ |
| **Last updated** | 2026-06-27 |

## 1. Purpose

A signed-in user ends their current session ("Sign out") or kills any other
active session from the device & session list ([F08](./F08-device-and-session-management.md)).
Logout must be **server-authoritative** — clearing cookies alone is not enough —
so a stolen refresh token cannot be reused after the user has signed out.

## 2. User stories

| As a | I want to | So that |
|---|---|---|
| Signed-in user | tap "Sign out" and be back at the login screen | nobody can use my device after me |
| User who lost a phone | revoke that specific session from another device | the lost device can no longer talk to the API |
| User changing password ([F11](./F11-password-change.md)) | have all other sessions revoked automatically | if a session was compromised, it's killed |
| Platform | guarantee a revoked refresh token can never re-issue an access token | stolen tokens have a hard expiry |

## 3. Functional requirements

| ID | Requirement | Status |
|---|---|---|
| R01 | `POST /auth/logout` revokes the current session (refresh-token jti blacklisted; row marked `RevokedAt`) | Drafting |
| R02 | Logout response clears both access + refresh cookies (`Set-Cookie` with `Max-Age=0`) | Drafting |
| R03 | Logout is **idempotent** — already-revoked / missing session → 204, never 401 | Drafting |
| R04 | `POST /auth/sessions/{id}/revoke` revokes a specific session belonging to the caller | Drafting |
| R05 | `POST /auth/sessions/revoke-all` revokes every session except the caller's current one | Drafting |
| R06 | Password change ([F11](./F11-password-change.md)) auto-triggers revoke-all-other-sessions | Drafting |
| R07 | Phone change ([F09](./F09-phone-number-change.md)) and 2FA reset ([F12](./F12-two-factor-authentication.md)) likewise revoke other sessions | Drafting |
| R08 | Revoked refresh token → refresh endpoint returns 401 `session_revoked`, even if access token still valid until natural expiry (≤ 15 min) | Drafting |
| R09 | Trying to revoke another user's session → 404 (not 403, to avoid leaking session ids) | Drafting |

## 4. Non-functional requirements

| Concern | Requirement |
|---|---|
| Security | Server-side revocation list (`RefreshTokens.RevokedAt`) is authoritative. Access tokens remain valid until natural TTL — keep TTL ≤ 15 min so revocation propagates quickly. |
| Performance | p95 < 100 ms for single-session logout; < 300 ms for revoke-all on ≤ 50 sessions. |
| Idempotency | Repeated logout of the same session is a no-op. |
| Observability | Each revoke logs reason (user, password_change, phone_change, admin, …) and session count revoked. |

## 5. Acceptance criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC1 | Signed-in user | `POST /auth/logout` | 204, cookies cleared, refresh-token row `RevokedAt` set, SPA redirects to `/login` |
| AC2 | User logged out, then attempts to refresh with old cookie | `POST /auth/refresh` | 401 `session_revoked` |
| AC3 | Logout called twice | Second call | 204 (idempotent) |
| AC4 | Two active sessions; user revokes session B from session A | `POST /auth/sessions/{B}/revoke` | 204, session A still works, session B refresh → 401 |
| AC5 | User calls `revoke-all` from session A | endpoint | 204, every other session revoked, A still works |
| AC6 | User attempts to revoke a session id not on their account | endpoint | 404 (no leak) |
| AC7 | User changes password ([F11](./F11-password-change.md)) | password-change handler | All other sessions automatically revoked; current session re-issued |

## 6. Design flow

Design: _pending_.

**Screens:** Profile menu → "Sign out" (immediate) and Sessions list (per [F08](./F08-device-and-session-management.md)) → per-row "Revoke" + "Sign out everywhere else".

## 7. Dependencies

| Relation | Target | Why |
|---|---|---|
| Depends on | [F08 Sessions](./F08-device-and-session-management.md) | Owns the session list UI + listing endpoint |
| Used by | [F11 Password Change](./F11-password-change.md) | Triggers revoke-all-other |
| Used by | [F09 Phone Change](./F09-phone-number-change.md) | Triggers revoke-all-other |
| Used by | [F12 2FA](./F12-two-factor-authentication.md) | Triggers revoke-all-other on disable/reset |
| Out of scope | Forced sign-out by an Owner of another team member | Lives in [M16](../M16-team-and-access/README.md) |

## 8. Audit emissions

| Event | Fields | Sink |
|---|---|---|
| `auth.session.logged_out` | `userId, sessionId, ip, reason=user` | [M17](../M17-audit-and-compliance/README.md) |
| `auth.session.revoked` | `userId, sessionId, ip, reason` | M17 |
| `auth.session.revoke_all` | `userId, ip, sessionsRevoked, reason` | M17 |

`reason` ∈ `{user, password_change, phone_change, 2fa_reset, suspicious_activity, admin}`.

## 9. API surface

| Method | Path | Body | Responses |
|---|---|---|---|
| `POST` | `/api/v1/auth/logout` | _none_ | 204 |
| `POST` | `/api/v1/auth/sessions/{sessionId}/revoke` | _none_ | 204 · 404 |
| `POST` | `/api/v1/auth/sessions/revoke-all` | _none_ | 204 |

Full schemas in Swagger.

## 10. Open questions

- **OQ1** — On revoke-all from suspicious-activity ([F15](./F15-suspicious-activity-alerts.md)), do we *also* invalidate access tokens (e.g. by bumping a `sessionVersion` claim)? This adds a per-request DB read; current default is "no, accept the ≤15 min window". Confirm acceptable.

## 11. Change history

- **2026-06-27** — Initial draft.
