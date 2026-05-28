---
name: feature-implementation
description: Implement a planned MXX-FXX[-RXX] item from its document in docs/implementation/. Use whenever the user asks to build, implement, or work on a feature or requirement that already has an implementation document. Drives phase-by-phase work across the Clean Architecture layers and ends with a single feature PR.
---

# Feature Implementation — Fuel Flow

Drives building a `MXX-FXX[-RXX]` item that has already been planned. Assumes a
document exists at `docs/implementation/<id>.md`. If none exists, stop and tell
the user to run `/feature-planning` first.

Follows the root `CLAUDE.md` Development Workflow (Rules 1–9) exactly. This
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

### 4.5. E2E verification via Playwright MCP

Walk the feature in a real browser before the PR exists. This is where bugs
that unit tests can't catch — wiring mistakes, missing redirects, multi-tenancy
leaks, raw i18n keys leaking to the UI — surface.

#### A. Applicability gate

Run this step **only if** the implementation doc's `## Layers touched` section
ticks `Api` or `Frontend`. For pure-docs items (only `Docs` ticked, or only
`MODULES.md edits` performed), skip Step 4.5 entirely and write
**`E2E: N/A — docs-only`** under Implementation notes. Migration-only items
that add a column but ship no user-visible behavior also skip — note the
reason.

#### B. Bring the app up

Probe with `mcp__playwright__browser_navigate` against
`http://localhost:5173`. If the page fails to load, **stop and tell the user
to run `scripts/dev.ps1`** in their own terminals — both
`http://localhost:5173` (frontend) and `http://localhost:5035` (backend) must
be reachable. Do not launch the dev servers from the agent; they need their
own terminal windows.

Once both servers respond, establish a baseline: navigate to the landing
page, run `mcp__playwright__browser_snapshot` and
`mcp__playwright__browser_console_messages`. No app-origin `error` entries
should appear. Record the baseline as the first item in the impl doc's new
`## E2E verification` section (template in block F).

#### C. Walk every acceptance criterion as a journey

For each `ACx` in the implementation doc's **Acceptance criteria** section
(and the parallel `## Acceptance criteria` items in `MODULES.md`):

1. Translate the AC into a concrete browser sequence (navigate → fill →
   click → wait → assert). Write it down in the `## E2E verification`
   section *before* executing — the doc is the journey script.
2. Execute via the Playwright MCP. Prefer high-level tools
   (`browser_fill_form`, `browser_click`, `browser_select_option`,
   `browser_wait_for`) over `browser_evaluate` / `browser_run_code_unsafe`
   — semantic interactions translate cleanly to the Playwright spec you
   write in block E; raw JS evaluation does not.
3. After each interaction collect three signals:
   - **`browser_snapshot`** — accessibility tree confirms the expected UI
     state (form visible, success toast rendered, route changed, etc.).
   - **`browser_console_messages`** — any `error` or `warning` since the
     last check. Filter browser-extension noise; only app-origin entries
     count.
   - **`browser_network_requests`** — confirm expected API calls fired
     and returned the expected status code. A "success" UI that paired
     with a silent 500 is a Critical bug.
4. If the AC contains a rule with two sides (e.g. *"credit sale blocked
   at/above credit limit"*), walk **both** the pass case and the fail
   case. A passing happy path tells you nothing about whether the
   validation is wired.
5. At the assertion point of each journey, take
   `mcp__playwright__browser_take_screenshot` saved under
   `.playwright-mcp/<id>/<journey-name>.png`. The directory is already
   untracked; do not commit screenshots unless explicitly requested.

#### D. Bug detection + fix loop

A potential bug is anything in the table below. Classify it the moment you
see it — don't roll detection into a "I'll fix it later" pile.

| Signal | Severity |
|---|---|
| AC fails to execute (form won't submit, button missing, page errors out) | **Critical** |
| Unhandled console `error` originating from app code | **Critical** |
| Network request returns 5xx, or 4xx when the AC expected 2xx (or vice versa) | **Critical** |
| Required field shown as a raw i18n key (e.g. `auth.login.email`) instead of translated copy | **Critical** — Pakistani-market UX rule |
| Multi-tenancy leak (data from another `StationId` visible in a non-Owner view) | **Critical** — security |
| AC passes but throws a non-fatal console `warning` (React key, missing i18n key, dev-only deprecation) | **Regression / minor** |
| Visual issue not tied to AC text (broken layout, overflow, dark-mode contrast) | **Minor / cosmetic** |

**Fix-loop rules:**

1. **Every Critical bug is fixed on the same feature branch before the PR
   exists.** Stop the journey walk-through. Read the relevant
   Command/Handler/component file to find the root cause — don't guess.
   Append one line to the impl doc's `## E2E verification` section:
   `Bug: <symptom> → cause: <one-line> → fix: <commit-sha or "next commit">`.
   Implement the fix using a conventional commit
   `fix(mxx-fxx[-rxx]): <symptom>`. Re-run the failing journey from the
   start — confirm it now passes cleanly. Loop until no Critical remains.
2. **Regression / minor:** fix if the cause is in code added by this
   feature. If it pre-exists in the codebase, log it under Implementation
   notes as **`Discovered, not fixed: <description>`** and mention it in
   the PR description's Test Plan. Do not expand the feature's scope to
   sweep pre-existing issues.
3. **Minor / cosmetic:** same rule as regression — fix if introduced here,
   log otherwise.
4. **Do not open the PR while any Critical remains unfixed.** If you
   genuinely cannot fix a Critical (ambiguous AC, blocked by another
   unmerged item, missing information from the user), stop the skill and
   hand back to the user with a clear bug description — same protocol as
   the existing "reality diverges from the plan" rule.

#### E. Codify the passing journey as a Playwright spec

Once every AC walks clean via the MCP, write
`fuel-flow-web/e2e-tests/<id>.spec.ts` that re-executes the same journey
using `@playwright/test`. One `test()` block per AC, named to mirror the
xUnit naming (e.g.
`test('M04_F03_R01 — only one open shift per station', ...)`). Use
`getByRole` / `getByLabel` selectors — the convention already in
`e2e-tests/example.spec.ts`. Run `npm run test:e2e -- <id>` once against
the running dev servers and confirm it passes. This produces the
permanent regression test for the feature.

Leave `e2e-tests/example.spec.ts` alone — it points at an external site
and is harmless. Do **not** edit `playwright.config.ts` (`baseURL`,
`webServer`) as part of any feature item — that is repo-wide tooling work
and belongs in its own item.

#### F. Document in two places

1. **`docs/implementation/<id>.md`** — append a new section:

   ```markdown
   ## E2E verification (Playwright MCP)

   Run when: <list ACs covered>. Performed via `mcp__playwright__*` against
   `http://localhost:5173` + `http://localhost:5035`. Screenshots in
   `.playwright-mcp/<id>/` (untracked).

   - [x] **Baseline** — landing page loads, no app-origin console errors
   - [x] **AC1 (M01_F09_R01)** — <journey description>; passed clean
   - [x] **AC2 (M01_F09_R02)** — <journey description>; passed after fix
     <commit-sha> (handler returned 200 but missing Location header, so
     the frontend never redirected on success)
   - [x] **Codified at** `fuel-flow-web/e2e-tests/<id>.spec.ts` —
     `npm run test:e2e -- <id>` green
   - Discovered, not fixed: <pre-existing issue> (logged in PR description)
   ```

2. **PR description** — fill in the E2E lines of the Test Plan template
   (see root `CLAUDE.md` Rule 6).

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
- If reality diverges from the plan, stop and raise it with the user rather
  than improvising.
- **E2E verification via Playwright MCP runs before the PR is opened** for
  any item that touches `Api` or `Frontend` (Step 4.5). Critical bugs are
  fixed on the same branch; no Critical bug merges with the feature.
- Every feature that ran an e2e verification ships a Playwright spec at
  `fuel-flow-web/e2e-tests/<id>.spec.ts`. Docs-only items are exempt.
