# docs — Documentation System

## Document Map

| File | Purpose | Source of Truth For |
|------|---------|---------------------|
| `MODULES.md` | Module / feature / requirement registry | Hierarchical IDs (`MXX-FXX-RXX`), per-requirement status, legacy ID mapping |
| `PRD.md` | Full technical specifications | API endpoints, DB schema, business rules detail, development phases |
| `ProjectOverView.md` | Business requirements | Module descriptions, user stories, feature specs, subscription tiers |
| `IMPLEMENTATION_STATUS.md` | Current project state | What's done, what's next, implemented endpoints |
| `CHANGELOG.md` | Version history | Architectural decisions, tech changes, feature additions |
| `EF_CONFIGURATION_CONVENTIONS.md` | EF Core mapping standards | Fluent API section ordering, relationship comments (also in `server/FuelFlow.Infrastructure/CLAUDE.md`) |

## What Goes Where

| Content Type | Document |
|-------------|----------|
| **Module / feature / requirement IDs (`MXX-FXX-RXX`)** | **`MODULES.md`** |
| **Per-requirement status (Planned / In Progress / Done)** | **`MODULES.md`** |
| **Legacy → new ID mapping (SH-001 → M04-F03-R01, etc.)** | **`MODULES.md` Appendix A** |
| **Acceptance criteria per feature** | **`MODULES.md`** |
| API endpoint specs (routes, request/response) | `PRD.md` |
| Database schema (tables, columns, relationships) | `PRD.md` |
| Business rules detailed prose | `PRD.md` §5 (cross-link to `MODULES.md` IDs) |
| Tech stack versions | `PRD.md` |
| Development phase tasks | `PRD.md` |
| Module descriptions (what it does, user stories) | `ProjectOverView.md` |
| Subscription tier details | `ProjectOverView.md` |
| What's implemented vs planned (code-level: endpoints, areas) | `IMPLEMENTATION_STATUS.md` |
| Implemented endpoint list | `IMPLEMENTATION_STATUS.md` |
| Coding patterns and conventions | `CLAUDE.md` files (root, server, frontend) |
| Architecture decisions and rationale | `CHANGELOG.md` |

**Rule:** Never duplicate detailed specs across documents. `CLAUDE.md` files reference docs for details — they contain conventions and rules, not full specifications.

## Documentation Update Workflow

Two modes depending on what changed first:

### Mode A: Doc-Driven (You Changed Specs)

Use when adding features, changing business rules, or updating specifications.

1. **Update source docs first:**
   - `MODULES.md` for new/changed modules, features, requirements, or acceptance criteria — assign a new hierarchical ID (`MXX-FXX-RXX`) and add any legacy alias to Appendix A
   - `PRD.md` for technical specs (endpoints, schema, rules)
   - `ProjectOverView.md` for business requirements (modules, user stories)
2. **Update `IMPLEMENTATION_STATUS.md`** if implementation state changed:
   - Mark completed tasks
   - Add new endpoints to implemented list
   - Update "Next up" section
   - Update `Last Updated` date
3. **Update `CHANGELOG.md`** for significant changes:
   - Add entry at top (newest first)
   - Follow semver: MAJOR (breaking), MINOR (features), PATCH (fixes)
   - Categories: Added, Changed, Deprecated, Removed, Fixed, Technical Decisions
4. **Update relevant `CLAUDE.md`** if conventions or patterns changed
5. **Verify consistency** across all updated files

### Mode B: Code-Driven (Sync PRD from Codebase)

Use when codebase has drifted from documentation — code is truth.

1. **Discovery** — scan codebase for current state:
   - `server/FuelFlow.Api/Controllers/*.cs` — actual endpoints (routes, methods, auth)
   - `server/FuelFlow.Application/DTOs/` — request/response shapes
   - `server/FuelFlow.Infrastructure/Migrations/*.cs` — tables, columns
   - `server/*.csproj` — package versions
   - `server/FuelFlow.Domain/Entities/*.cs` — entity models
2. **Compare** discovered state with `PRD.md`:
   - Endpoint paths match controller routes?
   - Tech versions match `.csproj` packages?
   - Key entities match Domain + migrations?
   - Development phase status accurate?
3. **Update PRD** where codebase differs:
   - Different endpoint path -> fix to match controller
   - New controller/endpoint -> add with status "Implemented"
   - New entity/migration -> add to Key Entities
   - Different package version -> update tech stack
   - Implemented feature -> mark phase task as done
4. **Cascade updates:** `IMPLEMENTATION_STATUS.md`, `CHANGELOG.md`, relevant `CLAUDE.md` files

## CHANGELOG Conventions

**Format:**
```markdown
## [1.2.0] - 2026-02-08

### Added
- Dark mode support guidelines

### Changed
- Updated UI/UX Guidelines section

### Technical Decisions
- Chose X over Y because [reason]
```

**When to add an entry:**
- Major feature additions
- Technology stack changes
- Architecture changes
- Significant business rule changes
- Breaking changes

**When to skip:**
- Minor typo fixes
- Small clarifications that don't affect implementation

## Keeping CLAUDE.md Files in Sync

| When This Changes | Update This CLAUDE.md |
|-------------------|----------------------|
| Tech stack (backend) | `server/CLAUDE.md` |
| Tech stack (frontend) | `fuel-flow-web/CLAUDE.md` |
| Architecture patterns | `server/CLAUDE.md` |
| EF Core conventions | `server/FuelFlow.Infrastructure/CLAUDE.md` |
| Cross-cutting business rules | Root `CLAUDE.md` |
| New coding patterns | Relevant `server/` or `fuel-flow-web/` CLAUDE.md |
| Documentation workflow | `docs/CLAUDE.md` (this file) |

**Principle:** CLAUDE.md files are lean reference guides for AI agents. Full specifications stay in PRD.md and ProjectOverView.md. Keep CLAUDE.md files scannable — if a section exceeds 20 lines, it probably belongs in a doc file instead.
