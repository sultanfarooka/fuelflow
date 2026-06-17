---
name: module-implementation
description: Build a planned module (MXX) from its plan in docs/implementation/<MXX>/. Use whenever the user asks to build or implement a whole module that already has a module plan. Cuts one module/<MXX> branch, builds the shared Foundation then every in-scope feature in dependency order on that branch (delegating each to the module-implementer subagent and e2e to /feature-e2e-testing), and ends with a single module PR. Resumable.
---

# Module Implementation — Fuel Flow

Drives building a whole module that has already been planned. Assumes a module
plan exists at `docs/implementation/<MXX>/_module-plan.md` with one `<MXX-FXX>.md`
task doc per in-scope feature. If none exists, stop and tell the user to run
`/module-planning <MXX>` first.

Follows the root `CLAUDE.md` Development Workflow (Rules 1–10). This skill
orchestrates; it does not restate conventions — those load from the scoped
`CLAUDE.md` files as work moves between folders, and per-feature mechanics live in
the `module-implementer` agent and the `feature-e2e-testing` skill.

The whole module is built on **one branch** (`module/<MXX>`), feature by feature
in dependency order, ending in **one PR**. There are no per-feature merge gates —
each feature lands on the branch immediately, so the next dependent feature sees
it. This skill is **resumable**: re-running it on a partially built module picks
up at the next unbuilt feature.

## Procedure

### 1. Load and locate progress

Read `docs/implementation/<MXX>/_module-plan.md` and every `<MXX-FXX>.md` task
doc. Re-confirm the cross-module dependencies in the plan are still `Done` in
`MODULES.md`; if one regressed or was never met, stop and tell the user.

Determine where the build stands:

- Does the `module/<MXX>` branch exist yet?
- Which in-scope features are already built — their task-doc boxes ticked, their
  `MODULES.md` rows `Done`, their commits present in `git log`?

The next thing to build is the Foundation (if not yet built) or the first unbuilt
feature in the plan's build sequence whose prerequisites are all built.

State the chosen module ID explicitly (Rule 1).

### 2. Set up the branch (first invocation only)

If `module/<MXX>` does not exist, cut it off a current `main`:

1. Inspect HEAD. If it is a non-`main` branch with uncommitted work, **stop** and
   ask the user to commit/stash and return to `main`. Never auto-resolve.
2. `git checkout main && git pull --ff-only origin main`. If `--ff-only` fails,
   **stop** and tell the user.
3. `git checkout -b module/<MXX>`.
4. Commit the whole `docs/implementation/<MXX>/` directory as the first commit
   (`docs(<mxx>): module plan and feature task docs`) so the plan rides the single
   module PR.

If `module/<MXX>` already exists (resumed run), check it out and continue.

### 3. Build the Foundation

If the plan's `## Foundation tasks` are non-empty and not yet built, build the
shared spine on `module/<MXX>` — spawn one `module-implementer` subagent for the
Foundation slice. It works through the Foundation tasks exactly as it would a
feature. The Foundation is **not** a feature and has no `MXX-FXX` ID, so it does
**not** get its own `/feature-e2e-testing` call — its shared shell, routes, and
i18n are exercised by the e2e walks of the first features that consume them. If
the Foundation is empty, skip this step entirely.

### 4. Build each feature in dependency order

Walk the plan's build sequence. For the next unbuilt feature:

**4.1 — Spawn one `module-implementer` subagent** for that feature. It works on
the current `module/<MXX>` branch (it does **not** cut a new branch), flips the
feature's `MODULES.md` row to `In Progress` in its first commit, builds the
feature from its `<MXX-FXX>.md` task doc with conventional commits scoped by ID
(`feat(<mxx-fxx>): …`), writes the `[Fact]` tests, ticks the task-doc boxes, runs
the pre-return checks, and flips the row to `Done`. It returns a summary and
whether `Api`/`Frontend` were touched. See `.claude/agents/module-implementer.md`.

**4.2 — E2E-verify the feature.** If the returned summary says `Api` or `Frontend`
was touched, invoke **`/feature-e2e-testing <MXX-FXX>`** with the explicit ID —
HEAD is `module/<MXX>`, not a `feat-<id>` branch, so the skill cannot derive the
ID from the branch. It spawns the `feature-e2e-tester` subagent, which walks the
feature's ACs against the running dev servers (the user must have `scripts/dev.ps1`
up), classifies bugs by the standard severity table, **fixes every Critical on
`module/<MXX>`** with `fix(<mxx-fxx>): <symptom>` commits, writes
`fuel-flow-web/e2e-tests/<MXX-FXX>.spec.ts`, runs `npm run test:e2e -- <MXX-FXX>`
green, and appends the `## E2E verification (Playwright MCP)` section to the
feature's task doc. Wait for it to finish.

Docs-only / migration-only features (no `Api`/`Frontend`) skip e2e — the skill's
applicability gate writes `E2E: N/A — docs-only` to the task doc and returns.

**4.3 — Continue to the next feature.** No pause and no merge gate between
features. Build features one at a time, in order. Do not start a feature whose
prerequisites are not yet built on the branch.

If the e2e tester stops on a Critical it cannot fix, **stop the whole build** and
surface the bug — do not move on to the next feature, and do not open the PR.

### 5. Keep MODULES.md current as you go

Each feature's `In Progress` → `Done` flips happen as it lands (Rule 2), made by
the `module-implementer` subagent inside the feature's own commits. All of those
flips, plus any new rows planning added and the `Last Updated` bump, ride the
single module PR. The module is "done" when every in-scope feature is `Done`
(there is no separate module-done field in `MODULES.md`).

### 6. Open the one PR

When every in-scope feature is built and verified:

- Confirm `dotnet format` is clean and ESLint + Prettier pass across the branch,
  every task doc is fully ticked
  (`grep -rc '^- \[ \]' docs/implementation/<MXX>/` — only `## Layers touched`
  rows for untouched layers should remain), and the graphify graph is current
  (`graphify update .` if `graphify-out/graph.json` exists — the subagents refresh
  it per slice, so this is a final confirm).
- Push `module/<MXX>` and open **one** PR against `main`, title
  `<MXX>: <module name>`. Use an **aggregated** body following the root
  `CLAUDE.md` Rule 6 template: a Summary listing each feature implemented, a
  combined MODULES.md Status Update checklist, and a consolidated Test Plan (each
  feature's golden path + edge cases, and the per-feature E2E line referencing
  `fuel-flow-web/e2e-tests/<MXX-FXX>.spec.ts`).
- Open the PR directly: `git push -u origin module/<MXX>` then `gh pr create
  --base main`. (`pr-workflow` scopes to a single `MXX-FXX[-RXX]` item and stops
  on multi-item work, so it is not used for the module PR; teaching it a module
  mode is an optional later enhancement.) One PR for the whole module, never
  auto-merged.

### 7. Hand back

Tell the user the module is built, the single PR is open, `MODULES.md` is
updated, and the PR awaits their review and merge. Do not merge — that is the
user's call.

## Resuming

This skill is safe to re-run. On each invocation it reconstructs progress from the
task-doc check-offs, the `MODULES.md` statuses, and `git log` on `module/<MXX>`,
then continues at the next unbuilt feature. A killed or interrupted build is
resumed by simply running `/module-implementation <MXX>` again. If a feature
stopped partway, the re-spawned `module-implementer` inspects that feature's task
doc, sees which boxes are already ticked, and continues from the first unticked
task — partial slices resume in place, they do not restart.

## Rules

- One branch (`module/<MXX>`) and one PR (`module/<MXX> → main`) for the whole
  module, never auto-merged.
- Features are built **sequentially in dependency order** on the one branch — no
  per-feature branches, no per-feature PRs, no merge gates between features.
- Each feature's `MODULES.md` status flip and task-doc check-offs land in that
  feature's own commits (Rule 2) and ride the single module PR — never a
  follow-up.
- **E2E verification runs before the PR is opened** for every feature that touches
  `Api` or `Frontend` — delegated to `/feature-e2e-testing <MXX-FXX>`. Critical
  bugs are fixed on `module/<MXX>` by the `feature-e2e-tester` subagent; no
  Critical bug merges with the module.
- If reality diverges from the plan, stop and raise it with the user rather than
  improvising. A Critical e2e bug that cannot be fixed stops the whole build.
- Do not merge the PR, and do not push to `main`.
