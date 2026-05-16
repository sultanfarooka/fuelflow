# docs — Documentation System

## Document Map

| File | Purpose | Source of Truth For |
|------|---------|---------------------|
| `MODULES.md` | Module / feature / requirement registry + current priorities | Hierarchical IDs (`MXX-FXX-RXX`), per-requirement status, legacy ID mapping, "Where to Continue" |
| `ProjectOverView.md` | Business requirements | Module descriptions, user stories, feature specs, subscription tiers |
| `CHANGELOG.md` | Version history | Architectural decisions, tech changes, feature additions |
| `EF_CONFIGURATION_CONVENTIONS.md` | EF Core mapping standards | Fluent API section ordering, relationship comments (also in `server/FuelFlow.Infrastructure/CLAUDE.md`) |

Reference content (tech stack, architecture, API conventions, DB schema, UI specs) lives in the **scoped `CLAUDE.md`** files next to the code — see the "What Goes Where" table below and the root [`CLAUDE.md`](../CLAUDE.md) Rule 9.

## What Goes Where

| Content Type | Document |
|-------------|----------|
| **Module / feature / requirement IDs (`MXX-FXX-RXX`)** | `MODULES.md` |
| **Per-requirement status (Planned / In Progress / Done)** | `MODULES.md` |
| **Legacy → new ID mapping (SH-001 → M04-F03-R01, etc.)** | `MODULES.md` Appendix A |
| **Acceptance criteria per feature** | `MODULES.md` |
| **Current priorities (next 3 tasks)** | `MODULES.md` "Current Priorities" section |
| API conventions, sample request/response | `server/FuelFlow.Api/CLAUDE.md` |
| **Endpoint catalogue (authoritative)** | **Swagger** at `/swagger` — auto-generated |
| Backend tech stack, Clean Architecture, CQRS+MediatR | `server/CLAUDE.md` |
| Commands / Queries / DTO patterns, validators, multi-tenancy guards, Mapperly | `server/FuelFlow.Application/CLAUDE.md` |
| ER diagram, key entities | `server/FuelFlow.Domain/CLAUDE.md` |
| **DB schema (authoritative)** | **EF Core migrations** |
| EF Core configurations, important DB rules, global query filters | `server/FuelFlow.Infrastructure/CLAUDE.md` |
| Frontend tech stack, state, forms, routing, i18n, PWA | `fuel-flow-web/CLAUDE.md` |
| Route → role mapping, registration / onboarding flows | `fuel-flow-web/src/routes/CLAUDE.md` |
| Component patterns (shadcn, Field system, Dialog/Sonner/Recharts, subscription UI) | `fuel-flow-web/src/components/CLAUDE.md` |
| API client, Zod validators, utilities | `fuel-flow-web/src/lib/CLAUDE.md` |
| Module descriptions (what it does, user stories) | `ProjectOverView.md` |
| Architecture decisions and rationale | `CHANGELOG.md` |

**Rule:** Never duplicate detailed specs across documents. `CLAUDE.md` files describe *conventions and rules* — not full specifications — alongside the code they describe.

## Documentation Update Workflow

The previous two-mode (Doc-Driven / Code-Driven) workflow has been folded into the **Development Workflow** in the root [`CLAUDE.md`](../CLAUDE.md) — see Rules 1–9 there. The short version:

1. **Identify the requirement ID** in `MODULES.md` (Rule 1).
2. **Update `MODULES.md` status** in the same commit/PR as the implementation (Rule 2).
3. **For reference content** (tech stack changes, new conventions, new component patterns), update the appropriate **scoped `CLAUDE.md`** next to the code — see "What Goes Where" above and root `CLAUDE.md` Rule 9.
4. **For significant changes** add a `CHANGELOG.md` entry — see conventions below.

When the codebase has drifted from `MODULES.md` (statuses lagging behind implemented features), scan controllers / migrations / `.csproj` to discover what exists, then flip the relevant `MXX-FXX-RXX` rows to `Done` and bump `Last Updated`.

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
| Backend tech stack | `server/CLAUDE.md` |
| Frontend tech stack | `fuel-flow-web/CLAUDE.md` |
| Architecture patterns (Clean Architecture, CQRS) | `server/CLAUDE.md` |
| API conventions (cookies, errors, samples) | `server/FuelFlow.Api/CLAUDE.md` |
| EF Core conventions, global query filters, DB rules | `server/FuelFlow.Infrastructure/CLAUDE.md` |
| Entity model, ER diagram | `server/FuelFlow.Domain/CLAUDE.md` |
| Page → role routing, registration flow | `fuel-flow-web/src/routes/CLAUDE.md` |
| Component patterns (Dialog, toasts, charts) | `fuel-flow-web/src/components/CLAUDE.md` |
| API client, validators | `fuel-flow-web/src/lib/CLAUDE.md` |
| Cross-cutting business rules | Root `CLAUDE.md` |
| Documentation workflow | `docs/CLAUDE.md` (this file) |

**Principle:** `CLAUDE.md` files are lean reference guides for AI agents and developers. Full module / feature / requirement specifications live in [`MODULES.md`](MODULES.md). Reference content (tech stack, architecture, API, schema, UI) lives in the scoped `CLAUDE.md` next to the code. Keep `CLAUDE.md` files scannable — if a section exceeds 30 lines, consider whether it belongs in a separate doc or as a code comment.
