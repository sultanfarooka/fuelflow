---
name: recap-module
description: Post-module recap after every feature in a module has shipped. Diffs the shipped module against `module-plan.md` — cross-feature deviations, shared-model drift, shell drift, event-schema noise, tech debt at the module scale, and learnings that should feed the next module. Produces `docs/plans/<MXX>/module-recap.md` and flips the module lifecycle to `shipped`. Complements `/recap-feature` (per-feature diff) with a module-scale retrospective. Runs when the last feature in a module ships (or backfill anytime after).
---

# /recap-module — post-module retrospective

The closing stage of AI Workflow (see [`docs/AI-WORKFLOW.md`](../../../docs/AI-WORKFLOW.md)). After all features in a module have shipped, this skill:

- Reads `docs/plans/<MXX>/module-plan.md` (the pre-ship cross-feature contract)
- Reads every feature's `docs/plans/<MXX>/<MXX-FXX>-recap.md`
- Reads the shipped code (shared entities, shared shells in `_shared/`, migrations, audit registrations)
- Detects module-scale deviations that no single `/recap-feature` would catch
- Writes `docs/plans/<MXX>/module-recap.md`
- Flips the module lifecycle in `docs/SRD.md` to `shipped`

The module recap is the artefact that answers "how did this module actually come together, and what should the NEXT module bake into its plan from day one?" six months later.

## When to use

- **After the last feature in the module ships.** The moment the final feature PR merges to `main`, `/recap-module MXX` is the closing stage.
- **Standalone / backfill** — for modules that shipped before AI Workflow existed. Same shape, `backfilled: true` in frontmatter.
- **Optional but strongly encouraged** — the token cost is small compared to the value of feeding learnings into the next module's `/plan-module`.

Skip only when:

- Module skipped `/plan-module` in the first place (no `module-plan.md` to diff against).
- Module was `superseded` or `removed` before all features shipped.

## Workflow

### Phase A — Load context

1. Parse the module ID from `$ARGUMENTS`. Accept `MXX`.
2. Locate artefacts:
   - Module plan: `docs/plans/<MXX>/module-plan.md` (mandatory — if missing, return `BLOCKED: no module-plan.md — nothing to diff against`).
   - Module README: `docs/srd/M{XX}-*/README.md`.
   - Every feature spec: glob `docs/srd/M{XX}-*/F*.md`.
   - Every feature recap: glob `docs/plans/<MXX>/<MXX-FXX>-recap.md`.
   - Shared entities in shipped code: grep for entity names from module-plan §2 across `server/FuelFlow.Domain/**`.
   - Shared shells in shipped code: glob `fuel-flow-web/src/designs/_shared/**` + grep for the shells named in module-plan §3 across `fuel-flow-web/src/**`.
   - Migrations touching module entities: `server/FuelFlow.Infrastructure/Migrations/*<matching>*`.
   - Audit registrations: grep for the events in module-plan §4 across M17-F01 spec + code.
   - Feature PRs: fetch via `mcp__github__list_pull_requests` filtered by branch prefix `feat-<mxx>-*` and `design-<mxx>-*`.
3. Verify every feature in `features_in_scope` (from module-plan frontmatter) is at lifecycle `shipped`. If any isn't, ask the user via `AskUserQuestion`:
   - **Continue anyway** (partial recap — flag unshipped features in the output)
   - **Cancel and wait for remaining features to ship**

### Phase B — Cross-feature diff

Compare module-plan → shipped across seven dimensions. For each, note **what module plan said**, **what actually shipped**, and **status** (matched / drifted / extended / dropped).

1. **Cross-feature interaction (§1)** — did every planned interaction get wired? Did new interactions emerge during implementation that weren't in the diagram?
2. **Shared data model (§2)** — did the shipped entities match the plan? Any fields added mid-flight? Any features that reshaped an entity when they shouldn't have (grep migrations for surprises)?
3. **Shared UI shells (§3)** — do the shells at `_shared/` match the plan? Any features that re-implemented a shell inline (drift)? Grep for shell names inside feature design/production code — hits outside `_shared/` are the smoking gun.
4. **Event / audit flow (§4)** — did every planned event get emitted AND registered in M17? Any emitted events not in the plan? Any planned events silently dropped?
5. **Auth / permission matrix (§5)** — do the shipped role guards match the plan? Grep `[Authorize(Roles = ...)]` and route-guards for each feature.
6. **Shipping sequence (§6)** — did features ship in the planned order? What actually happened vs the DAG? (Reorderings are common and usually fine — flag them without judgement.)
7. **Module-wide open questions (§7)** — for each `MOQ-N`, what was the resolution? Any left unresolved?

For each material deviation, ask the user via `AskUserQuestion`:

- **Intentional and correct** — will be recorded with the reason
- **Discovered too late to update module plan** — recorded as "should have been in module plan"
- **Drift / bug** — recorded as a follow-up

### Phase C — Collect module-scale learnings

Ask via `AskUserQuestion` (optional — user can skip any):

- **What went well at the module level?** Where did upfront synthesis pay off?
- **What surprised you?** Where did reality diverge from the plan across features?
- **What module-scale tech debt was introduced?** e.g. shared shell duplicated in two features, entity fields that ought to move to a new entity, event schema that grew inconsistent.
- **What follow-ups span features?** e.g. shared refactor, cross-feature test coverage gap, audit gaps.
- **What should the NEXT module learn?** This feeds directly into the next `/plan-module` invocation. Examples:
  - "Lock the auth matrix before designing anything — F04 vs F07 role split cost a week of rework."
  - "Shared shells work — every future auth-adjacent module should reuse `AuthBrandPanel`."
  - "M17 audit registration should happen in §4 of the module plan, not in per-feature specs — cut it once, not N times."

### Phase D — Write module-recap.md

Assemble the recap and present for approval before writing. On approval:

- Write `docs/plans/<MXX>/module-recap.md`.
- Ensure module lifecycle is `shipped`:
  - Update the module heading `Lifecycle:` in `docs/SRD.md`.
  - Confirm each feature's row is `shipped` (fixup any stragglers).
- Print handoff summary:
  - Recap path
  - Deviation count + severity
  - Follow-up count
  - Suggested next-module reads (e.g. "M03 Financial's `/plan-module` should read this recap's learning about shared entity ownership")

## `module-recap.md` structure

```markdown
---
module: MXX
title: <from module README>
shipped_at: YYYY-MM-DD  (date the last feature merged)
features_shipped: [F01, F02, F04, F07, F08]
prs: [<url>, <url>, ...]
backfilled: false
recap_last_updated: YYYY-MM-DD
---

# MXX — <title> · Module Recap

> Post-ship module-scale diff. Pairs with:
> - Module plan: [module-plan.md](./module-plan.md)
> - Feature recaps: [F01](./M01-F01/recap.md), [F02](./M01-F02/recap.md), ...
> - Module README: [MXX](../../srd/MXX-*/README.md)
> - AI Workflow: [`docs/AI-WORKFLOW.md`](../../AI-WORKFLOW.md)

## Cross-feature deviations

| Dimension | Module plan said | Shipped | Status | Reason |
|---|---|---|---|---|
| Interaction diagram | … | … | matched / drifted | … |
| Shared data model | … | … | … | … |
| Shared UI shells | … | … | … | … |
| Event / audit flow | … | … | … | … |
| Auth matrix | … | … | … | … |
| Shipping sequence | Planned order F01→F02→F04→F07 | Actual F01→F02→F07→F04 | reordered (fine) | F07 unblocked earlier |
| Open questions | MOQ-1 unresolved at plan | Resolved during F04 impl: shared bucket | resolved | … |

## What went well

- …

## What surprised us

- …

## Module-scale tech debt introduced

- **MTD-1:** … (feature / file / owner)

## Cross-feature follow-up items

- **MFU-1:** … (severity, target milestone, affected features)

## Learnings for the next module

- **ML-1:** … (which future module this should inform — e.g. "M03 `/plan-module` should …")

## Files touched at the module level

<Auto-list from git across all merged feature PRs. Group by:>
- Shared domain entities (`server/FuelFlow.Domain/**` matching module-plan §2)
- Shared shells (`fuel-flow-web/src/designs/_shared/**` matching module-plan §3)
- Shared migrations (module-scope schema changes)
- Cross-feature audit registrations (M17-F01)
```

## Contract with `/plan-module`

- **Reads module-plan.md as authoritative pre-ship contract.**
- **Reads every feature recap** as the per-feature ground truth.
- **Feeds forward into future `/plan-module` invocations.** When `/plan-module` runs on a new module, it should read the recaps of any dependency modules cited in the new module's README. Learnings shape the module plan.
- **Not a bug tracker.** Follow-ups are noted, not managed. They should be filed as issues or added as new R-rows via `/feature-discovery`.

## Cost note

Small module (2–3 features): ~15k tokens.
Medium module (5–8 features): ~25k tokens.
Large module (10+ features): ~40k tokens.

The savings live downstream: the next module's `/plan-module` reads this recap in ~5k tokens and avoids repeating the same mistakes.

## Rules

- **One module per invocation.** Multi-module recaps → multiple invocations.
- **Module plan is the pre-ship contract.** Feature recaps are the per-feature contracts. Module recap synthesises across.
- **Never rewrite the module plan.** If reality diverged, the recap records it — the plan stays as the historical intent. This is the whole point of durable plan.md.
- **Module lifecycle → `shipped` in the same PR as the recap.** Never as a follow-up.
