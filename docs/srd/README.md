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
status: Planned                                  # see status legend in SRD.md
design: ../../../fuel-flow-web/src/design/screens/MXX/FXX-<slug>.tsx
legacy: <MODULES.md ID(s), or "none">
last-updated: 2026-06-27
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

## Status states

| State | When |
|---|---|
| `Planned` | Spec locked, no implementation has started |
| `In Progress` | At least one R-level requirement is being built |
| `Done` | Every in-scope R is shipped + E2E test in place |
| `Out of Scope` | Captured in spec but explicitly will not be built — kept for traceability |
| `Removed` | Used only on dropped requirements; never on features/modules |

Status changes happen in the same PR as the work — see [root CLAUDE.md](../../CLAUDE.md)
Rule 2.

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
