# SRD conventions

This directory holds the per-feature Software Requirements Document. The
top-level index is [`../SRD.md`](../SRD.md). Read that first.

## File layout

```
docs/srd/
├── README.md                           # this file
├── MXX-<kebab-name>/                   # one directory per module
│   ├── README.md                       # module-level spec: purpose, scope, NFRs, dependencies, feature index
│   ├── FXX-<kebab-name>.md             # one file per feature flow
│   └── FXX-<kebab-name>.md
└── …
```

- Module directory names: `MXX-<kebab>` — e.g. `M01-authentication`, `M16-team-and-access`.
- Feature file names: `FXX-<kebab>.md` — e.g. `F01-registration.md`, `F04-login.md`.
- One feature flow per file. If a "feature" splits into N independent flows during drafting, split it into N features.

## Feature file template

Every `FXX-*.md` must contain these sections in this order. Empty sections are
written as `_None._` — never omitted, so consumers always know to look.

```markdown
---
id: M01-F01
module: M01-authentication
title: <feature title>
lifecycle: drafting                              # see "Lifecycle" below
design: ../../../fuel-flow-web/src/design/screens/MXX/FXX-<slug>.tsx
legacy: <MODULES.md ID(s), or "none">
last-updated: 2026-06-27
# Optional, only when the feature is on a lifecycle off-ramp:
# superseded_by: M01-F17
# superseded_at: 2026-08-15
# supersedes: [M01-F12]
# removed_at: 2026-08-15
# removed_reason: "<one-line why>"
---

# M01-F01 — <feature title>

## 1. Purpose
One paragraph. Who triggers this flow, what success looks like, why it exists.

## 2. User stories
- **As a** <role>, **I want to** <action>, **so that** <outcome>.

## 3. Functional requirements
| ID | Requirement | Status |
|---|---|---|
| M01-F01-R01 | … | Planned |

## 4. Non-functional requirements
| Concern | Requirement |
|---|---|
| Security | … |
| Performance | … |
| Accessibility | … |
| i18n | … |
| Rate limiting | … |

## 5. Acceptance criteria
- **AC1** Given … When … Then …

## 6. Design flow
Link to the design playground component + ordered screen list.

## 7. Dependencies
- **Depends on** <other feature link> — <why>
- **Out of scope** — <what is intentionally excluded and where it lives instead>

## 8. Audit emissions
| Event | Captured fields | Sink |
|---|---|---|
| `domain.action.outcome` | … | M17 audit log |

## 9. API surface
Endpoints touched; reference Swagger for full schemas.

## 10. Open questions
Decisions still to be made. Each question should be claimable by a person + date.

## 11. Change history
Append-only log of material changes. Format: `- **YYYY-MM-DD** — <change>. <reason / cross-link>.`
Trivial edits (typos, link fixes) don't go here — `git log` covers those.
```

### Section-level rules

- **Section 1 (Purpose)** is two-to-three sentences. If it's longer, the feature
  is probably two features.
- **Section 3 (Functional requirements)** uses `MXX-FXX-RXX` IDs, allocated
  contiguously starting at `R01`. Don't reuse IDs — if a requirement is dropped,
  mark it `Removed` with a one-line reason. References to the dropped ID stay valid.
- **Section 5 (Acceptance criteria)** uses Gherkin-style phrasing
  (Given / When / Then). One AC per row. Failures must map to an AC for traceability.
- **Section 6 (Design flow)** must include a working relative link to the
  `/design` playground component file. If no design exists yet, write
  `_Design pending — see [open question N](#10-open-questions)._`
- **Section 8 (Audit emissions)** is the contract M17 will read. If a feature
  doesn't emit audit events, write `_None._` so it's an explicit decision, not an
  oversight.

## ID assignment rules

- IDs are **stable** once shipped. Renumber only during draft, never after.
- Feature IDs (`FXX`) are flow-ordered inside each module — see the module
  README for the rationale.
- Requirement IDs (`RXX`) are append-only inside each feature.
- Cross-references between features use the full link: `[M16-F01 Invite User](../M16-team-and-access/F01-invite-user.md)`.

## Lifecycle

The `lifecycle:` frontmatter field is the single source of truth for *where a
feature is in the workflow*. Monotonic for healthy features; two off-ramps
(`superseded`, `removed`) for the lifecycle edges.

| State | Meaning | Gate to advance |
|---|---|---|
| `drafting` | SRD file is being written; sections may shift | Spec sections 1–10 frozen |
| `spec-locked` | Spec is committed; design hasn't been built | Design playground file exists + flipped to `approved` in [`catalogue.ts`](../../fuel-flow-web/src/design/catalogue.ts) |
| `design-approved` | Design is locked; implementation hasn't started | First implementation PR opens |
| `in-implementation` | At least one PR touching this feature is open / merged | Backend + frontend + E2E all merged to `main` |
| `shipped` | Every in-scope R is `Done` and the E2E spec is green | — (terminal) |
| `superseded` | Replaced by another feature; reference stays valid forever | — (terminal; set `superseded_by:`) |
| `removed` | Dropped before shipping; spec kept for traceability | — (terminal; set `removed_reason:`) |

**Lifecycle changes happen in the same PR as the work** (per root [`CLAUDE.md`](../../CLAUDE.md) Rule 2). Don't bump `lifecycle` ahead of the underlying state.

## Requirement-row statuses

Inside section 3 (Functional requirements), individual `RXX` rows track their own
state. These are independent of the feature `lifecycle:` — a feature can be
`in-implementation` with some R rows `Done`, others `Planned`.

| State | Meaning |
|---|---|
| `Drafting` | R-row wording still being negotiated; feature is `drafting` |
| `Planned` | R-row spec is locked, hasn't been implemented |
| `In Progress` | At least one PR is in flight for this R |
| `Done` | Implemented + tested + on `main` |
| `Removed` | R was dropped; row kept (never renumbered) with a one-line reason |

## ID-reuse rule

**Never reuse an ID.** Removed `RXX` rows keep their slots; removed/superseded
`FXX` files keep their filenames. The next R / feature gets the next free
number. This keeps every historical reference (branches, commits, code
comments, PR titles) valid forever.

## Changing or replacing a feature

Three mechanisms, used together depending on the change size:

| Change size | Mechanism |
|---|---|
| Edit a few words, fix a link | Just edit the file; `git log` is the record. Skip the changelog. |
| Add an R, remove an R, change an AC | Edit in place, flip the R-row to `Removed` if dropped (never delete), and **add a section-11 entry** explaining the why. |
| Wholesale replace the feature | Keep the old file. Set old file's `lifecycle: superseded` + `superseded_by: <new-id>`. Create the new feature file with the next free FXX and `supersedes: [<old-id>]`. Both stay forever. |
| Drop the feature entirely | Keep the file. Set `lifecycle: removed` + `removed_reason:` + `removed_at:`. Module README index shows it struck through with the link still working. |

## Relationship to `docs/implementation/`

The SRD and the implementation plan answer different questions:

| Document | Answers | Lifecycle |
|---|---|---|
| SRD feature file (this directory) | *What* must it do, *why*, what is "done" (AC). | Stable — rarely changes after `spec-locked`. |
| [`docs/implementation/<MXX>/<feature>.md`](../implementation/) | *How* will we build it: phase order, file list, migrations, test plan, sequencing. | Disposable — discarded after the PR ships. |

Both are useful for non-trivial work:

- **Skip the implementation plan** for trivial features (single file, copy-only changes, one new endpoint reusing existing patterns).
- **Generate one** via the `feature-planning` skill for anything that crosses Domain → Application → Infrastructure → Api → Frontend.
- The SRD makes the plan shorter (acceptance criteria, API surface, design link are all in the spec — the plan just orders the work).

When a feature is `shipped`, archive its implementation plan inline (no need to
delete) — it's a useful artefact for understanding why the code looks the way
it does.

## How design files link to SRDs

Each feature SRD references its design via the `design:` frontmatter field and
a clickable link in section 6. The path points at the existing `/design`
playground component in `fuel-flow-web/src/design/screens/<MXX>/<FXX>-*.tsx`.
The design code IS the design — there's no separate Figma file to drift from.

When a feature's playground file is renamed (e.g. after ID reassignment), the
SRD's frontmatter and section-6 link must be updated in the same commit.

## Relationship to MODULES.md

During the transition (see [`../SRD.md`](../SRD.md) "Transition rules"):

- For **new features**, write the SRD file, do not touch MODULES.md.
- For **MODULES.md features being migrated**, replace the MODULES.md section
  with `→ moved to [SRD path]` and add the SRD files in the same PR.
- For **untouched MODULES.md features**, leave them alone until their own
  migration pass.

The root [`CLAUDE.md`](../../CLAUDE.md) Rule 1 reads "locate the requirement in
the SRD or MODULES.md" during this period.
