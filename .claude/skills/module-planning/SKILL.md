---
name: module-planning
description: Plan a complete module (MXX) before implementation. Reads docs/MODULES.md, lets the user pick a module, runs a module-level requirements interview, derives the dependency order and shared Foundation, and writes a module plan plus one granular task-level document per in-scope feature into docs/implementation/<MXX>/. Invoke with /module-planning, or use when the user wants to plan or scope a whole module.
disable-model-invocation: true
---

# Module Planning — Fuel Flow

Runs the planning stage for a whole module (`MXX`) before any code is written.
Manually invoked (`/module-planning`). Output is a reviewed module plan plus one
granular, task-level document per in-scope feature, all under
`docs/implementation/<MXX>/` — never code, never a commit, never a branch.

A module here carries 6–9 features, each with its own requirements, plus a
**shared spine** (common entities, a shared UI shell, a shared API surface,
shared i18n) and an internal build order. Planning a module well is not planning
each feature in isolation: it discovers the shared spine once, derives the order
features must be built in, and decomposes every feature to tasks granular enough
that implementation makes no scope decisions.

This skill assumes the Fuel Flow repo conventions in the root `CLAUDE.md`
(Rules 1–10) and the `MXX-FXX-RXX` registry in `docs/MODULES.md`.

## Procedure

### 1. Select and scope the module

Read `docs/MODULES.md`. The user either names a module (e.g. "plan M08") or asks
what to build next. If they ask, show the module ranking from the
`Priority & Implementation Order` section (modules in `Order` sequence) and let
them pick one.

Enumerate the chosen module's features (`### MXX-FXX` headings) with their
rolled-up statuses, and partition them with the user:

- **In scope** — `Planned` / `In Progress` features to build in this pass.
- **Already Done** — skip; note them as context the new work builds on.
- **Out of scope** — explicitly deferred this pass (v2, gated, or blocked).

Do not proceed until the in-scope set is agreed.

Per root `CLAUDE.md` Rule 1: if a feature or requirement surfaces during planning
that has no entry in `MODULES.md` yet, add it before planning continues — a new
`RXX` row or a new `### MXX-FXX` section with the next free number (append-only;
never reuse or renumber). State the chosen module ID explicitly at the start.

### 2. Check cross-module dependencies

From `Priority & Implementation Order` (the module's `Depends on (unmet)` cell),
`Appendix C — Priority Matrix` (each feature's `Depends on`), and the inline
cross-references in the requirement tables, list every **cross-module**
prerequisite the in-scope features need.

- If a hard blocker is not yet `Done` (e.g. "M04 needs M02 dip + M03 readings +
  M06 prices"), **stop** and tell the user. A module cannot be built against
  missing cross-module work.
- Record the satisfied cross-module dependencies in the module plan so the
  implementer knows what it is allowed to lean on.

### 3. Run the module requirements interview

`MODULES.md` already carries each feature's requirement text and acceptance
criteria — read them, do NOT re-derive. Interview the user to fill what the
registry does not capture, at **module** altitude. Ask a few focused questions at
a time, and ask a question only if its answer would change the plan. Cover:

- **Scope boundary & MVP** — the minimal path through the module that delivers
  value; what ships this pass vs. later.
- **Shared domain spine** — entities/enums shared across the module's features;
  for each, whether it is new here or *extends* an entity owned by another module
  (e.g. M08 tank/nozzle config extends M02/M03); FK/navigation between them.
- **Data & migration strategy** — new tables/columns per feature; one migration
  per feature (default) or batched; global query filter / multi-tenancy impact.
- **Information architecture** — how the module surfaces in the UI; a shared
  shell or tabbed page (cf. M08-F07 "Station Configuration"); route prefix; which
  roles see it.
- **Role × permission matrix** — what Owner / Manager / Custom users may do across
  the module's features.
- **Subscription gating** — which features are plan/tier-gated (cross-cutting
  rule: check subscription before gated modules).
- **API surface** — shared controller(s), route prefix, response-shape
  conventions reused across features.
- **i18n namespace** — the shared English + Urdu key namespace for the module.
- **Module-spanning journeys** — end-to-end flows that cross features (e.g.
  configure tank → add nozzle → set price → open shift) that the e2e walks will
  later exercise.
- **Out of scope** — what the module pass explicitly does not include.

Stop only when the module could be handed to another engineer who could build it
with no follow-up questions.

### 4. Derive the dependency order and Foundation

Order the in-scope features by their dependencies — both intra-module (feature B
needs feature A's entity or endpoint) and any already-`Done` cross-module edges.
The result is a linear build sequence with no cycles.

Extract the **Foundation**: the shared spine every feature leans on (shared
entities + their EF config/migration, the shared UI shell + navigation, the
shared API scaffolding, the shared i18n namespace). The Foundation is built
first, before any feature. If the module's shared surface is trivial, the
Foundation may be empty — say so.

The build sequence is therefore `Foundation → F.. → F.. → …`. Record it in the
module plan.

### 5. Decompose every feature to task-level granularity

For each in-scope feature, write one `docs/implementation/<MXX>/<MXX-FXX>.md`
from `references/feature-task-doc-template.md`. Break the work into the usual
vertical-slice phases — Domain → EF config + migration → Application
(command/query + validator) → Infrastructure handler → Api controller →
frontend — and break each phase into **atomic tasks**. Every task names:

- the **layer** it belongs to,
- the **file(s)** it creates or edits (e.g. `FuelFlow.Domain/Entities/X.cs`,
  `…/Configurations/XConfig.cs`, a migration `Add_X`), and
- its **acceptance check** — how the implementer knows it is done.

Pull the acceptance criteria verbatim from `MODULES.md`; they become the
`MXX_FXX_RXX_...` `[Fact]` test names (Rule 7). In each feature doc's
**Shared-spine usage** section, record which Foundation entities / DTOs / routes /
i18n keys that feature consumes, so the implementer reuses rather than re-creates.

If the Foundation has real build work (it usually does), capture its tasks at the
same granularity in the `## Foundation tasks` section of `_module-plan.md`. The
implementer builds it first.

Do NOT restate convention detail (EF config section order, controller pattern,
CQRS naming, component patterns). Those live in the scoped `CLAUDE.md` files and
load automatically when the implementer works in that folder. The plan references
them; it does not copy them. Genuinely undecided points go under each doc's
"Open questions" — do not invent requirements.

### 6. Write the module plan

Write `docs/implementation/<MXX>/_module-plan.md` from
`references/module-plan-template.md`. Fill it from `MODULES.md` plus the
interview: the in-scope / out-of-scope / already-Done partition, the cross-module
dependencies, the shared Foundation and its tasks, the dependency order and build
sequence, the module-spanning journeys, and links to each per-feature task doc.
Note any `MODULES.md` rows the work added or must flip.

### 7. Hand back for review

Give the user:

- The module plan path (`docs/implementation/<MXX>/_module-plan.md`) and the list
  of per-feature task docs written alongside it.
- The build sequence (`Foundation → F.. → F.. → …`).
- Next step: run `/module-implementation <MXX>` — it cuts `module/<MXX>` off
  `main`, commits this `docs/implementation/<MXX>/` directory, then builds the
  Foundation and every feature in order on that one branch, ending in a single PR.

Remind them: review and edit the plan and the task docs before implementation
starts. No branch is cut and nothing is committed by this skill — the plan docs
ride the module branch the orchestrator creates. Per Rule 1, the `MODULES.md`
edits, these planning artefacts, and the implementation all ship in the **same
PR** (the single module PR) — not as follow-ups. Do not write code from this
skill.

## Notes

- Plan one module per run; one `docs/implementation/<MXX>/` directory per module;
  one `_module-plan.md` plus one `<MXX-FXX>.md` per in-scope feature.
- Already-`Done` features are not re-planned — they are context, listed in the
  module plan so the implementer knows what it can lean on.
- This skill never commits, never pushes, never opens PRs, and never cuts a
  branch. It writes the plan and the task docs; the orchestrator
  (`/module-implementation`) owns the branch and the build.
