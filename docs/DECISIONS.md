# Decisions

> One row per non-trivial technical decision.
> Append a row whenever a judgment call is made — don't re-litigate settled decisions later.
> **This file is an index** — for the full reasoning behind a decision, follow the link to the relevant scoped `CLAUDE.md`, [`CHANGELOG.md`](CHANGELOG.md), or ADR file under `docs/adr/` (created from [`ADR-template.md`](ADR-template.md)).

## Index

| ID | Decision | Reason | Revisit if |
|---|---|---|---|
| D-01 | Hierarchical `MXX-FXX-RXX` IDs (vs flat per-feature IDs) | Stable references across PRs, commits, tests, GitHub Issues; append-only numbering avoids renumbering churn. Full rationale in [`MODULES.md`](MODULES.md) "Maintenance Conventions" §6. | Renumbering becomes routine, or the M/F/R nesting starts breaking down (e.g., genuinely cross-module requirements). |
| D-02 | Reference content (tech stack, architecture, API conventions, DB schema, UI specs) lives in scoped `CLAUDE.md` files, not in `docs/ARCHITECTURE.md` or similar. | Colocates reference with code, so it can't drift silently. See root [`CLAUDE.md`](../CLAUDE.md) Rule 9 and [`docs/CLAUDE.md`](CLAUDE.md) "What Goes Where". | Scoped files drift persistently from the code they describe, or a central architecture view becomes necessary for outside reviewers. |
| D-03 | JWT in HTTP-only cookies (`access_token`, `refresh_token`), never `Authorization: Bearer …`. | Browser-only client today (Vite SPA on `:5173`, API on `:5035`). Cookies eliminate XSS exfiltration risk for tokens. Full rules in [`server/FuelFlow.Api/CLAUDE.md`](../server/FuelFlow.Api/CLAUDE.md) "Cookie Handling". | Multi-subdomain deployment, a non-browser client (mobile native, CLI), or third-party API consumption needs token in header. |

---

## How to use this file

**When to add a row:**
- A judgment call between two valid approaches that future-you (or another contributor) might re-litigate
- A chosen pattern that constrains downstream work (e.g., "all timestamps stored as `TIMESTAMPTZ` UTC")
- A library / framework choice with non-obvious trade-offs
- A migration plan with intermediate states that callers must know about

**When NOT to add a row:**
- Trivia ("we use 2 spaces, not tabs") — that belongs in linter config
- Settled defaults from the stack (e.g., "ASP.NET Core uses the minimal hosting model") — those are framework facts, not decisions
- Bug fixes — those live in commit messages and CHANGELOG

**When a one-line row isn't enough:**
- Copy [`ADR-template.md`](ADR-template.md) into `docs/adr/ADR-NNN-short-title.md`, write the full record, and link to it from the row here (`Reason` column: `See [ADR-005](adr/ADR-005-…)`).

**ID format:** `D-01`, `D-02`, … — append-only. Never renumber. If a decision is superseded, append a new row with `Decision = Supersedes D-NN (reason)` rather than editing the old row.
