# M01-F15 — Suspicious-Activity Alerts

| | |
|---|---|
| **Lifecycle** | `drafting` |
| **Design** | _pending_ |
| **Last updated** | 2026-06-28 |

## 1. Purpose

A small **rules engine** that consumes M01 audit events (login, lockout,
refresh-replay, credential changes) and dispatches **cross-channel**
notifications when something looks off — so the user can react (sign out
elsewhere, change password, contact support) before an attacker does damage.
Critical signals also auto-escalate ([F13](./F13-account-lockout-and-unlock.md))
and trigger [F05](./F05-logout-and-session-revocation.md) revoke-all.

This is intentionally a **simple deterministic engine** in M01 — not ML-based
anomaly detection. The aim is to ship the "new login from Karachi" email
every account expects, not to predict novel attacks.

## 2. User stories

| As a | I want to | So that |
|---|---|---|
| User | get an email/SMS when someone signs in from a new device | I notice account takeover quickly |
| User who changed password / phone / email | get a notification on the **other** channel | I detect unauthorised changes |
| Owner | see the same alerts for my team members in [M16](../M16-team-and-access/README.md) | I can act on org-wide incidents |
| Platform | not spam the user when nothing's wrong | alert fatigue is the failure mode |

## 3. Functional requirements

| ID | Requirement | Status |
|---|---|---|
| R01 | Engine subscribes to the M01 event stream (in-process; persisted via [M17](../M17-audit-and-compliance/README.md)) and evaluates each event against a rule set | Drafting |
| R02 | Rule: **new device** — login from a `deviceId` not seen in the last 30 days → notify (email if verified + SMS) with masked location and "If this wasn't you, sign out everywhere → /sessions" | Drafting |
| R03 | Rule: **new country** — login from a country differing from the last 5 logins → same notification + label as `high-priority` (sent even outside cooldown window) | Drafting |
| R04 | Rule: **credential change** — password ([F11](./F11-password-change.md)), phone ([F09](./F09-phone-number-change.md)), email ([F10](./F10-email-add-change-remove.md)), 2FA enable/disable ([F12](./F12-two-factor-authentication.md)) → cross-channel courtesy notice ("Your password was changed on YYYY-MM-DD HH:MM from Lahore, PK. Wasn't you? → /password-reset"). The other channel only (so a compromised channel doesn't self-suppress). | Drafting |
| R05 | Rule: **lock event** ([F13](./F13-account-lockout-and-unlock.md)) — single alert per lock; not per-fail | Drafting |
| R06 | Rule: **refresh-token replay** ([F08](./F08-device-and-session-management.md)) → **critical** alert + auto-trigger [F05 revoke-all](./F05-logout-and-session-revocation.md) (`reason=suspicious_activity`) + revoke all PINs ([F07](./F07-pin-quick-login.md)) | Drafting |
| R07 | Rule: **lockout escalation** ([F13](./F13-account-lockout-and-unlock.md) R09) → critical alert to user + email Owner if user is a team member | Drafting |
| R08 | **Cooldown**: same rule + same user → at most 1 notification / 4 h (overridden for `critical` and `high-priority` rules above) | Drafting |
| R09 | Notification body never includes full IP / precise location / full second factor — only city/country + masked identifier | Drafting |
| R10 | User can mute "new device" notifications individually from the notification itself (signed token, 30-day mute); credential-change + critical notifications **cannot** be muted | Drafting |
| R11 | Engine failures (rule misconfiguration, downstream channel down) must **not** block the underlying auth action; alert delivery is at-most-once with retry queue but is fire-and-forget from the auth path | Drafting |

## 4. Non-functional requirements

| Concern | Requirement |
|---|---|
| Latency | Alert decision < 50 ms (in-process), enqueue < 100 ms; actual SMS / email dispatch async via [M10-F03](../../MODULES.md#m10-f03--notification-channels). |
| Reliability | At-most-once with idempotency key (`rule + userId + bucket(eventTime, 5min)`); duplicate suppression on retry. |
| Privacy | All logs use hashes for identifiers; alert body uses already-known-to-user fields only. |
| Configurability | Rule thresholds (e.g. cooldown, country window) hot-reloadable from config; no redeploy needed. |
| Observability | Per-rule firing counter exposed via Serilog; dispatch failures alarmed separately. |

## 5. Acceptance criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC1 | First-ever login from a `deviceId` not seen in 30 days | Login success | Email + SMS dispatched with city/country, "Sign out everywhere" link |
| AC2 | Same device, same country, second login within 1 h | Login success | No notification (cooldown) |
| AC3 | Login from PK; prior 5 logins from US | Login success | High-priority alert (bypasses cooldown), labelled "New country" |
| AC4 | User changes password via [F11](./F11-password-change.md) | F11 commit | Courtesy notification to the *other* channel only (not the changed channel) |
| AC5 | Refresh-token replay detected ([F08](./F08-device-and-session-management.md)) | Replay event | Critical alert; all sessions + PINs revoked; user signed out everywhere |
| AC6 | F13 escalation fires | Escalation event | User notified + Owner notified (if team member) |
| AC7 | User clicks mute link in a "new device" email | Token verify | 200 with "Muted for 30 days"; future new-device alerts suppressed until expiry; credential-change alerts unaffected |
| AC8 | Notification channel ([M10-F03](../../MODULES.md#m10-f03--notification-channels)) is down | Login success | Auth completes normally; alert enqueued in retry queue; auth path latency unaffected |

## 6. Design flow

Design: _pending_.

**Surfaces:** Email template (subject: "New sign-in to Fuel Flow"), SMS template (terse, includes a short URL), in-app notification feed (future — out of M01 scope). One-click mute landing page for "new device" only.

## 7. Dependencies

| Relation | Target | Why |
|---|---|---|
| Subscribes to | [F04 Login](./F04-login.md), [F08 Sessions](./F08-device-and-session-management.md), [F09 Phone Change](./F09-phone-number-change.md), [F10 Email Change](./F10-email-add-change-remove.md), [F11 Password Change](./F11-password-change.md), [F12 2FA](./F12-two-factor-authentication.md), [F13 Lockout](./F13-account-lockout-and-unlock.md) | Event sources |
| Triggers | [F05 Revocation](./F05-logout-and-session-revocation.md) | Auto-revoke on critical |
| Triggers | [F07 PIN](./F07-pin-quick-login.md) | Auto-revoke PINs on critical |
| Depends on | [M10-F03 Notification Channels](../../MODULES.md#m10-f03--notification-channels) | SMS + email dispatch |
| Used by | [M16 Team & Access](../M16-team-and-access/README.md) | Owner-side aggregated view |
| Out of scope | ML anomaly detection, IP reputation feeds, geo-velocity ("impossible travel") | Future hardening |

## 8. Audit emissions

| Event | Fields | Sink |
|---|---|---|
| `auth.alert.evaluated` | `userId, rule, decision` | [M17](../M17-audit-and-compliance/README.md) |
| `auth.alert.dispatched` | `userId, rule, channel, priority, idempotencyKey` | M17 |
| `auth.alert.muted` | `userId, rule, until` | M17 |
| `auth.alert.escalation_action` | `userId, action, reason` | M17 |

`decision` ∈ `{fire, suppressed_cooldown, suppressed_muted}`. `action` ∈ `{revoke_all, revoke_pins, owner_notified}`.

## 9. API surface

| Method | Path | Body / Params | Responses |
|---|---|---|---|
| `GET` | `/api/v1/auth/alerts/mute` | `?token=<string>` | 200 · 410 |
| `GET` | `/api/v1/auth/alerts/preferences` | _none_ | 200 (`{rules: [{rule, mutedUntil?}]}`) |
| `PUT` | `/api/v1/auth/alerts/preferences` | `{rule, mutedUntil?}` | 200 · 400 (cannot mute critical) |

Full schemas in Swagger.

## 10. Open questions

- **OQ1** — "New country" rule needs a reliable GeoIP source — see [F08 OQ1](./F08-device-and-session-management.md). Locking in MaxMind GeoLite bundled is the simplest path.
- **OQ2** — Owner notification on team-member escalation: in-app only, or also email? Leaning both — escalations are rare; better to over-notify the Owner than under-notify.
- **OQ3** — Should new-device notifications include a screenshot-style device list link, or just the masked summary? Leaning summary + link → [F08](./F08-device-and-session-management.md) sessions page.

## 11. Change history

- **2026-06-28** — Initial draft.
