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
| [`docs/MODULES.md`](docs/MODULES.md) | **Single source of truth** for modules, features, requirements, statuses, and current priorities |
| [`docs/ProjectOverView.md`](docs/ProjectOverView.md) | Business requirements, 11 modules, user stories |
| [`docs/CHANGELOG.md`](docs/CHANGELOG.md) | Version history, key architectural decisions |

Reference documentation (tech stack, architecture, API conventions, DB schema, UI specs) lives in the **scoped `CLAUDE.md` files** — see Rule 9 below.

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
- [ ] <how to verify the golden path — unit / integration coverage>
- [ ] <edge case(s) covered — unit / integration>
- [ ] **E2E (Playwright MCP):** <journeys walked>; bugs found + fixed: <list / "none">; bugs deferred: <list / "none">
- [ ] **E2E spec:** `fuel-flow-web/e2e-tests/<id>.spec.ts` — `npm run test:e2e -- <id>` green

> The two **E2E** lines are mandatory whenever the item touches `Api` or
> `Frontend` (Step 4.5 of the `feature-implementation` skill). For docs-only
> items, replace both with **`E2E: N/A — docs-only`**.

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

### 9. Reference content lives in scoped `CLAUDE.md` files — not in a single PRD

There is no top-level `PRD.md`. Tech-stack, architecture, API conventions, DB schema, and UI specs are documented inside the **scoped `CLAUDE.md`** for each project / folder, alongside the code they describe.

| Content | Lives in |
|---|---|
| Module / feature / requirement IDs, status, acceptance criteria | [`docs/MODULES.md`](docs/MODULES.md) |
| Current priorities (next 3 tasks) | [`docs/MODULES.md`](docs/MODULES.md) "Current Priorities" section |
| Backend tech stack & versions, Clean Architecture, CQRS+MediatR | [`server/CLAUDE.md`](server/CLAUDE.md) |
| API conventions, sample request/response payloads, controller list | [`server/FuelFlow.Api/CLAUDE.md`](server/FuelFlow.Api/CLAUDE.md) |
| **Endpoint catalogue (authoritative)** | **Swagger** at `/swagger` — auto-generated |
| Commands / Queries patterns, DTOs, validators, multi-tenancy guards, Mapperly | [`server/FuelFlow.Application/CLAUDE.md`](server/FuelFlow.Application/CLAUDE.md) |
| Entity model, ER diagram, key entities | [`server/FuelFlow.Domain/CLAUDE.md`](server/FuelFlow.Domain/CLAUDE.md) |
| **DB schema (authoritative)** | **EF Core migrations** in [`server/FuelFlow.Infrastructure/Migrations/`](server/FuelFlow.Infrastructure/Migrations/) |
| EF Core configurations, global query filters, important DB rules | [`server/FuelFlow.Infrastructure/CLAUDE.md`](server/FuelFlow.Infrastructure/CLAUDE.md) |
| Frontend tech stack, state management, forms, routing, i18n, PWA | [`fuel-flow-web/CLAUDE.md`](fuel-flow-web/CLAUDE.md) |
| Route → role mapping, registration/onboarding flows | [`fuel-flow-web/src/routes/CLAUDE.md`](fuel-flow-web/src/routes/CLAUDE.md) |
| Component patterns (shadcn, Field system, Dialog/Sonner/Recharts, subscription UI) | [`fuel-flow-web/src/components/CLAUDE.md`](fuel-flow-web/src/components/CLAUDE.md) |
| API client, Zod validators, utilities | [`fuel-flow-web/src/lib/CLAUDE.md`](fuel-flow-web/src/lib/CLAUDE.md) |

**How to apply:**
- Before writing any new top-level reference doc (`docs/something.md`), check whether the content fits a scoped `CLAUDE.md`. It usually does — colocating with code keeps it from drifting.
- When the authoritative artefact is the code itself (Swagger for endpoints, migrations for schema), the scoped `CLAUDE.md` is a *summary index* — never the primary source. When the two disagree, code wins; update the `CLAUDE.md`.
- For cross-cutting business specs (a new requirement, a status flip), always update [`docs/MODULES.md`](docs/MODULES.md) per Rules 1 and 2 — never a scoped `CLAUDE.md`.

### 10. Prefer the GitHub MCP server for GitHub-side operations

When the GitHub MCP server is available (tools prefixed `mcp__github__`), use it for any operation that touches GitHub server state — PRs, issues, reviews, comments, releases, branches on GitHub, file contents via API, repo/code search. Fall back to the `gh` CLI for things the MCP doesn't cover (e.g. Actions workflow runs). Use raw `git` for purely local operations (commits, push/pull, working-tree state, local branch switching).

| Operation | Preferred tool |
|---|---|
| Create / read / update / list / merge PRs | `mcp__github__create_pull_request`, `mcp__github__pull_request_read`, `mcp__github__update_pull_request`, `mcp__github__list_pull_requests`, `mcp__github__merge_pull_request` |
| Submit / read PR reviews & inline review comments | `mcp__github__pull_request_review_write`, `mcp__github__add_comment_to_pending_review`, `mcp__github__add_reply_to_pull_request_comment` |
| Create / read / list issues, post issue comments | `mcp__github__issue_write`, `mcp__github__issue_read`, `mcp__github__list_issues`, `mcp__github__add_issue_comment`, `mcp__github__sub_issue_write` |
| List / get branches on GitHub, get commits, list tags / releases | `mcp__github__list_branches`, `mcp__github__create_branch`, `mcp__github__get_commit`, `mcp__github__list_commits`, `mcp__github__list_tags`, `mcp__github__list_releases`, `mcp__github__get_latest_release` |
| Fetch a file from a remote ref without checking it out | `mcp__github__get_file_contents` |
| Search code / issues / PRs / users / repos across GitHub | `mcp__github__search_code`, `mcp__github__search_issues`, `mcp__github__search_pull_requests`, `mcp__github__search_users`, `mcp__github__search_repositories` |
| Local commits, branching, push / pull, working-tree state | raw `git` |
| Actions / workflow runs, anything MCP doesn't cover | `gh` CLI |

**Why:** MCP tools return structured data (no `gh ... --json … | jq` plumbing), execute in fewer round-trips than chained shell calls, and avoid bash escaping for multi-line PR bodies / commit messages. Schema errors surface at call time, not at parse time. They also work uniformly across platforms (no PowerShell vs bash quoting differences).

**How to apply:**
- Before reaching for `gh pr <…>` / `gh issue <…>` / `gh api <…>`, check whether the equivalent `mcp__github__*` tool exists. If yes, prefer it.
- This includes opening the PR in [Rule 5](#5-pr-per-feature-push-and-open-a-pr-into-main-when-done) — `mcp__github__create_pull_request` is the preferred path; `gh pr create` is the fallback when MCP is unavailable.
- For PR reviews you intend to leave as the author or reviewer, prefer `mcp__github__pull_request_review_write` over `gh pr review` — the structured payload is less error-prone.
- For one-off local tasks (status, log, diff, blame), keep using `git` — MCP isn't a substitute for the local repo.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
