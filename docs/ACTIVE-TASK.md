# Active task

## Task: [M01-F09](MODULES.md#m01-f09--phone-first-authentication) — Phone-First Authentication
## Status: In Progress — Phase 0 (registry edits + scope fence)

### Last action
Cut branch `feat-m01-f09-phone-first-authentication` from `main` (post PR #8). Wrote planning artefact at [docs/implementation/M01-F09.md](implementation/M01-F09.md). Flipped `M01-F09` to `In Progress` in [MODULES.md](MODULES.md); marked R06 `Out of Scope`, annotated R07 (`· deferred to M01-F05-R02 PR`) and R09 (`· deferred to M01-F08 PR`); added new rows R11 (phone change) and R12 (rate-limit) plus follow-up R07 under M01-F08.

### Next action
Phase 1 — SMS gateway abstraction + Docker services. Add `ISmsSender` interface (Application), `CapcomSmsSender` HTTP client (Infrastructure) with HTTP Basic + Polly retry, options class bound to `Sms:Gateway:*`, DI registration, MariaDB + `capcom6/sms-gateway` services in `server/docker-compose.yml`, FCM/setup `server/sms-gateway/README.md`, and config-key rows in [ENV-MAP.md](ENV-MAP.md).

### Files touched
- [docs/MODULES.md](MODULES.md) — status flips, new R11/R12, M01-F08-R07 backfill row, AC10/AC11
- [docs/SCOPE-FENCE.md](SCOPE-FENCE.md) — R06/R07/R09/FCM-key automation listed as Deferred
- [docs/implementation/M01-F09.md](implementation/M01-F09.md) — phased plan (created)
- [docs/ACTIVE-TASK.md](ACTIVE-TASK.md) — this file

### Decisions made this session
- SMS provider = self-hosted `capcom6/sms-gateway` (Docker, private mode); requires MariaDB + FCM credentials.
- OTP code hashing = HMAC-SHA256 with server pepper (`Otp:HashPepper`).
- Login UX = single combined "Phone or email" input (Zod union).
- Daily OTP cap = configurable `Otp:DailyCapPerPhone`, default `10`.
- R07 sub-user toggle deferred to M01-F05-R02 PR.
- R09 audit deferred to M01-F08 PR; handlers leave `TODO` markers + emit structured Serilog events.
- R06 dropped (`Out of Scope`) — no email-only production users to migrate.
- Phone-change (R11) and rate-limit (R12) added as new rows and ship in this PR.
- i18n full en+ur in this PR, including retro-i18n of touched email-era screens.

### Don't touch
See [`docs/SCOPE-FENCE.md`](SCOPE-FENCE.md) "Frozen" section (none today).

### Blockers / open questions
None for the code path. **Operational blocker for end-to-end verification:** Phase 1 docker stack requires a Firebase Cloud Messaging project + an Android device running the SMS Gateway app for actual SMS delivery during smoke tests. The implementation itself does not block — handlers will be testable with a fake `ISmsSender` — but the AC walkthroughs in the implementation doc require the user to provide FCM credentials and pair a device.

---
> Update this file before ending every session. Keep each field to 1–2 lines max.
> Stale if not updated in 3+ days — verify current state (run `git log --oneline -10`, check `MODULES.md` statuses) before assuming the file reflects reality.
> Reference work using `MXX-FXX-RXX` IDs from [`MODULES.md`](MODULES.md) — not legacy IDs (SH-001 etc.) in new entries.
