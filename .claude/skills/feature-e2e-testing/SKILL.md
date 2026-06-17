---
name: feature-e2e-testing
description: Walk a planned MXX-FXX[-RXX] feature through Playwright MCP end-to-end before the PR exists. Auto-derives the target item ID from the current git branch (`feat-<id>-<short>`), or accepts an explicit ID argument. Spawns the `feature-e2e-tester` subagent to walk every acceptance criterion, classify bugs by severity, fix Critical bugs on the same branch, and codify the passing journey as `fuel-flow-web/e2e-tests/<id>.spec.ts`. Use after `/feature-implementation` finishes Step 4 (impl + tests + lint + impl-doc check-offs) and before opening the PR. Also use standalone to re-verify a feature whose E2E was deferred, to re-walk after a fix, or to backfill the spec for an older item.
---

# Feature E2E Testing — Fuel Flow

Orchestrates the Playwright-MCP browser walk for a `MXX-FXX[-RXX]` item that
has already been planned and (typically) implemented through Step 4 of
`/feature-implementation`. This skill is the orchestrator; the actual browser
work, bug classification, fix loop, and spec writing happen inside the
spawned `feature-e2e-tester` subagent.

Extracted from `/feature-implementation`'s former Step 4.5 so it can run
independently: re-walk after a fix, backfill an item where E2E was deferred,
or verify a feature on its own merits without re-running the whole
implementation flow.

Follows the root `CLAUDE.md` Development Workflow (Rules 1–10). This skill
orchestrates; it does not restate conventions — those load from the scoped
`CLAUDE.md` files.

## Procedure

### 1. Identify the target item

Inspect HEAD with `git rev-parse --abbrev-ref HEAD`. Expect the
`feat-<id-lowercased>-<short-kebab-name>` shape per root `CLAUDE.md` Rule 4
(e.g. `feat-m14-f01-control-plane-tenant-dbcontext-split`).

Resolution order for the `MXX-FXX[-RXX]` ID:

1. If the user passed an explicit ID argument (e.g.
   `/feature-e2e-testing M07-F09`), prefer that and uppercase it.
2. Otherwise regex-extract the ID from the branch name:
   `^(feat|fix|docs)-(m\d{2}-f\d{2}(-r\d{2})?)-` → uppercase the
   captured `m\d{2}-f\d{2}(-r\d{2})?` group.
3. If neither yields an ID (HEAD is `main`, branch doesn't match the
   convention, no arg supplied) — **stop** and tell the user:
   *"No `MXX-FXX[-RXX]` ID resolved. Either pass one explicitly
   (`/feature-e2e-testing M14-F01`) or check out the matching
   `feat-<id>-<short>` branch — `/feature-planning` cuts it."*

Resolve the implementation doc path — look in this order and use the first that
exists:

1. `docs/implementation/<id>.md` — the standard per-feature location
   (`/feature-planning`).
2. `docs/implementation/<MXX>/<id>.md` — the per-feature task doc inside a module
   plan directory (`/module-planning`), where `<MXX>` is the module prefix of the
   ID (the `M\d{2}` part, e.g. `M08` for `M08-F02`).

If neither exists, stop and tell the user the item was never planned —
`/feature-planning <id>` or `/module-planning <MXX>` first.

State the chosen `MXX-FXX[-RXX]` ID and the resolved doc path explicitly so the
user can see what's about to happen. Everywhere below, "the impl doc" means this
resolved path.

### 2. Applicability gate

Read the `## Layers touched` section of the impl doc.

- If **either** `Api` **or** `Frontend` is ticked (`- [x]`), continue.
- If **neither** `Api` **nor** `Frontend` is ticked (pure-docs item,
  migration-only item with no user-visible behavior, or similar), stop
  and:
  1. Append `E2E: N/A — docs-only (no Api/Frontend layer touched)` to
     the impl doc's **Implementation notes** section (create it if
     missing).
  2. Tell the user nothing else is needed for E2E on this item —
     proceed straight to the PR.

Mirrors the former Step 4.5.A logic verbatim. Don't run E2E against
something that has no user-facing surface to walk.

### 3. Warn on incomplete implementation, then proceed

Run `grep -n '^- \[ \]'` against the resolved impl doc path to list every
unticked box with its line number.

Filter the results: boxes that appear under the `## Layers touched`
heading are *intentionally* unticked for layers the feature deliberately
does not touch — do **not** flag those. Only boxes under `### Phase N`
headings (and sub-phases like `### Phase 1a`) or under
`## MODULES.md edits required` count as "incomplete work."

- If zero remaining unticked task boxes: log "impl doc fully ticked,
  proceeding" and continue to Step 4.
- If one or more remaining: list each one (line number + box text), then
  ask the user: *"<N> task box(es) under Phases / MODULES.md edits are
  still unticked. E2E may walk an incomplete feature and surface ACs
  that haven't been implemented yet. Proceed anyway? (y/N)"* Wait for
  explicit confirmation. **Warn-but-proceed**, not a hard gate — partial
  implementation is sometimes intentional (debugging a specific AC).

### 4. Spawn the `feature-e2e-tester` subagent

Invoke the `feature-e2e-tester` subagent (defined at
`.claude/agents/feature-e2e-tester.md`). Pass in the brief:

- Item ID (e.g. `M14-F01`).
- The resolved impl doc path (the flat `docs/implementation/<id>.md`, or the
  module-nested `docs/implementation/<MXX>/<id>.md`, whichever was found).
- Current branch name (the agent commits any fixes here).
- Whether the spec file `fuel-flow-web/e2e-tests/<id>.spec.ts` already
  exists (the agent appends rather than overwrites if so).

The skill itself does **no browser work**. The agent owns the former
blocks B–F of Step 4.5: dev-server probe, baseline snapshot, per-AC
journey walk, three-signal capture (snapshot / console / network), bug
classification per the severity table, root-cause fix-on-branch loop for
Criticals, append-only spec codification, `npm run test:e2e -- <id>`
run, and the `## E2E verification (Playwright MCP)` section appended to
the impl doc.

### 5. Hand back

When the subagent returns its summary, surface it to the user:

- Item ID and E2E completion status.
- ACs walked and journey results (passing clean / passing after fix /
  unable to walk).
- Critical bugs found and the commit SHAs that fixed them on this
  branch.
- Any bugs deferred (with reason) — those need to go in the PR's Test
  Plan under `Discovered, not fixed`.
- Path to `fuel-flow-web/e2e-tests/<id>.spec.ts` and the result of
  `npm run test:e2e -- <id>`.
- Next step: open the PR. If `/feature-implementation` invoked this
  skill, control returns there for Step 5. If invoked standalone, tell
  the user to run `/pr-workflow` (or `/feature-implementation`'s Step 5
  manually if the rest of the work is already done).

If the agent stopped mid-walk because of an unfixable Critical
(ambiguous AC, blocked by another unmerged item, missing information),
surface the bug description verbatim and instruct the user that **no PR
may be opened until it is resolved** — same protocol as the existing
"reality diverges from the plan" rule in `/feature-implementation`.

## Rules

- E2E verification runs before the PR is opened. Critical bugs are fixed
  on the same feature branch; **no Critical bug ships with the
  feature**.
- Spec collision handling is **append-only**: if
  `fuel-flow-web/e2e-tests/<id>.spec.ts` already exists, the subagent
  reads it, parses existing `test('M..._F.._R..…')` names, and appends
  only test blocks for ACs not yet covered. Existing blocks are never
  overwritten or deleted.
- The skill never edits `playwright.config.ts` or
  `fuel-flow-web/e2e-tests/example.spec.ts` — those are repo-wide
  tooling concerns and belong in their own item.
- The skill never launches the dev servers itself. If
  `http://localhost:5173` or `http://localhost:5035` is unreachable, the
  subagent stops and instructs the user to run `scripts/dev.ps1` in
  their own terminals.
- If reality diverges from the plan (AC can't be walked, bug can't be
  fixed, dev servers unreachable), stop and hand back to the user with a
  clear description rather than improvising.

## Re-run scenarios

This skill is designed to be safely re-runnable:

- **First run after `/feature-implementation`** — typical path; spec
  gets created fresh, `## E2E verification` section appended once.
- **Re-run after a follow-up fix on the same branch** — the existing
  spec is preserved; only ACs not yet covered get new `test()` blocks;
  the `## E2E verification` section gets a new dated entry rather than
  being rewritten.
- **Backfill on an older feature** — works the same way; the agent
  walks ACs against the *current* code and records what it sees today.
