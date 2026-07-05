# docs — Documentation System

This file is for someone working **inside `docs/`**. Repository-wide workflow rules live in the root [`CLAUDE.md`](../CLAUDE.md) (don't duplicate them here).

## Document Map

| File | Purpose | Source of Truth For |
|---|---|---|
| `SRD.md` | SRD index | Modules, lifecycle, links to per-feature specs |
| `srd/README.md` | SRD conventions | Template, ID rules, lifecycle states, change mechanisms |
| `srd/MXX-*/README.md` | Module spec | Scope, NFRs, dependencies, feature index |
| `srd/MXX-*/FXX-*.md` | Feature spec | Acceptance criteria, flows, NFRs, edge cases |
| `MODULES.md` | **DEPRECATED** legacy registry | Specs for M02–M15 (except M16) until each is migrated. **Do not add new rows.** |
| `ProjectOverView.md` | Business overview | Module descriptions, user stories, subscription tiers |
| `CHANGELOG.md` | Version history | Architectural decisions, tech changes, feature additions |
| `implementation/<MXX>/<feature>.md` | Per-feature/module **implementation plans** | Disposable; archived after the PR ships |

Tech-stack / architecture / API / schema / UI reference content does **not** live here — it lives in scoped `CLAUDE.md` files next to the code. See root [`CLAUDE.md`](../CLAUDE.md) Rule 9 for the index.

## SRD vs MODULES.md — transition state

Mid-migration from the flat `MODULES.md` registry to a per-feature SRD under `docs/srd/`.

| Case | Rule |
|---|---|
| **New feature** | Write to SRD only. Add an `srd/MXX-*/FXX-*.md` from the template in [`srd/README.md`](srd/README.md). **Do not add `MODULES.md` rows.** |
| **In-flight work on an unmigrated module** | Finish against `MODULES.md`. |
| **Touching an unmigrated module substantively** | Migrate the module to SRD first (replace its `MODULES.md` section with `→ moved to <SRD path>` in the same PR). |
| **Cutover** | When every `In Progress` / `Planned` / `Done` `MODULES.md` row has an SRD counterpart, `MODULES.md` becomes an archive and root `CLAUDE.md` flips its pointer entirely to SRD. |

Migrated today: **M01** (Identity & Authentication), **M16** (Team & Access — stub), **M17** (Audit & Compliance — stub). Everything else lives in `MODULES.md` for now.

## CHANGELOG conventions

```markdown
## [1.2.0] - 2026-02-08

### Added
- <new capability>

### Changed
- <behaviour change>

### Technical Decisions
- Chose X over Y because <reason>
```

**Add an entry for:** major feature additions, tech-stack changes, architecture changes, significant business-rule changes, breaking changes.
**Skip:** typo fixes, small clarifications that don't affect implementation.

## Principle

`CLAUDE.md` files are lean reference guides — full specs live in SRD (or, for now, MODULES.md). If a section exceeds 30 lines, ask whether it belongs in a separate doc or as a code comment.
