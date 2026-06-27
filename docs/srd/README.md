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

**Implementation plans:** skip for trivial features (single file, copy-only, one endpoint reusing patterns). Generate via the `feature-planning` skill for anything crossing Domain → Application → Infrastructure → Api → Frontend.

**Design files:** the `/design` playground component IS the design — no separate Figma. Update the SRD `design:` frontmatter + §6 link in the same commit as any playground rename.

**MODULES.md transition:** new features → SRD only. Migrated features → MODULES.md row becomes `→ moved to <SRD path>` in the same PR that adds the SRD. Untouched modules stay in MODULES.md until their own migration pass.
