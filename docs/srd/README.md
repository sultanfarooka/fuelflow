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
| [`docs/implementation/<MXX>/<feature>.md`](../implementation/) | *How*: phase order, file list, migrations, tests. | Disposable; archived after PR ships. |
| [`docs/MODULES.md`](../MODULES.md) | Legacy registry during transition. | Frozen for unmigrated modules; replaced with `→ moved to <SRD path>` on migration. |

**Implementation plans:** skip for trivial features (single file, copy-only, one endpoint reusing patterns). Generate via the `/plan-feature` skill for anything crossing Domain → Application → Infrastructure → Api → Frontend, or any UI feature with ≥2 screens / ≥3 acceptance criteria.

**Design files:** the `/designs` playground component IS the design — no separate Figma. TSX previews live at `fuel-flow-web/src/designs/<MXX-FXX>/*.tsx`. Update the SRD `Design` frontmatter + §6 link in the same commit as any playground rename. Generate via the `/design-feature` skill for features with ≥3 meaningful states OR ≥2 distinct viewport compositions OR real motion choreography; otherwise build the real component directly.

**MODULES.md transition:** new features → SRD only. Migrated features → MODULES.md row becomes `→ moved to <SRD path>` in the same PR that adds the SRD. Untouched modules stay in MODULES.md until their own migration pass.

## Full feature lifecycle

Each SRD feature moves through this pipeline. Every artefact lives in git; every skill is a slash-command. The pipeline is one-way — each stage's output is the next stage's input.

```
[1] SRD spec
    Path      docs/srd/M{XX}-*/F{XX}-*.md
    Answers   What + why + acceptance criteria
    Managed   /feature-discovery
                — classifies any new "we should also…" ask against existing SRD
                — detects cascading impacts (§7 Deps, §1 refs, §8 audits, §9 API)
                — bundles all cross-feature edits into one approval gate
    Lifecycle drafting
    Branch    main — docs-only scaffolding, nothing being built yet
    Commit    docs(mxx-fxx): scaffold spec  |  docs(mxx-fxx): add R05
    Push      immediately (small, safe on main)
    PR        for non-trivial SRD additions, one small docs PR straight to main
        │
        ▼
[2] Plan  ─── CUT THE FEATURE BRANCH HERE ───
              git checkout main && git pull --ff-only origin main
              git checkout -b feat-<mxx-fxx>-<short-name>
              (short-name: 3–6 kebab words, e.g. feat-m01-f02-phone-otp-verification)
    Path      docs/implementation/<MXX-FXX>/plan.md
    Answers   Which screens, user journeys, backend flow, AC → surface map,
              open questions, test strategy, analytics, data model impact,
              cross-feature dependencies
    Managed   /plan-feature
                — reads the SRD spec + linked features
                — detects new requirements surfaced in-session → invokes
                  /feature-discovery inline; nothing unvalidated slips in
                — writes plan.md
    Lifecycle drafting  →  spec-locked  (on plan approval)
    Commit    docs(mxx-fxx): initial plan
              (backpressure SRD edits also land here — co-committed on this branch)
    Push      after plan approved — git push -u origin feat-<mxx-fxx>-<short-name>
    PR        NOT YET. Feature isn't testable. Expect follow-up changes.
        │
        ▼
[3] Design
    Path      fuel-flow-web/src/designs/<MXX-FXX>/*.tsx
    Answers   How it looks, moves, adapts across viewports, handles all states
    Managed   /design-feature
                — Phase 0 reads plan.md as the AUTHORITATIVE screen scope
                — resolves plan.md's open questions upfront via AskUserQuestion
                — phased desktop → tablet → mobile with approval gates
                — scoped visual verify (3 screenshots per phase) + dark mode
    Lifecycle spec-locked  →  design-approved  (on design approval)
    Branch    same feature branch
    Commit    design(mxx-fxx): desktop pass  |  design(mxx-fxx): tablet pass
              design(mxx-fxx): mobile pass
    Push      after each viewport phase (async design review per memory rule
              feedback_ui_iteration_review.md — push branch, no PR yet)
    PR        NOT YET.
        │       (skip [3] for trivial UI — see /design-feature "when to skip")
        ▼
[4] Implementation
    Path      server/**, fuel-flow-web/src/**
    Answers   Real API + Clean Architecture + tests
    Managed   /feature-implementation
                — reads plan.md + design/*.tsx as input
                — phase-by-phase across Domain → Application → Infrastructure
                  → Api → Frontend
    Lifecycle design-approved  →  in-implementation
    Branch    same feature branch
    Commit    feat(mxx-fxx): domain — <entity>
              feat(mxx-fxx): app — <command / query>
              feat(mxx-fxx): infra — <repo / integration>
              feat(mxx-fxx): api — <endpoint>
              feat(mxx-fxx): frontend — <route / form>
              (per-layer commits; conventional prefix per root CLAUDE.md Rule 7)
    Push      after each layer
    PR        NOT YET.
        │
        ▼
[5] End-to-end verification
    Path      fuel-flow-web/e2e-tests/<MXX-FXX>.spec.ts
    Answers   Every acceptance criterion walked in Playwright
    Managed   /feature-e2e-testing
                — spawns feature-e2e-tester subagent
                — fixes Critical bugs on the same branch before PR
    Branch    same feature branch
    Commit    test(mxx-fxx): e2e spec  |  fix(mxx-fxx): <critical bug found in e2e>
    Push      after E2E passes clean
    PR        NOT YET — one push away from opening it.
        │
        ▼
[6] Ship  ─── OPEN THE ONE FEATURE PR HERE ───
              Use mcp__github__create_pull_request (per root CLAUDE.md Rule 10).
              Title:  M01-F02: phone OTP verification
              Body:   filled from .github/PULL_REQUEST_TEMPLATE.md;
                      link to plan.md as the scope contract
    Path      PR merged to main
    Managed   Git + reviewer + `mcp__github__*` tools
    Lifecycle in-implementation  →  shipped
              SRD.md index row updated in the SAME PR (per root CLAUDE.md Rule 2)
    PR        ONE PR containing plan.md + design/*.tsx + prod code + E2E spec +
              SRD lifecycle flip. Reviewable as one atom.
        │
        ▼
[7] Recap                                       (closes the loop)
    Path      docs/implementation/<MXX-FXX>/recap.md
    Answers   What actually shipped vs plan (deviations, follow-ups, tech debt,
              learnings that should feed the next feature)
    Managed   /recap-feature
                — diffs plan.md vs shipped code + tests + migrations
                — captures deviations with the user's reason (intentional,
                  discovered late, bug)
                — collects follow-up items and learnings
                — recap.md is durable; plan.md is archived alongside it
    Reading   Any subsequent feature's /plan-feature should read this
              feature's recap.md if the SRD spec's §7 lists it as a dependency
    Branch    NEW small follow-up branch off freshly-merged main:
              git checkout main && git pull --ff-only
              git checkout -b docs-<mxx-fxx>-recap
              (recap MUST run against merged main to give an accurate diff —
              that's why it can't be part of the feature PR)
    Commit    docs(mxx-fxx): post-ship recap
    Push      once recap approved
    PR        small docs PR straight to main. Merges quickly.

Optional but strongly encouraged:

[8] Journey E2E                                 (integration coverage)
    Path      docs/e2e-journeys/<journey-name>.md
              fuel-flow-web/e2e-tests/journeys/<journey-name>.spec.ts
    Answers   Does the multi-feature user flow actually work end-to-end?
              (Register → OTP → Onboard → Dashboard as one connected walkthrough.)
    Managed   /journey-e2e
                — runs after the last spanned feature ships
                — catches integration bugs that per-feature E2E misses
                — journey.md is durable and lives outside the per-feature folder
    Branch    dedicated journey branch off freshly-merged main:
              git checkout -b feat-journey-<journey-name>
              (not tied to any single feature; every spanned feature must be
              already shipped on main)
    Commit    test(journey): <name> plan  |  test(journey): spec + fixes
    Push      after journey passes clean
    PR        ONE journey PR to main.
              Title:  journey: <journey-name> end-to-end
```

### Branch / push / PR at a glance

| Stage | Branch | Commits land as | Push | PR |
|---|---|---|---|---|
| [1] SRD spec (pre-branch scaffolding) | `main` | `docs(mxx-fxx):` | immediately | small docs PR straight to main |
| [2] Plan | `feat-<id>-<name>` (cut here) | `docs(mxx-fxx): initial plan` | after approval | ✗ not yet |
| [3] Design | same feature branch | `design(mxx-fxx): <viewport> pass` | per phase | ✗ not yet |
| [4] Implementation | same feature branch | `feat(mxx-fxx): <layer> — …` | per layer | ✗ not yet |
| [5] E2E | same feature branch | `test(mxx-fxx): e2e spec` + `fix(mxx-fxx): …` | after clean pass | ✗ not yet |
| [6] Ship | same feature branch | — | — | **ONE feature PR** to main |
| [7] Recap | `docs-<id>-recap` (off freshly-merged main) | `docs(mxx-fxx): post-ship recap` | after approval | small docs PR to main |
| [8] Journey E2E (optional) | `feat-journey-<name>` | `test(journey): <name> plan` + `test(journey): spec + fixes` | after clean pass | one journey PR to main |

**Trivial features** (per `/design-feature` and `/plan-feature` "when to skip" rules): no plan.md, no design/*.tsx, no recap.md — just a small branch with the change + tests, straight to the feature PR at [6]. Same branch name and commit conventions.

**Meta / tooling work** (skills, conventions, this repo's own scaffolding) isn't a feature. Use `chore-*` branch (e.g. `chore-srd-scaffold-m01`, `chore-legacy-scaffold-cleanup`), ship as a normal PR to main. Doesn't need an `MXX-FXX` ID.

### Backpressure — escalation from any stage

The pipeline flows forward by default, but any stage may discover a spec bug, missing detail,
or cross-feature contradiction. All later stages support an **escalation protocol**:

```
Stage emits:
  ESCALATE_TO_SRD:
  Feature: MXX-FXX
  Reason: <what's inconsistent / missing / contradicted>
  Suggested action: <invoke /feature-discovery / refresh plan / edit spec>
  State: <what phase / step, so we can resume>

Main thread:
  1. Saves current progress to docs/implementation/<MXX-FXX>/.<stage>-in-progress.md
  2. Surfaces escalation to user
  3. On approval → invokes the suggested skill (usually /feature-discovery)
  4. After SRD updated → offers to resume the escalating stage or restart from Phase 0
```

Stages that support this: `/plan-feature`, `/design-feature`, `/feature-implementation` (via its
underlying agents), `/recap-feature`. It's the single mechanism for kicking a spec bug back to
the source of truth — no ad-hoc workarounds, no silent scope expansion.

### Plan staleness

`/design-feature` and `/feature-implementation` both check plan.md's `plan_last_updated`
frontmatter against the SRD spec's `Last updated` header row. If the SRD is newer, the plan is
potentially stale — the user is prompted to `/plan-feature --refresh` before proceeding, or to
explicitly accept the stale plan. Prevents silent drift when a feature-discovery on ONE feature
touches ANOTHER feature's SRD spec after that other feature's plan was approved.

### Rules

- **Backpressure is enforced.** If [3] design surfaces an AC not in [2] plan, design cannot proceed silently — [2] must be updated first, which in turn may invoke `/feature-discovery` if the AC needs SRD validation. No stage silently expands scope.
- **Skipping stages.** Trivial features may skip [2] and [3] entirely — see each skill's "when to skip" heuristic. Cross-cutting infra work (validators, hooks, migrations) may skip [3] but should still produce a [2] plan if the change touches ≥2 layers or introduces migrations.
- **Lifecycle bumps in the same PR as the state change.** Never ahead of state (don't set `spec-locked` if the plan isn't approved), never behind (don't leave `drafting` after ship).
- **`/feature-discovery` is the SRD gatekeeper.** New requirements MUST come through it. Both `/plan-feature` (during planning) and any human ad-hoc "we should also…" ask should route to it.
- **Every skill's output is a git-native markdown or code artefact.** No hosted-app dependencies. GitHub renders the plan.md (including mermaid diagrams) and the code natively. Reviewers use inline comments — no external annotation tool required.
