# Known issues

> Log bugs, workarounds, and intentional technical debt here.
> Claude reads this before touching affected modules to avoid undoing workarounds.
> Use this file for things that are **knowingly broken or compromised** — not for planned features (those live in [`MODULES.md`](MODULES.md) with status `Planned`).

## Active

| ID | Issue | Affected paths | Workaround | Fix in |
|---|---|---|---|---|
| _none_ | No active known issues as of 2026-05-23. Codebase scan found zero `TODO` / `FIXME` / `HACK` / `WORKAROUND` markers. | — | — | — |

## Resolved

| ID | Issue | Resolved in |
|---|---|---|
| _none_ | — | — |

---

## How to use this file

**When to add a row to "Active":**
- A bug is found but not fixed this session (capture so the next session doesn't re-discover it)
- An intentional workaround is shipped (e.g., a feature flag because the proper fix is blocked)
- A known performance / accuracy compromise (e.g., "in-memory dedupe scales to ~10k rows; switch to DB-side when N grows")
- A planned feature has a sharp edge that callers must know about (e.g., "M02-F05-R04 variance alert currently delivered async via console log — until M10-F03 lands, Owner sees the alert only by opening the shift detail view")

**When NOT to add a row:**
- The work is planned and tracked in `MODULES.md` — that's not a "known issue", that's a backlog item
- The "issue" is a TODO comment in code. Inline TODOs are fine for tiny gaps; this file is for things that warrant cross-session memory

**ID format:** `KI-01`, `KI-02`, … — append-only, never renumber.

**Move to "Resolved" when:** the fix ships. Don't delete rows — keep the history so future drift investigations can find the link to the original workaround.
