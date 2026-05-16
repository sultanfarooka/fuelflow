# Fuel Flow

Comprehensive filling station management system for the Pakistani market. Station owners manage multiple filling stations, track fuel inventory, handle credit customers (udhaar), run shift-based operations, and generate reports.

## Tech Stack

**Backend:** ASP.NET Core 10 (C# 12), EF Core 10, PostgreSQL 16, MediatR 14, FluentValidation 12, Mapperly 4.3, Serilog, JWT (HTTP-only cookies)
**Frontend:** React 19, Vite 7, TypeScript 5.9, TanStack (Router/Query/Form/Table), Zustand 4.5, shadcn/ui, Tailwind CSS, Zod, Axios, i18next, Recharts, Sonner
**Infra:** Docker + Docker Compose, GitHub Actions

## Repository Layout

```
server/                         # ASP.NET Core backend (see server/CLAUDE.md)
  FuelFlow.Api/                 # Controllers, Program.cs composition root
  FuelFlow.Application/         # Commands, Queries, DTOs, Validators, Interfaces
  FuelFlow.Domain/              # Entities, Enums, BaseEntity (pure C#, zero packages)
  FuelFlow.Infrastructure/      # EF Core, Handlers, Repos, Services (see its CLAUDE.md)
  docker-compose.yml            # PostgreSQL 16
fuel-flow-web/                  # React frontend (see fuel-flow-web/CLAUDE.md)
docs/                           # PRD, ProjectOverview, status (see docs/CLAUDE.md)
scripts/                        # dev.ps1 (run both), migrate.ps1
```

## Development Setup

**Prerequisites:** Node.js 18+, .NET 10 SDK, Docker Desktop, `dotnet tool install --global dotnet-ef`

```bash
# 1. Start PostgreSQL
cd server && docker compose up -d

# 2. Configure secrets (first time only)
cd server/FuelFlow.Api
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=fuelflow_dev;Username=fuelflow;Password=fuelflow123"
dotnet user-secrets set "Jwt:Secret" "your-secret-key-at-least-32-characters-long"
dotnet user-secrets set "Jwt:Issuer" "FuelFlow"
dotnet user-secrets set "Jwt:Audience" "FuelFlow"

# 3. Apply migrations
cd server && dotnet ef database update --project FuelFlow.Infrastructure --startup-project FuelFlow.Api

# 4. Run backend (http://localhost:5035, Swagger at /swagger)
dotnet run --project server/FuelFlow.Api/FuelFlow.Api.csproj

# 5. Run frontend (http://localhost:5173)
cd fuel-flow-web && npm install && npm run dev

# Or run both together:
./scripts/dev.ps1
```

## Multi-Tenancy Model

Single database, shared schema. All operational tables link via `StationId`. EF Core global query filters enforce tenant isolation automatically. Owner role bypasses station filters for consolidated cross-station views.

## Cross-Cutting Rules

These apply to BOTH frontend and backend — no exceptions:

- **Always** validate input at both frontend (Zod) AND backend (FluentValidation)
- **Always** use DTOs for API communication — never expose domain entities
- **Always** check subscription status and plan limits before creating stations, users, or accessing gated modules
- **Always** log sensitive actions (price changes, user creation, stock adjustments)
- **Always** filter queries by `StationId` unless user is Owner viewing consolidated data
- **Always** calculate sales from meter readings — never allow manual entry without alert
- **Never** expose internal errors, stack traces, or implementation details to clients
- **DRY**: Share validation schemas between frontend Zod and backend FluentValidation where possible
- **KISS**: Prefer simple, direct solutions — no premature abstractions or speculative features
- **YAGNI**: Only build what the current task requires

## Modules, Features & Requirements — Single Source of Truth

**[`docs/MODULES.md`](docs/MODULES.md) is the authoritative registry** of every module, feature, and requirement, each with a stable hierarchical ID (`MXX-FXX-RXX`). Reference these IDs in commits, PR titles, GitHub Issues, test names, and code comments.

- **Legacy IDs** (SH-001, PR-001, INV-001, CR-001, REG-001, SUB-001, AUD-001, FG-001) remain valid — they map to new hierarchical IDs in `MODULES.md` Appendix A.
- **Examples of high-impact rules** (full text and acceptance criteria in `MODULES.md`):
  - `M04-F03-R01` — One open shift per station (legacy `SH-001`)
  - `M06-F01-R01` — One active price per fuel type per station (`PR-001`)
  - `M02-F05-R03` — Variance = Physical − Calculated (`INV-003`)
  - `M05-F01-R01` — Credit sale blocked at/above credit limit (`CR-001`)
  - `M01-F01-R01` — Email unique across all users (`REG-001`)
  - `M11-F02-R01` — 14-day trial from registration (`SUB-002`)
  - `M11-F06-R01` — Feature gating enforced at API level (`SUB-010`)
  - `M01-F08-R05` — Audit logs never deleted (`AUD-005`)

## Key Documents

| Document | Purpose |
|----------|---------|
| [`docs/MODULES.md`](docs/MODULES.md) | **Single source of truth** for modules, features, requirements, and their IDs / statuses |
| [`docs/PRD.md`](docs/PRD.md) | Full technical specs: API endpoints, DB schema, development phases |
| [`docs/ProjectOverView.md`](docs/ProjectOverView.md) | Business requirements, 11 modules, user stories |
| [`docs/IMPLEMENTATION_STATUS.md`](docs/IMPLEMENTATION_STATUS.md) | Current code-level state, what's done, next priorities |
| [`docs/CHANGELOG.md`](docs/CHANGELOG.md) | Version history, key architectural decisions |

## Development Workflow (MANDATORY)

These rules are non-negotiable for every piece of work. No exceptions.

### 1. Locate the requirement in `MODULES.md` before doing any work

For **every** task — feature, bug, refactor, doc change — first identify the matching `MXX-FXX-RXX` ID in [`docs/MODULES.md`](docs/MODULES.md). That ID drives the branch name (Rule 4), commit scopes (Rule 7), PR title (Rule 5), test names (Rule 7), and the status flip (Rule 2).

- **State the chosen ID at the start of every task** so it's traceable in conversation history and reviews.
- If the task spans multiple requirements, pick the lowest-level shared ancestor (e.g. `M04-F03` if it touches both `M04-F03-R01` and `M04-F03-R02`).
- If the task is genuinely cross-cutting and doesn't map to any module (e.g. tooling, repo-wide config), say so explicitly and skip the ID — but this should be rare.

**If the work doesn't yet have an entry in `MODULES.md`, add it *before* writing any code.** Three cases:

| Granularity | When | What to add |
|---|---|---|
| **New requirement (R-level)** | The task is a new business rule / acceptance criterion inside an existing feature | Add a row to that feature's requirements table with the next free `RXX` |
| **New feature (F-level)** | Planning reveals a brand-new feature of an existing module (no matching `MXX-FXX` exists) | Add a new `### MXX-FXX — <title>` section under the module, with its own requirements table, description, and acceptance criteria. Pick the next free `FXX` for that module. |
| **New module (M-level)** | Rare — the work doesn't belong to any of M01–M11 | Flag this explicitly in your plan and discuss with the team before adding a new module section |

The MODULES.md edit and the planning artefact must be **in the same PR** as the implementation — never a follow-up.

### 2. MODULES.md is the heartbeat — keep it religiously up to date

Every feature/requirement listed in [`docs/MODULES.md`](docs/MODULES.md) has a Status (`Planned` / `In Progress` / `Done` / `Out of Scope`). **Update that status the moment its state changes:**

- Picking up a requirement → flip its row to `In Progress` in the same commit that starts the work.
- Finishing a requirement → flip it to `Done` in the same PR that ships it.
- Discovering a new requirement → add a new row with the next free `MXX-FXX-RXX` ID before writing code.
- Never let a merged PR ship without the corresponding MODULES.md status update.

### 3. Always branch off `main` for new work

Never start work on top of an existing feature branch. Always:

```bash
git checkout main
git pull --ff-only origin main
git checkout -b feat-<module-feature-id>-<short-name>
```

### 4. Branch naming convention

**Format:** `feat-<feature-id-from-modules-file>-<adequate-name>`

- `<feature-id-from-modules-file>` is the lowest-level ID being worked on, lowercased with hyphens: e.g. `m04-f03`, `m04-f03-r01`, `m11-f06`.
- `<adequate-name>` is a short kebab-case description (3–6 words max).

**Examples:**

| Work | Branch name |
|---|---|
| Implement Open Shift feature (M04-F03) | `feat-m04-f03-open-shift-endpoint` |
| Enforce one-open-shift rule (M04-F03-R01) | `feat-m04-f03-r01-one-open-shift-per-station` |
| Feature gating middleware (M11-F06) | `feat-m11-f06-api-feature-gating` |
| Audit trail for price changes (M01-F08-R01) | `feat-m01-f08-r01-audit-price-changes` |

For fixes use `fix-<id>-<name>`, for docs use `docs-<id>-<name>` — same shape, different prefix.

### 5. PR-per-feature: push and open a PR into `main` when done

When a feature (or a logical chunk of one) is complete:

1. Push the branch to origin (`git push -u origin <branch>`).
2. Open a Pull Request targeting `main` via `gh pr create`.
3. PR title must reference the ID: `M04-F03-R01: enforce one-open-shift-per-station`.

### 6. PR description template

Every PR description must contain:

```markdown
## Summary
- Implements **MXX-FXX[-RXX]**: <one-line description>
- Key implementation points:
  - <bullet 1: what changed at a high level>
  - <bullet 2: notable design choice / trade-off>
  - <bullet 3: any data model / migration / breaking impact>

## MODULES.md Status Update
- [ ] Flipped `MXX-FXX[-RXX]` to `Done` in `docs/MODULES.md`
- [ ] Added any new feature(s)/requirement(s) discovered during this work
- [ ] Updated `Last Updated` date in `docs/MODULES.md` header

## Test Plan
- [ ] <how to verify the golden path>
- [ ] <edge case(s) covered>

🤖 Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

The MODULES.md status flip is part of the **same PR** — never a follow-up.

### 7. Conventional commits inside the branch

- Prefix scopes with the ID: `feat(m04-f03): implement open-shift endpoint`, `fix(m11-f06): correct station-limit check`, `docs(m04): clarify shortage rule`, `refactor:`, `test(m04-f03-r01): integration test for one-open-shift`.
- Test names also reference the ID: `[Fact] public Task M04_F03_R01_OnlyOneOpenShiftPerStation()`.

### 8. Lint / format before pushing

- Frontend: ESLint + Prettier must pass.
- Backend: `dotnet format` must produce no diff.
