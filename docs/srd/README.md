# SRD conventions

Per-feature Software Requirements Document. Top-level index: [`../SRD.md`](../SRD.md).
Module-level scope, NFRs, and dependencies live in each module's `README.md`.

## File layout

```
docs/
├── SRD.md                       # high-level index: modules + feature titles + lifecycle
└── srd/
    ├── README.md                # this file: global conventions
    └── MXX-<kebab>/
        ├── README.md            # module spec: scope, NFRs, deps, feature index
        └── FXX-<kebab>.md       # one file per feature flow
```

- Module dirs: `MXX-<kebab>` — `M01-identity-and-authentication`, `M16-team-and-access`.
- Feature files: `FXX-<kebab>.md` — `F01-registration.md`, `F04-login.md`.
- One feature flow per file. Split into N features if a "feature" turns into N flows.

## Feature file template

Sections 1–11 in order. Empty sections write `_None._` — never omit.

```markdown
# MXX-FXX — <title>

| | |
|---|---|
| **Lifecycle** | `drafting`                                                            <!-- see Lifecycle below -->
| **Design**    | [`FXX-<slug>.tsx`](../../../fuel-flow-web/src/design/screens/MXX/FXX-<slug>.tsx)
| **Last updated** | 2026-06-27

<!-- Off-ramp only — replace the Lifecycle row above and append:
| **Superseded by** | [MXX-FYY](./FYY-<slug>.md) (2026-08-15)
| **Supersedes**    | [MXX-FAA](./FAA-<slug>.md)
| **Removed**       | 2026-08-15 — <one-line why>
-->

## 1. Purpose
2–3 sentences. Trigger, success state, why it exists.

## 2. User stories
| As a | I want to | So that |

## 3. Functional requirements
| ID | Requirement | Status |

## 4. Non-functional requirements
| Concern | Requirement |

## 5. Acceptance criteria
| ID | Given | When | Then |

## 6. Design flow
Link to playground file + ordered screen list + states covered.

## 7. Dependencies
| Relation | Target | Why |

## 8. Audit emissions
| Event | Fields | Sink |

## 9. API surface
| Method | Path | Body | Responses |

## 10. Open questions
Append-only.

## 11. Change history
`- **YYYY-MM-DD** — <change>.`  Trivial edits don't go here; `git log` covers those.
```

## Section rules

| Section | Rule |
|---|---|
| §1 Purpose | 2–3 sentences. Longer → probably two features. |
| §3 Requirements | `MXX-FXX-RXX` IDs, contiguous from `R01`. Dropped rows → `Removed` status, never renumbered. |
| §4 NFRs | Module-wide NFRs apply by default — only list overrides or feature-specific concerns here. |
| §5 Acceptance criteria | Gherkin (Given / When / Then). One per row. Every failure mode must map to an AC. |
| §6 Design flow | Working relative link to the playground file. If no design yet: `_Design pending — see §10._` |
| §8 Audit emissions | M17's read contract. No events → `_None._` (explicit, not an oversight). |

## ID rules

- IDs stable once shipped. Renumber only during `drafting`.
- `FXX` flow-ordered inside each module — rationale lives in the module README.
- `RXX` append-only inside each feature.
- **Never reuse IDs.** Removed `RXX` rows and `superseded` / `removed` features keep their slots forever so every branch / commit / comment reference stays valid.
- Cross-feature links use full paths: `[M16-F01 Invite User](../M16-team-and-access/F01-invite-user.md)`.

## Lifecycle

`lifecycle:` is the single source of truth for *where a feature is*. Monotonic for healthy features; off-ramps for the edges. Bump in the same PR as the work — never ahead of state.

| State | Meaning | Gate to advance |
|---|---|---|
| `drafting` | Spec being written | §§ 1–10 frozen |
| `spec-locked` | Spec frozen; no design yet | Playground file `approved` in [`catalogue.ts`](../../fuel-flow-web/src/design/catalogue.ts) |
| `design-approved` | Design locked; no impl | First impl PR opens |
| `in-implementation` | At least one impl PR open / merged | Backend + frontend + E2E all on `main` |
| `shipped` | All R-rows `Done`, E2E green | terminal |
| `superseded` | Replaced by another feature | terminal; set `superseded_by:` |
| `removed` | Dropped before shipping | terminal; set `removed_reason:` |

At the **module level** the same vocabulary summarises every feature inside: `drafting` if ≥ 1 feature is still drafting, `shipped` when all are.

## R-row statuses

Independent of feature `lifecycle:` — a feature can be `in-implementation` with some R-rows `Done`, others `Planned`.

| Status | Meaning |
|---|---|
| `Drafting` | Wording still negotiable (feature is `drafting`) |
| `Planned` | Spec locked; not implemented |
| `In Progress` | At least one PR in flight |
| `Done` | Implemented + tested + on `main` |
| `Removed` | Dropped; row kept (never renumbered) with one-line reason |

## Changing or replacing a feature

| Change | Mechanism |
|---|---|
| Typo / link fix | Edit in place. `git log` is the record. No §11 entry. |
| Add / remove R, change AC | Edit in place. Flip dropped R-rows to `Removed`. **Add a §11 entry** with the why. |
| Wholesale replace | Old file: `lifecycle: superseded`, `superseded_by:`. New file: next free `FXX`, `supersedes: [<old>]`. Both stay forever. |
| Drop entirely | File: `lifecycle: removed`, `removed_reason:`, `removed_at:`. Module README index renders struck through; link still works. |

## Relationship to other docs

| Doc | Answers | Lifecycle |
|---|---|---|
| SRD feature file | *What* + *why* + when "done" (AC). | Stable; rarely changes after `spec-locked`. |
| [`docs/plans/<MXX>/<MXX-FXX>.md`](../plans/) | *How*: phase order, file list, migrations, tests. | Disposable; archived after PR ships. `module-plan.md` and `module-recap.md` are durable. |
| [`docs/MODULES.md`](../MODULES.md) | Legacy registry during transition. | Frozen for unmigrated modules; replaced with `→ moved to <SRD path>` on migration. |

**Implementation plans:** skip for trivial features (single file, copy-only, one endpoint reusing patterns). Generate via the `/plan-feature` skill for anything crossing Domain → Application → Infrastructure → Api → Frontend, or any UI feature with ≥2 screens / ≥3 acceptance criteria.

**Design files:** the `/designs` playground component IS the design — no separate Figma. TSX previews live at `fuel-flow-web/src/designs/<MXX-FXX>/*.tsx`. Update the SRD `Design` frontmatter + §6 link in the same commit as any playground rename. Generate via the `/design-feature` skill for features with ≥3 meaningful states OR ≥2 distinct viewport compositions OR real motion choreography; otherwise build the real component directly.

**MODULES.md transition:** new features → SRD only. Migrated features → MODULES.md row becomes `→ moved to <SRD path>` in the same PR that adds the SRD. Untouched modules stay in MODULES.md until their own migration pass.

## AI Workflow — full lifecycle

Each SRD feature moves through a spec-to-ship pipeline driven by AI slash-commands. The canonical protocol (stages, branch/PR conventions, backpressure, module-level synthesis, design-only PR path, module/feature lifecycle rules) lives in **[`docs/AI-WORKFLOW.md`](../AI-WORKFLOW.md)** — that is the source of truth. This section is a one-screen summary; read AI-WORKFLOW.md for the full protocol before starting new work.

### Stages at a glance

```
[0] SRD spec           /feature-discovery                docs/srd/MXX-*/FXX-*.md
        │
[1] Module plan   ★    /plan-module MXX                  docs/plans/<MXX>/module-plan.md
        │              (skip for ≤2-feature or non-interacting modules)
        │              §8 planning-necessity table decides per feature:
        │                "Yes" → go to [2] · "No" → skip to [3]
        │
[2] Feature plan       /plan-feature MXX-FXX             docs/plans/<MXX>/<MXX-FXX>.md
        │              (thinner when module-plan exists — inherits §2/§3/§4)
        │
[3] Design             /design-feature MXX-FXX           fuel-flow-web/src/designs/<MXX-FXX>/*.tsx
        │
        ├── [3.5] OPTIONAL design-only PR ──────► merged to main (dev-only route, zero prod impact)
        │
[4] Implementation     /feature-implementation MXX-FXX   server/** + fuel-flow-web/src/**
        │
[5] E2E                /feature-e2e-testing MXX-FXX      fuel-flow-web/e2e-tests/<MXX-FXX>.spec.ts
        │
[6] Ship               mcp__github__create_pull_request  merged feature PR
        │
[7] Feature recap      /recap-feature MXX-FXX            docs/plans/<MXX>/<MXX-FXX>-recap.md
        │
[8] Module recap  ★    /recap-module MXX                 docs/plans/<MXX>/module-recap.md
        (after all features in the module ship)

Optional integration coverage:
[J] Journey E2E        /journey-e2e                      docs/e2e-journeys/<name>.md
                                                          fuel-flow-web/e2e-tests/journeys/<name>.spec.ts
```

Stages marked ★ (module plan, module recap) and stage 3.5 (design-only PR) are AI Workflow v1 additions. See [`docs/AI-WORKFLOW.md`](../AI-WORKFLOW.md) for the full stage-by-stage protocol.

### Branch / push / PR at a glance

| Stage | Branch | Commits land as | Push | PR |
|---|---|---|---|---|
| [0] SRD spec | `main` | `docs(mxx-fxx):` | immediately | small docs PR straight to main |
| [1] Module plan | `feat-<mxx>-module-plan` | `docs(mxx): module plan` | after approval | small docs PR to main |
| [2] Plan | `feat-<id>-<name>` OR `design-<id>-<name>` | `docs(mxx-fxx): initial plan` | after approval | ✗ not yet |
| [3] Design | same branch as [2] | `design(mxx-fxx): <viewport> pass` | per phase | ✗ not yet |
| [3.5] Design PR (optional) | `design-<id>-<name>` | — | — | design-only PR to main; then cut fresh `feat-<id>-<name>` for [4] |
| [4] Implementation | `feat-<id>-<name>` | `feat(mxx-fxx): <layer> — …` | per layer | ✗ not yet |
| [5] E2E | same feature branch | `test(mxx-fxx): e2e spec` + `fix(mxx-fxx): …` | after clean pass | ✗ not yet |
| [6] Ship | same feature branch | — | — | **feature PR** to main |
| [7] Feature recap | `docs-<id>-recap` (off freshly-merged main) | `docs(mxx-fxx): post-ship recap` | after approval | small docs PR to main |
| [8] Module recap | `docs-<mxx>-module-recap` (off freshly-merged main) | `docs(mxx): module recap` | after approval | small docs PR to main |
| [J] Journey E2E | `feat-journey-<name>` | `test(journey): <name> plan` + `test(journey): spec + fixes` | after clean pass | one journey PR to main |

**Trivial features** (per `/design-feature` and `/plan-feature` "when to skip" rules): no plan.md, no design/*.tsx, no recap.md — just a small branch with the change + tests, straight to the feature PR at [6].

**Meta / tooling work** (skills, conventions, this repo's own scaffolding) isn't a feature. Use `chore-*` branch, ship as a normal PR to main. Doesn't need an `MXX-FXX` ID.

### Backpressure & staleness

Any stage can emit `ESCALATE_TO_SRD:` to kick a spec bug back to the source of truth. Any stage that reads plan.md or module-plan.md checks their `plan_last_updated:` against the SRD spec's `Last updated` and warns if stale. Full protocol in [`docs/AI-WORKFLOW.md`](../AI-WORKFLOW.md#backpressure-protocol).

### Rules (summary)

- **Backpressure is enforced.** No stage silently expands scope.
- **Skipping stages.** Trivial features may skip [1], [2], [3] entirely — see each skill's "when to skip" heuristic.
- **Lifecycle bumps in the same PR as the state change.** Never ahead of state, never behind.
- **`/feature-discovery` is the SRD gatekeeper.** New requirements MUST come through it.
- **`/plan-module` is the module synthesis point.** When present, its §2 shared model and §3 shared shells are authoritative — feature plans and designs inherit rather than re-declaring.
- **Every skill's output is a git-native markdown or code artefact.** No hosted-app dependencies.
