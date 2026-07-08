# AI Workflow

The spec-to-ship pipeline that every Fuel Flow feature moves through, driven by AI slash-commands. Each stage produces a durable git-native artefact; each artefact is the next stage's scope contract.

> **This is a living document.** Evolve it as we learn. When a stage changes shape, update this file first, then the skill files, then the referenced summaries in root `CLAUDE.md` / `README.md` / `docs/srd/README.md`.

## Contents

1. [Design principles](#design-principles)
2. [Pipeline overview](#pipeline-overview)
3. [Module lifecycle](#module-lifecycle)
4. [Feature lifecycle](#feature-lifecycle)
5. [Stage-by-stage protocol](#stage-by-stage-protocol)
6. [Design-only PR path (stage 3.5)](#design-only-pr-path)
7. [Backpressure protocol](#backpressure-protocol)
8. [When to skip a stage](#when-to-skip-a-stage)
9. [Token cost heuristics](#token-cost-heuristics)
10. [Propagation rules](#propagation-rules)
11. [Evolution rules](#evolution-rules)

---

## Design principles

- **Synthesis before decomposition.** A module is a system, not a bag of features. Cross-feature concerns (shared model, shared shell, event flow, auth matrix) get decided at the module level *before* any feature plan locks in a conflicting choice.
- **Cheap stages skip themselves.** Each stage has a "when to skip" heuristic. Trivial features can go straight from SRD to ship. Non-interacting modules can skip module planning.
- **Forward-flowing, with backpressure.** Later stages read earlier artefacts as authoritative. If a later stage finds a spec bug, it emits `ESCALATE_TO_SRD:` — no silent scope expansion.
- **Everything is git-native.** Markdown, TSX, C# — no hosted apps, no vendor lock-in. GitHub renders every artefact, including mermaid.
- **One decision, one artefact.** The Rebus of shared data model lives in exactly one place (module plan §2). Feature plans inherit; they don't re-declare.
- **Stop at any stage.** The `lifecycle:` field records where you left off. Coming back weeks later means running the next command against the same `MXX-FXX`.

---

## Pipeline overview

```
[0]  SRD spec           /feature-discovery                docs/srd/MXX-*/FXX-*.md
        │
[1]  Module plan  ★     /plan-module MXX                  docs/plans/<MXX>/module-plan.md
        │
        ├── §8 planning-necessity table decides per feature:
        │      "Yes, needs feature plan"  → go to [2]
        │      "No, plan covers it"       → go to [3]
        │
[2]  Feature plan       /plan-feature MXX-FXX             docs/plans/<MXX>/<MXX-FXX>.md
        │
[3]  Design             /design-feature MXX-FXX           fuel-flow-web/src/designs/<MXX-FXX>/*.tsx
        │
        ├── [3.5] OPTIONAL design-only PR (see below) ──> merged to main; pause here for days/weeks
        │
[4]  Implementation     /feature-implementation MXX-FXX   server/** + fuel-flow-web/src/**
        │
[5]  E2E                /feature-e2e-testing MXX-FXX      fuel-flow-web/e2e-tests/<MXX-FXX>.spec.ts
        │
[6]  Ship               mcp__github__create_pull_request  merged feature PR
        │
[7]  Feature recap      /recap-feature MXX-FXX            docs/plans/<MXX>/<MXX-FXX>-recap.md
        │
[8]  Module recap  ★    /recap-module MXX                 docs/plans/<MXX>/module-recap.md
        (after all features in the module ship)
```

Stages marked ★ are new to AI Workflow v1. Stage [3.5] is new; the base pipeline through [7] existed under `docs/srd/README.md`'s full-feature-lifecycle section.

---

## Module lifecycle

Modules carry an explicit lifecycle. Today's derived aggregate (in [`docs/SRD.md`](SRD.md)) stays; the module-plan authoritative state is layered on top.

| State | Meaning | Gate to advance |
|---|---|---|
| `drafting` | Features in the module still being spec'd | ≥1 feature not yet `spec-locked` |
| `planned` | Module plan approved | `/plan-module MXX` output approved and written |
| `in-implementation` | ≥1 feature past `design-approved` and being built | first feature enters `in-implementation` |
| `shipped` | All features shipped, module recap written | terminal |

Aggregate rule (unchanged from `docs/srd/README.md`): the module-level lifecycle in `SRD.md` = the "earliest" lifecycle across its features. The module-plan state above is authoritative when the two differ (write the module-plan state to `SRD.md`).

**Terminal off-ramps** (rare): `superseded` (module replaced by another), `removed` (module dropped). Require user confirmation.

---

## Feature lifecycle

Unchanged. See [`docs/srd/README.md`](srd/README.md#lifecycle) for the canonical table:

`drafting` → `spec-locked` → `design-approved` → `in-implementation` → `shipped`, with off-ramps `superseded` / `removed`.

The only interaction with module planning: when [`/feature-discovery`](../.claude/skills/feature-discovery/SKILL.md) adds an R-row that materially changes module-plan §2 (data model), §3 (shell), §4 (events), or §5 (auth), affected `design-approved` features revert to `drafting` per [Propagation rules](#propagation-rules).

---

## Stage-by-stage protocol

### [0] SRD spec — `/feature-discovery`

Owns: what + why + acceptance criteria.
Artefact: `docs/srd/MXX-*/FXX-*.md` (or an R-row inside an existing feature file).
Lifecycle: `drafting` (or unchanged if just adding an R-row).
Branch: `main` — docs-only.
Commit: `docs(mxx-fxx): scaffold spec` or `docs(mxx-fxx): add R05`.
PR: small docs PR straight to main for non-trivial additions.

**New in AI Workflow:** Phase 3.5 cascade scan gains a **Module plan** category (see [Propagation rules](#propagation-rules)).

### [1] Module plan — `/plan-module MXX` ★

Owns: cross-feature synthesis. **New stage.**

Artefact: `docs/plans/<MXX>/module-plan.md` with:

| § | Content |
|---|---|
| 1 | **Cross-feature interaction diagram** — mermaid graph. Nodes = features; edges = "F01 creates User → F04 authenticates User". |
| 2 | **Shared data model** — the entities every feature in this module reads/writes. Locked here. Feature plans cannot reshape. Fields with `Owned by (creates) / Read by / Mutated by`. |
| 3 | **Shared UI shells** — layouts / navigation / brand surfaces used by ≥2 features. Names + file paths under `fuel-flow-web/src/designs/_shared/`. |
| 4 | **Event / audit flow** — emitter → event → consumer table. Feeds M17 audit registration in one pass. |
| 5 | **Auth / permission matrix** — feature × role × precondition. |
| 6 | **Shipping sequence & dependency DAG** — which features must ship first for which. Which can ship in parallel. |
| 7 | **Module-wide open questions** — cross-feature questions no single feature can answer alone. |
| 8 | **Per-feature planning necessity** — the routing table. `\| Feature \| Needs feature plan.md? \| Why \|`. Drives whether `/plan-feature` runs or is skipped. |

Lifecycle: module `drafting` → `planned` on approval. If any feature had already gone through `/plan-feature` and its answers conflict with the module plan, that feature's plan is invalidated — see [Propagation rules](#propagation-rules).

Branch: `feat-<mxx>-module-plan` (docs-only branch off main).
Commit: `docs(mxx): module plan`.
Push: after approval.
PR: small docs PR straight to main. Merges quickly — this unblocks all downstream work.

**Skip when:** module has 1–2 features (M16 today), OR features share nothing beyond namespace (M14 Reports — each report standalone). The `/plan-module` skill's "when to skip" heuristic makes this call.

### [2] Feature plan — `/plan-feature MXX-FXX` (conditional)

Owns: feature-specific decisions the module plan couldn't answer.
Artefact: `docs/plans/<MXX>/<MXX-FXX>.md`.

**Now optional.** Module plan §8 says whether this feature needs one. If §8 says "No", `/plan-feature` returns `SKIP: covered by module plan §8` and the pipeline advances directly to [3].

When required, the feature plan is now **thinner** because the module plan already owns the shared model and cross-feature deps:

| Section | Status |
|---|---|
| Screens inventory | keep (feature-specific) |
| User journey | keep (feature-specific) |
| Backend endpoints | keep (feature-specific) |
| AC → surface map | keep (feature-specific) |
| Open questions | keep — but module-wide Qs live in module plan §7 instead |
| Test strategy | keep (feature-specific) |
| Analytics events | keep (feature-specific) |
| Data model impact | **replace with**: "Inherits from module-plan §2. Delta: <none / specific fields>." |
| Cross-feature dependencies | **replace with**: "See module-plan §1 diagram. Delta: <none / new dep>." |

Lifecycle: `drafting` → `spec-locked` on approval (unchanged).
Branch: cut here — `feat-<id>-<name>` (or `design-<id>-<name>` if going for design-only ship — see [3.5]).
Commit: `docs(mxx-fxx): initial plan`.
PR: not yet.

### [3] Design — `/design-feature MXX-FXX`

Unchanged from today, plus:
- Phase 0 reads **both** `module-plan.md` (for shared shell §3) **and** `plan.md` (if it exists) as authoritative scope.
- Shared shells from module-plan §3 are imported from `fuel-flow-web/src/designs/_shared/` — never re-implemented.
- If module-plan §8 said "no feature plan", design agent works from module-plan + SRD spec directly (relaxed mode).

Lifecycle: `spec-locked` → `design-approved` on approval.
Branch: same feature branch.
Commits: `design(mxx-fxx): desktop pass` / `tablet pass` / `mobile pass`.
Push: after each viewport phase (per [memory rule](../../.claude/projects/e--Fuel-Flow/memory/feedback_ui_iteration_review.md)).
PR: not yet — unless you take the [design-only PR path](#design-only-pr-path).

### [3.5] Design-only PR path ★ (optional)

See dedicated section [below](#design-only-pr-path).

### [4] Implementation — `/feature-implementation MXX-FXX`

Unchanged from today, plus:
- Reads `module-plan.md` §2 as the authoritative shared model — cannot reshape entities.
- Reads `plan.md` if present, else module-plan + design + SRD spec.

Lifecycle: `design-approved` → `in-implementation`.
Branch: same feature branch (or new `feat-<id>-<name>` cut off freshly-merged main if design-only PR was taken).

### [5] E2E — `/feature-e2e-testing MXX-FXX`

Unchanged.

### [6] Ship — feature PR

Unchanged. Use `mcp__github__create_pull_request`. Contains everything on the branch: plan (if any), design (if not yet merged via [3.5]), production code, E2E spec, SRD lifecycle flip.

### [7] Feature recap — `/recap-feature MXX-FXX`

Unchanged from today. Diffs `plan.md` (or module-plan §8 skip note) vs shipped reality.

### [8] Module recap — `/recap-module MXX` ★

Owns: post-module retrospective. **New stage.**

Runs after all features in the module are `shipped`.

Artefact: `docs/plans/<MXX>/module-recap.md` with:

- **Deviations table** — module-plan §1–§7 vs what actually shipped across the module.
- **Cross-feature learnings** — patterns that only emerged when multiple features shipped together.
- **Tech debt at the module level** — shared shell drift, model bloat, event schema noise.
- **Follow-up items** — cross-cutting refactors owed.
- **Learnings for the next module** — what to bake into that module's plan from the start.

Lifecycle: module → `shipped`.
Branch: `docs-<mxx>-module-recap` off freshly-merged main.
PR: small docs PR straight to main.

---

## Design-only PR path

For the "design every feature first, then implement each later" workflow. **Optional** — orthogonal to the module plan.

### Why it works safely

`fuel-flow-web/src/designs/**` is dev-only. The `/designs` route is gated on `import.meta.env.DEV`. The Vite production bundle strips it entirely — designs on `main` have **zero production impact**.

### The two-PR flow

```
                       ┌─────────────────────────────────────────┐
[2] Feature plan ──────┤ Branch: design-<id>-<name>              │
[3] Design ────────────┤ Commits: docs(mxx-fxx): initial plan    │
                       │          design(mxx-fxx): desktop pass  │
                       │          design(mxx-fxx): tablet pass   │
                       │          design(mxx-fxx): mobile pass   │
                       │ Push after each phase                   │
                       └─────────────────────────────────────────┘
                                          │
[3.5] Design PR                            ▼
      Title:   M01-F02 (design): phone OTP verification
      Body:    "Design + plan checkpoint. Implementation to follow in a separate PR."
               - Link module-plan.md as scope contract.
               - Link plan.md (if present).
               - Note: design is dev-only — no prod impact.
      Contains: plan.md + designs/*.tsx + SRD lifecycle flip → design-approved
                                        + SRD.md index update to design-approved
      Merged:  Yes, straight to main.
                                          │
                                          ▼   (days / weeks — implementation on your schedule)
[4] Implementation ─────┐ Branch cut off freshly-merged main:
                        │   git checkout main && git pull --ff-only
                        │   git checkout -b feat-<id>-<name>
[5] E2E ────────────────┤ Commits: feat(mxx-fxx): domain / app / infra / api / frontend
                        │          test(mxx-fxx): e2e spec
                        │          fix(mxx-fxx): <bugs found in E2E>
                        │ Push after each layer
                        └───────────────────────────────────────────────
                                          │
[6] Implementation PR                     ▼
      Title:   M01-F02: phone OTP verification
      Body:    Link back to the merged design PR.
               Note: design already on main — this PR contains prod code + E2E only.
      Contains: prod code + E2E spec + SRD lifecycle flip → shipped
```

### Branch naming pair

| Purpose | Branch |
|---|---|
| Plan + design → design PR | `design-<id>-<name>` |
| Implementation + E2E → feature PR | `feat-<id>-<name>` |

Matches the existing `docs-<id>-recap` "small follow-up branch" convention. Distinct branch names avoid the "same branch merged twice" confusion.

### When to take this path

- ★ **You want to design all features in a module first**, ship each design to `main` as it's approved, then come back per feature to implement.
- ★ **Shared shells stabilise incrementally** — feature F02's design PR merges the shared brand panel; feature F03's design starts by importing what's already on `main`.
- Design review happens on `main` in the real repo, not a stale branch.
- Long gap expected between design approval and implementation (blocked on unrelated work, awaiting stakeholder decision, etc.).

### When to skip it (use the single-PR path at [6])

- You're implementing in the same sitting as designing.
- Trivial features that skipped `/design-feature` anyway.
- Cross-cutting infra work (no design to ship).

---

## Backpressure protocol

Unchanged from [`docs/srd/README.md`](srd/README.md#backpressure--escalation-from-any-stage). Any stage may emit:

```
ESCALATE_TO_SRD:
Feature: MXX-FXX  (or Module: MXX for module-plan escalations)
Reason: <what's inconsistent, missing, or contradicted>
Suggested action: <invoke /feature-discovery / refresh module-plan / edit spec>
State: <what phase you were in — so we can resume>
```

Main thread saves progress, surfaces to user, invokes the suggested skill on approval, resumes.

**New in AI Workflow:** module-plan can escalate too. If `/plan-module` finds two features' §7 Dependencies contradict each other, it escalates to `/feature-discovery` to reconcile.

---

## When to skip a stage

| Stage | Skip when |
|---|---|
| [1] Module plan | Module has ≤2 features (M16), OR features share nothing beyond namespace (M14). |
| [2] Feature plan | Module plan §8 says "no" for this feature. OR feature is trivial (single-file, copy-only, one endpoint reusing patterns). |
| [3] Design | Feature has <3 states AND <2 distinct viewports AND no motion choreography. See [`/design-feature`](../.claude/commands/design-feature.md) "when to skip" table. |
| [3.5] Design PR | You're proceeding straight to implementation in the same sitting. |
| [5] E2E | Never — every feature ships with at least a happy-path E2E. |
| [7] Feature recap | Feature was reverted or superseded before ship. |
| [8] Module recap | Module skipped [1] (nothing to diff against). |

**Never skip [0] SRD spec.** Every feature has a spec, always.

---

## Token cost heuristics

Rough per-invocation cost, useful for deciding whether to batch or split.

| Command | Small feature | Large feature |
|---|---|---|
| `/feature-discovery` | ~15k (one classification) | ~35k (cascade across many features) |
| `/plan-module MXX` (new) | ~25k (3-feature module) | ~60k (10-feature module with many events) |
| `/plan-feature MXX-FXX` (thinner in AI Workflow) | ~12k | ~20k |
| `/design-feature MXX-FXX` per viewport phase | ~40k | ~60k |
| `/feature-implementation MXX-FXX` per layer | ~30k | ~50k |
| `/feature-e2e-testing MXX-FXX` | ~25k | ~40k |
| `/recap-feature MXX-FXX` | ~12k | ~25k |
| `/recap-module MXX` (new) | ~20k | ~35k |

### Module-level savings

For an 8-feature module with tight cross-feature interaction:

| Path | Total tokens (rough) |
|---|---|
| Today: `/plan-feature` × 8 (each reads all siblings) | ~160k |
| AI Workflow: `/plan-module` + `/plan-feature` × 3 (§8 skips 5) | ~70k |
| AI Workflow: `/plan-module` + `/plan-feature` × 8 (§8 requires all) | ~130k |

Bigger win comes from `/plan-module` deciding how many features actually need their own plan.

---

## Propagation rules

### When adding a new feature or R-row (via `/feature-discovery`)

Phase 3.5 cascade scan now checks a **5th impact category** — module plan:

| Impact category | What to look for | Proposed edit |
|---|---|---|
| §7 Deps (existing) | inbound / outbound cross-feature deps | edit dependent features' §7 |
| §1 / §6 refs (existing) | cross-references in prose | update links / wording |
| §8 Audit emissions (existing) | new event types | update M17-F01 catalogue |
| §9 API surface (existing) | overlapping endpoints | update owning feature's §9 |
| **Module plan** ★ | Does the new ask touch module-plan §2 (data model), §3 (shell), §4 (events), §5 (auth), §6 (shipping order)? | Bundle module-plan.md edits into approval gate. Trigger lifecycle reversion per rules below. |

### Lifecycle reversion (when module plan changes)

| Module plan section changed | Consequence for module lifecycle | Consequence for feature lifecycles |
|---|---|---|
| §2 Data model — substantive change | `planned` → `drafting` | Any feature at `design-approved` or later that reads/writes the affected entity → revert to `drafting`. Warn user; require confirmation for `in-implementation` reverts. |
| §3 Shared shell — new / changed | stays `planned` | Any `design-approved` feature that renders the affected shell → revert to `spec-locked`. Design playground may need re-approval. |
| §4 Events — new event | stays `planned` | Add to M17-F01 catalogue in same PR. No lifecycle revert. |
| §4 Events — changed event schema | `planned` → `drafting` | Any feature that consumes the changed event → revert to `spec-locked`. |
| §5 Auth matrix — role added/removed | stays `planned` | Affected features' §7 Dependencies get an audit trail entry. No lifecycle revert unless behaviour breaks. |
| §6 Shipping order — reordered | stays `planned` | No lifecycle revert. Warn user if a `design-approved` feature is now blocked by an unimplemented dependency. |
| §7 Open questions — new/answered | stays `planned` | No revert. |
| §8 Planning necessity — feature flag flip | stays `planned` | If a "No" feature is flipped to "Yes" AND already at `design-approved`, warn that a plan might now be overdue (usually can just skip and continue). |

**Terminal reverts (`shipped` back to anything) ALWAYS require explicit user confirmation.**

All propagated edits land in the same PR as the primary edit. Never as follow-ups.

---

## Evolution rules

This document is expected to change. When it does:

1. **Update this file first.** Get the shape right.
2. **Then update the skill files.** Any skill that a changed stage references must be updated in the same PR.
3. **Then update the summary pointers** — root `CLAUDE.md`, root `README.md`, `docs/srd/README.md`. These files SUMMARISE this doc; they don't own the workflow.
4. **Add a §11-style change entry at the bottom of this file** — one line per material change, dated. `git log` covers the rest.

Anti-patterns to avoid:

- Documenting the pipeline in multiple places with slightly different words. If a scoped `CLAUDE.md` or `README.md` describes AI Workflow, it should link to this file, not duplicate it.
- Making stages mandatory that could be optional. Optionality via clear "when to skip" heuristics is a feature.
- Naming conventions that don't map to git. Every branch / commit / PR should be derivable from the workflow.

## Change history

- **2026-07-07** — Initial AI Workflow v1. Adds `/plan-module`, `/recap-module`, design-only PR path [3.5], module lifecycle, module-plan cascade in `/feature-discovery`. Extracted from `docs/srd/README.md`'s full-feature-lifecycle section, extended with new stages.
