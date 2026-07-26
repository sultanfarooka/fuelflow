# M01-F08 — Device & Session Management

| | |
|---|---|
| **Lifecycle** | `drafting` |
| **Design** | _pending_ |
| **Last updated** | 2026-06-28 |

## 1. Purpose

Every successful login ([F04](./F04-login.md)) writes a **`Session`** row that
records *where* a token pair lives — device fingerprint, user-agent, IP,
trusted/untrusted flag, last-active timestamp. The user can see every active
session and revoke any of them ([F05](./F05-logout-and-session-revocation.md)).
This is also the persistence backbone for [F07 PIN](./F07-pin-quick-login.md)
(PIN hash + salt live on the session row) and the trigger source for
[F15 Suspicious-Activity Alerts](./F15-suspicious-activity-alerts.md).

## 2. User stories

| As a | I want to | So that |
|---|---|---|
| Security-conscious user | see every device that's signed into my account | I notice anything I don't recognise |
| User who lost a phone | revoke that specific session | the lost device is locked out |
| Platform | retire idle sessions automatically | dormant tokens aren't a tail risk |
| Audit reviewer | trace which session emitted an action | post-incident attribution is possible |

## 3. Functional requirements

| ID | Requirement | Status |
|---|---|---|
| R01 | A `Session` row is created on every successful login with `{userId, deviceId, ua, ip, geoCountry?, trusted, createdAt, lastSeenAt, revokedAt?}` | Drafting |
| R02 | `deviceId` is a UUID generated client-side on first install and stored in `localStorage`; on absent → server allocates and returns | Drafting |
| R03 | `lastSeenAt` is updated on every authenticated request — but coalesced (max 1 write / 5 min / session) to bound write load | Drafting |
| R04 | `GET /auth/sessions` returns the caller's active (non-revoked) sessions, sorted `lastSeenAt` desc; current session flagged `isCurrent=true` | Drafting |
| R05 | Per-row metadata exposed: device label (derived from ua: "Chrome on Android"), city/country (best-effort GeoIP), `lastSeenAt`, `trusted` | Drafting |
| R06 | A session idle ≥ 30 days is auto-revoked by a background sweep | Drafting |
| R07 | Max 10 active sessions per user; oldest non-current is auto-revoked when an 11th is created | Drafting |
| R08 | Refresh-token rotation: every `/auth/refresh` issues a new jti, blacklists the old; replay of an old jti → 401 + revoke the whole session + emit `auth.session.replay_detected` (forwarded to [F15](./F15-suspicious-activity-alerts.md)) | Drafting |
| R09 | Trusted devices ("remember device" from [F04](./F04-login.md)) get 90-day refresh TTL; untrusted get 30-day | Drafting |
| R10 | Session list never includes `revokedAt!=null` rows in the default view; `?include=revoked` shows last 30 days for auditability | Drafting |
| R11 | User cannot rename device labels in v1 (would complicate audit) — UI shows derived label only | Drafting |

## 4. Non-functional requirements

| Concern | Requirement |
|---|---|
| Security | Refresh tokens stored hashed (SHA-256). Rotation enforced — re-using a burnt jti is a security event. |
| Performance | `GET /auth/sessions` p95 < 100 ms for ≤ 10 rows. `lastSeenAt` coalesced write avoids hot row. |
| Privacy | IP recorded; coarse GeoIP (country, city) — no precise lat/lng. Honour M17 retention. |
| Storage | Index on `(UserId, RevokedAt, LastSeenAt DESC)` for list queries; partial index on `RevokedAt IS NULL` for sweep. |
| Observability | Each create / revoke / sweep / replay emits a Serilog event. |

## 5. Acceptance criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC1 | Signed-in user | `GET /auth/sessions` | 200, list of own active sessions, current flagged |
| AC2 | User has 10 active sessions; 11th login | Login succeeds | Oldest non-current session auto-revoked with `reason=session_cap` |
| AC3 | Session idle 31 days | Nightly sweep | Session revoked with `reason=idle` |
| AC4 | Refresh-token replay (old jti) | `/auth/refresh` | 401; the whole session revoked; F15 alert raised |
| AC5 | User revokes a session via F05 endpoint | List query after | Revoked session no longer in default list; still in `?include=revoked` for 30 days |
| AC6 | Login from new country vs previously seen | Login succeeds | Session marked `geoCountry=…`; F15 evaluates "country mismatch" rule |
| AC7 | Trusted-device login | Cookie inspection | Refresh-token cookie `Max-Age=90d`; session `trusted=true` |

## 6. Design flow

Design: _pending_.

**Screens:** Profile → Sessions list (each row: device label, city/country, last active, "current" badge, "Revoke" button; "Sign out everywhere else" CTA at the top). Empty / loading / error states.

## 7. Dependencies

| Relation | Target | Why |
|---|---|---|
| Used by | [F04 Login](./F04-login.md) | Login creates the row |
| Used by | [F05 Logout & Revocation](./F05-logout-and-session-revocation.md) | Revoke flips `RevokedAt` |
| Used by | [F07 PIN](./F07-pin-quick-login.md) | PIN hash + salt live on the row |
| Triggers | [F15 Suspicious Activity](./F15-suspicious-activity-alerts.md) | New device, country mismatch, refresh-replay |
| Depends on | [M10-F03 Notification Channels](../../MODULES.md#m10-f03--notification-channels) | New-device alert email/SMS via F15 |
| Out of scope | Multi-tab linking (one browser tab share/lock) | Browser concern, not server |

## 8. Audit emissions

| Event | Fields | Sink |
|---|---|---|
| `auth.session.created` | `userId, sessionId, deviceId, ip, geoCountry?, trusted, ua` | [M17](../M17-audit-and-compliance/README.md) |
| `auth.session.last_seen` | _coalesced, **not** audited per-hit; sampled per-day_ | — |
| `auth.session.revoked` *(emitted by F05)* | `userId, sessionId, reason` | M17 |
| `auth.session.expired_idle` | `userId, sessionId, daysIdle` | M17 |
| `auth.session.expired_cap` | `userId, sessionId, totalSessions` | M17 |
| `auth.session.replay_detected` | `userId, sessionId, ip, ua` | M17 |

## 9. API surface

| Method | Path | Body | Responses |
|---|---|---|---|
| `GET` | `/api/v1/auth/sessions` | `?include=revoked` | 200 |
| `POST` | `/api/v1/auth/refresh` | _refresh cookie_ | 200 (rotates) · 401 (`session_revoked` / `replay_detected`) |

Session revoke endpoints live in [F05](./F05-logout-and-session-revocation.md).
Full schemas in Swagger.

## 10. Open questions

- **OQ1** — GeoIP provider: bundled MaxMind GeoLite (offline, slightly stale) vs an HTTPS lookup per login. Leaning bundled — cheaper and lower-latency, accuracy sufficient for country-level rules.
- **OQ2** — Do we expose the user's own IP per session row in the UI? Some users find it useful, others find it unfamiliar. Leaning yes, alongside city/country.

## 11. Change history

- **2026-06-28** — Initial draft.
