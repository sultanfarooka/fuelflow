---
name: feature-implementation
description: Implement a planned MXX-FXX[-RXX] item from its document in docs/implementation/. Use whenever the user asks to build, implement, or work on a feature or requirement that already has an implementation document. Drives phase-by-phase work across the Clean Architecture layers and ends with a single feature PR.
---

# Feature Implementation — Fuel Flow

Drives building a `MXX-FXX[-RXX]` item that has already been planned. Assumes a
document exists at `docs/implementation/<id>.md`. If none exists, stop and tell
the user to run `/feature-planning` first.

Follows the root `CLAUDE.md` Development Workflow (Rules 1–10) exactly. This
skill orchestrates; it does not restate conventions — those load from the
scoped `CLAUDE.md` files as work moves between folders.

## Procedure

### 1. Load and verify

Read `docs/implementation/<id>.md`. Confirm every item in **Dependencies** is
shipped in `MODULES.md`. A dependency is shipped when its status is `Done`,
`Done · refined by [ID]`, or `Done · extended by [ID]` — the `· refined` /
`· extended` suffix means the original row still holds and is safe to depend
on. **`Done · superseded by [ID]`** is **not** a satisfied dependency: the
old row is reference-only, the behavior now lives at the row referenced by
the supersession pointer. In that case, treat the referenced row as the real
dependency and confirm *its* status before continuing. If any dependency is
unmet, stop and tell the user — do not implement against missing work. If
blocking **Open questions** remain, ask the user before writing code.

State the chosen `MXX-FXX[-RXX]` ID explicitly (Rule 1).

### 2. Verify branch and flip status

The feature branch is created by `/feature-planning`, not here. Inspect HEAD
and confirm it matches the expected `feat-<id-lowercased>-<short-kebab-name>`
shape for the chosen item (per root `CLAUDE.md` Rules 3 + 4),
e.g. `feat-m04-f03-open-shift-endpoint`.

- If HEAD is on the expected branch, continue.
- If HEAD is on `main` or any other branch, **stop** and tell the user to
  run `/feature-planning <id>` first — that skill cuts the branch off
  `main` and writes the implementation doc onto it. Do not branch from
  this skill.

Once on the right branch, flip the item's `MODULES.md` row to `In Progress`
in the **same commit that starts the work** (Rule 2). That first commit
typically also carries the planning doc and any earlier discovery edits
that have been sitting uncommitted on the branch.

### 3. Implement phase by phase

Work one phase at a time, top to bottom. Each phase is a vertical slice; the
typical layer order for a backend feature is:

1. **Domain** — entity/enum changes (`FuelFlow.Domain`; zero packages, no EF
   attributes — see its `CLAUDE.md`).
2. **Infrastructure config + migration** — `IEntityTypeConfiguration<T>`,
   `DbSet`, global query filter, then `dotnet ef migrations add`. Follow the EF
   config conventions in `FuelFlow.Infrastructure/CLAUDE.md`.
3. **Application** — Command/Query record, DTO, FluentValidation validator,
   repository/service interface (`FuelFlow.Application/CLAUDE.md`).
4. **Infrastructure handler** — the `IRequestHandler`, returning `Result<T>`,
   applying the multi-tenancy guard.
5. **Api** — thin controller action dispatching via `IMediator`
   (`FuelFlow.Api/CLAUDE.md`).
6. **Frontend** — route + role guard, components, TanStack Query hook, Zod
   schema, i18n keys (`fuel-flow-web` scoped `CLAUDE.md` files).

For each task:

1. Implement it.
2. Verify against its **Acceptance** criterion.
3. Write the matching `[Fact]` test named `MXX_FXX_RXX_...` (Rule 7).
4. **Flip its `- [ ]` to `- [x]` in `docs/implementation/<id>.md`.** This is
   non-negotiable — the doc is a live tracker, not a frozen plan. Do this in
   the **same commit** as the task itself so the diff shows the work and the
   check-off together. A trailing "Implementation notes" summary at the end
   of the doc does **not** substitute for flipping the per-phase boxes — a
   reviewer scrolling the Phases section must see each completed task as
   `[x]`, not `[ ]`.
5. Record any deviation from the plan under **Implementation notes**.

Do not start the next phase until the current one is fully verified and its
boxes are checked.

**Surgical scope when flipping boxes.** Not every `- [ ]` in the doc is a
"task to do":

- Boxes under `### Phase N` (and sub-phases like `### Phase 1a`) and under
  `## MODULES.md edits required` → flip to `- [x]` as each lands.
- Boxes under `## Layers touched` denote *which Clean Architecture layers
  this feature touched* (Domain / Infrastructure / Application / Api /
  Frontend / Docs). For a layer the feature deliberately does **not** touch
  (e.g. a frontend-only feature leaves Domain/Infra/Application/Api
  unchecked), the `- [ ]` correctly conveys "not touched" — **do not flip
  it**. Bulk-replacing every `- [ ]` would lie about the scope.

Commit within the branch using conventional commits scoped by ID (Rule 7):
`feat(m04-f03): implement open-shift endpoint`.

### 4. Pre-PR checks

Before opening the PR (Rule 8):

- Backend `dotnet format` produces no diff; frontend ESLint + Prettier pass.
- Confirm the `MODULES.md` status flip to `Done` and any new rows are
  included in the diff (Rule 2).
- **Confirm the implementation doc is fully ticked.** Run
  `grep -c '^- \[ \]' docs/implementation/<id>.md` — the only remaining
  `- [ ]` boxes should be `## Layers touched` rows for layers the feature
  did not touch. If any task box under a `### Phase` heading or under
  `## MODULES.md edits required` is still `- [ ]`, either flip it (if the
  work was done and the flip was missed) or do not open the PR (if the
  work isn't actually done). A "tick the boxes" cleanup commit before
  push is acceptable; an unflipped doc at merge time is not.
- **Refresh the knowledge graph.** If `graphify-out/graph.json` exists, run
  `graphify update .` (AST-only, no API cost) so the graph reflects this
  feature's code, then commit the `graphify-out/` diff **with the feature** —
  fold it into the pre-PR commit that flips `MODULES.md` to `Done` and ticks
  any remaining boxes, scoped by ID. If `graphify-out/graph.json` does not
  exist, skip this step. The PR ships a current graph.
- **Keep `scripts/README.md` current.** If this item created or modified any
  dev-ops script (`scripts/*.ps1`, `server/*.ps1`), update that script's
  **What / When / How** entry in `scripts/README.md` in the **same PR** (and
  the rules in `scripts/CLAUDE.md` if the change introduces a new convention or
  gotcha). The README is the SSOT for how/when the scripts run — a script
  change with a stale README does not ship.

### 4.5. E2E verification (delegated to `/feature-e2e-testing`)

E2E verification used to live here as a long inline section. It now runs as
its own skill so it can also be invoked standalone (re-walks, deferred-E2E
backfills, ad-hoc re-verifications after a fix).

**When to run it:** any item whose `## Layers touched` ticks `Api` or
`Frontend`. Pure-docs items, or migration-only items with no user-visible
behavior, skip this step — `/feature-e2e-testing`'s own applicability gate
will write `E2E: N/A — docs-only` to the impl doc and return cleanly.

**How to run it:** invoke `/feature-e2e-testing` (no arguments needed — it
auto-derives the item ID from the current branch). The skill:

- Resolves the ID from `feat-<id>-<short>` HEAD.
- Reads `docs/implementation/<id>.md`, runs the applicability gate, then
  warns-and-proceeds if any task box under `### Phase` or
  `## MODULES.md edits required` is still `- [ ]`.
- Spawns the `feature-e2e-tester` subagent, which probes both dev servers
  (you must have `scripts/dev.ps1` running in your own terminal),
  baselines the landing page, walks every AC as a browser journey via
  the Playwright MCP, classifies bugs by the standard severity table
  (Critical / Regression-minor / Cosmetic), **fixes every Critical on
  this branch** with `fix(<id>): <symptom>` commits, codifies the
  passing journey as `fuel-flow-web/e2e-tests/<id>.spec.ts`
  (append-only if the spec already exists), runs
  `npm run test:e2e -- <id>` green, and appends a
  `## E2E verification (Playwright MCP)` section to the impl doc.
- Returns a summary: ACs walked, Critical bugs fixed (with SHAs), bugs
  deferred (with reason), spec path, spec-run result.

**Wait for it to finish before Step 5.** No PR may open while a Critical
bug remains unfixed; the subagent will stop and hand back the bug
description instead of pretending it's done.

See `.claude/skills/feature-e2e-testing/SKILL.md` for the full procedure
and `.claude/agents/feature-e2e-tester.md` for the agent definition.

### 5. Open the PR

Flip the document status to `in-review`, then invoke the `pr-workflow` skill to
push and open one PR against `main` for this item.

### 6. Hand back

Tell the user the item is implemented, the PR is open, `MODULES.md` is updated,
and the PR awaits their review and merge. Do not merge — that is the user's
call.

## Parallel work

Multiple items may be implemented at once ONLY if neither depends on the
other's unmerged work. Each gets its own branch, its own `feature-implementer`
subagent, and its own PR. Never implement an item in parallel with one of its
own dependencies. When unsure, serialize.

## Rules

- One PR per `MXX-FXX[-RXX]` item, targeting `main`, never auto-merged.
- The `MODULES.md` status flip ships in the same PR as the code (Rule 2) —
  never a follow-up.
- **The implementation document's checkboxes and status stay accurate as you
  go** — flip each `- [ ]` to `- [x]` in the same commit as the task it
  tracks. See Step 3 for the surgical-scope rules; see Step 4 for the
  pre-PR verification grep.
- **The committed graphify graph stays current.** Step 4 runs
  `graphify update .` (when `graphify-out/graph.json` exists) and the
  `graphify-out/` diff ships in the same feature PR — never a follow-up.
- **`scripts/README.md` stays current with the scripts.** Any item that creates
  or modifies a dev-ops script (`scripts/*.ps1`, `server/*.ps1`) updates that
  script's How/When entry in `scripts/README.md` in the same PR (Step 4) —
  never a follow-up.
- If reality diverges from the plan, stop and raise it with the user rather
  than improvising.
- **E2E verification runs before the PR is opened** for any item that
  touches `Api` or `Frontend` — delegated to `/feature-e2e-testing`
  (Step 4.5). Critical bugs are fixed on the same branch by the
  `feature-e2e-tester` subagent; no Critical bug merges with the feature.
- Every feature that ran an e2e verification ships a Playwright spec at
  `fuel-flow-web/e2e-tests/<id>.spec.ts`. Docs-only items are exempt.
