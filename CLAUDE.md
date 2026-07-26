# Fuel Flow

Comprehensive filling station management system for the Pakistani market — multi-tenant SaaS for owners running one or more pumps (fuel inventory, shift ops, credit/udhaar, OGRA pricing, reports), with English/Urdu and phone-first login.

**Setup, tech stack, repo layout:** see [`README.md`](README.md) and per-layer scoped `CLAUDE.md` files (Rule 9 below).

## Multi-Tenancy Model (one-paragraph summary)

Two EF Core contexts: `ControlPlaneDbContext` (Identity, Tenants, Subscriptions, reference data — always in the shared DB) and `AppDbContext` (per-tenant operational tables — routed to a per-org physical PostgreSQL DB `tenant_<org_id>` via the JWT `org_id` claim). Cross-context references are plain `Guid` columns — no FK constraints cross DbContexts. Full details: [`server/FuelFlow.Infrastructure/CLAUDE.md`](server/FuelFlow.Infrastructure/CLAUDE.md).

## Universal invariants

- **Multi-tenancy:** every per-tenant query routes through `AppDbContext` (per-tenant DB); cross-context refs are plain `Guid`, never FKs.
- **Auth:** JWT in HTTP-only cookies only; never `Authorization: Bearer`.

Layer-specific rules (validation, DTOs, station filtering, error responses, audit emissions, etc.) live in the scoped `CLAUDE.md` next to the code they apply to — see Rule 9.

## Source of Truth for Modules / Features

**[`docs/SRD.md`](docs/SRD.md) is the authoritative registry** — indexes every module and links to the per-feature spec at `docs/srd/MXX-*/FXX-*.md`. Each feature has a stable hierarchical ID (`MXX-FXX[-RXX]`) — reference it in commits, PR titles, GitHub Issues, test names, and code comments.

> **Transition:** SRD-migrated modules today are **M01**, **M16**, **M17**. Modules **M02–M15 (except M16)** still live in deprecated [`docs/MODULES.md`](docs/MODULES.md) — treat that file as read-only; do not add new rows. See [`docs/CLAUDE.md`](docs/CLAUDE.md) for the transition rules. Legacy IDs (SH-001, PR-001, REG-001, SUB-001, AUD-001, …) remain valid; mapping in `MODULES.md` Appendix A.

| Document | Purpose |
|---|---|
| [`docs/SRD.md`](docs/SRD.md) | SoT — module index + per-feature SRD specs under [`docs/srd/`](docs/srd/) |
| [`docs/MODULES.md`](docs/MODULES.md) | **Deprecated** — legacy specs for unmigrated modules |
| [`docs/ProjectOverView.md`](docs/ProjectOverView.md) | Business requirements, user stories |
| [`docs/CHANGELOG.md`](docs/CHANGELOG.md) | Version history, architectural decisions |

## Getting started with a new feature — AI Workflow

Every feature moves through the **AI Workflow** pipeline: one slash-command per stage, each stage reads the previous stage's artefact as its scope contract and flips the SRD `lifecycle:` field. The full protocol (stage-by-stage, module-level synthesis, design-only PR path, propagation rules) lives in **[`docs/AI-WORKFLOW.md`](docs/AI-WORKFLOW.md)** — read it once, then use the summary below.

| # | Stage | Command | Artefact | `lifecycle:` after |
|---|---|---|---|---|
| 0 | SRD spec | `/feature-discovery` | `docs/srd/MXX-*/FXX-*.md` | `drafting` (feature) |
| 1 | Module plan ★ | `/plan-module MXX` | `docs/plans/<MXX>/module-plan.md` | `planned` (module) |
| 2 | Feature plan (conditional) | `/plan-feature MXX-FXX` | `docs/plans/<MXX>/<MXX-FXX>.md` | `spec-locked` |
| 3 | Design | `/design-feature MXX-FXX` | `fuel-flow-web/src/designs/<MXX-FXX>/*.tsx` | `design-approved` |
| 3.5 | Design-only PR (optional) | `mcp__github__create_pull_request` | merged design PR | (unchanged; design lives on main) |
| 4 | Implementation | `/feature-implementation MXX-FXX` | `server/**` + `fuel-flow-web/src/**` | `in-implementation` |
| 5 | E2E | `/feature-e2e-testing MXX-FXX` | `fuel-flow-web/e2e-tests/<MXX-FXX>.spec.ts` | (stays) |
| 6 | Ship | `mcp__github__create_pull_request` | merged feature PR | `shipped` (feature) |
| 7 | Feature recap | `/recap-feature MXX-FXX` | `docs/plans/<MXX>/<MXX-FXX>-recap.md` | (terminal) |
| 8 | Module recap ★ | `/recap-module MXX` | `docs/plans/<MXX>/module-recap.md` | `shipped` (module) |

**Start with `/plan-module MXX`** for modules with ≥3 interacting features (M01, M03, M06, M08). It synthesises the shared data model, shared UI shells, event flow, auth matrix, shipping DAG, and — crucially — its §8 table decides which features still need `/plan-feature` and which can go straight to `/design-feature`. This cuts per-feature planning cost and prevents cross-feature drift (shared model reshaped in one plan, different in another). Skip module plan for modules with ≤2 features or non-interacting features.

**Stop after any stage — the pipeline is designed for it.** The `lifecycle:` field is the persistence mechanism: `design-approved` literally means "designed, not yet implemented." Come back weeks later and `/feature-implementation MXX-FXX` reads `plan.md` + `designs/*.tsx` from disk and continues from there.

**Two ways to run "design every feature first, then implement each":**

1. **Local branches** — one `feat-<id>-<name>` branch per feature, plan + design committed and pushed, no PR opened. Come back per feature for impl + E2E + PR. Simplest.
2. **Design PRs to main (stage [3.5])** — use branch pair `design-<id>-<name>` (design PR merged to main; safe because designs are dev-only) then `feat-<id>-<name>` off freshly-merged main for the implementation PR. Shared shells stabilise on main incrementally; each design is reviewable in the real repo. Two PRs per feature instead of one.

**Skip stages for trivial features** per each skill's "when to skip" heuristic — a copy tweak or single-file fix goes straight to the feature PR at [6]. **Every stage supports backpressure**: if a later stage finds a spec bug, it emits `ESCALATE_TO_SRD:` and the main thread routes back to `/feature-discovery` (or `/plan-module --refresh`) before the offending stage resumes — no silent scope expansion.

The workflow rules below (branching, commit scopes, PR conventions, lifecycle flips) formalise what each stage does at the git level.

## Development Workflow (MANDATORY)

Non-negotiable for every piece of work.

### 1. Locate the feature in `SRD.md` before doing any work

Identify the matching `MXX-FXX[-RXX]` ID via [`docs/SRD.md`](docs/SRD.md). That ID drives the branch name (Rule 4), commit scopes (Rule 7), PR title (Rule 5), test names (Rule 7), and lifecycle update (Rule 2). **State it at the start of every task.** If the task spans multiple features, pick the lowest-level shared ancestor. Cross-cutting infra work that maps to no module may skip the ID — rare.

For **unmigrated modules** (M02–M15 except M16), specs are in [`docs/MODULES.md`](docs/MODULES.md). When you next touch one substantively, **migrate that module to SRD first** in the same PR.

If SRD has no entry yet for the work: add one before writing code — new R inside an existing feature, new `FXX-*.md` for a new feature, or scaffold a new `srd/MXX-*/` folder for a new module (flag M-level additions in your plan first). SRD edits + planning artefact + implementation = **same PR**.

### 2. SRD lifecycle is the heartbeat

Every `docs/srd/MXX-*/FXX-*.md` carries a `lifecycle` in its frontmatter (`drafting` / `spec-locked` / `design-approved` / `in-implementation` / `shipped`, with off-ramps `superseded` / `removed`). Flip it the moment its state changes — picking up = `in-implementation`; shipping = `shipped` + bump `SRD.md` index + bump file `last-updated`. For items still in `MODULES.md`, same rule for the `Status` column.

### 3. Always branch off `main`

```bash
git checkout main
git pull --ff-only origin main
git checkout -b feat-<feature-id>-<short-name>
```

### 4. Branch naming

`feat-<id>-<adequate-name>` — id lowercase-hyphenated (`m04-f03-r01`), name 3–6 kebab words. `fix-`/`docs-` for fixes/docs. Example: `feat-m04-f03-r01-one-open-shift-per-station`.

**Design-only PR variant** (AI Workflow stage [3.5]): if you want to ship plan + design to main before implementation, use `design-<id>-<adequate-name>` for the design PR, then cut `feat-<id>-<adequate-name>` off freshly-merged main for the implementation PR. Full protocol: [`docs/AI-WORKFLOW.md`](docs/AI-WORKFLOW.md#design-only-pr-path).

**Module plan PR** (AI Workflow stage [1]): docs-only branch `feat-<mxx>-module-plan` off main, ships as a small docs PR.

### 5. PR-per-feature into `main`

Push (`git push -u origin <branch>`), open PR via `mcp__github__create_pull_request` (Rule 10). Title: `M04-F03-R01: enforce one-open-shift-per-station`.

### 6. PR description

PR template auto-populates from [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md) — fill it in. The SRD lifecycle flip (or `MODULES.md` status flip for unmigrated modules) is part of the **same PR** — never a follow-up.

### 7. Conventional commits

Prefix with the ID: `feat(m04-f03): …`, `fix(m11-f06): …`, `test(m04-f03-r01): …`. Test names also reference the ID: `M04_F03_R01_OnlyOneOpenShiftPerStation`.

### 8. Lint / format before pushing

Frontend: ESLint + Prettier must pass. Backend: `dotnet format` must produce no diff.

### 9. Reference content lives in scoped `CLAUDE.md` files — not a single PRD

There is no top-level PRD. Tech-stack, architecture, API conventions, DB schema, and UI specs are documented inside the **scoped `CLAUDE.md`** for each project / folder, alongside the code.

| Content | Lives in |
|---|---|
| Module / feature IDs, lifecycle, acceptance criteria | [`docs/SRD.md`](docs/SRD.md) → `docs/srd/MXX-*/FXX-*.md` |
| Legacy specs for unmigrated modules | [`docs/MODULES.md`](docs/MODULES.md) (deprecated) |
| Backend tech stack, Clean Architecture, CQRS+MediatR | [`server/CLAUDE.md`](server/CLAUDE.md) |
| API conventions, sample payloads, controller list | [`server/FuelFlow.Api/CLAUDE.md`](server/FuelFlow.Api/CLAUDE.md) |
| **Endpoint catalogue (authoritative)** | **Swagger** at `/swagger` — auto-generated |
| Commands / Queries patterns, validators, multi-tenancy guards, Mapperly | [`server/FuelFlow.Application/CLAUDE.md`](server/FuelFlow.Application/CLAUDE.md) |
| Entity model, ER diagram | [`server/FuelFlow.Domain/CLAUDE.md`](server/FuelFlow.Domain/CLAUDE.md) |
| **DB schema (authoritative)** | **EF Core migrations** under `server/FuelFlow.Infrastructure/Migrations/` |
| EF Core configurations, query filters, DB rules | [`server/FuelFlow.Infrastructure/CLAUDE.md`](server/FuelFlow.Infrastructure/CLAUDE.md) |
| Frontend tech stack, state, forms, routing, i18n, PWA | [`fuel-flow-web/CLAUDE.md`](fuel-flow-web/CLAUDE.md) |
| Route → role mapping, registration / onboarding flows | [`fuel-flow-web/src/routes/CLAUDE.md`](fuel-flow-web/src/routes/CLAUDE.md) |
| Component patterns (shadcn, Field, Dialog/Sonner/Recharts) | [`fuel-flow-web/src/components/CLAUDE.md`](fuel-flow-web/src/components/CLAUDE.md) |
| API client, Zod validators, utilities | [`fuel-flow-web/src/lib/CLAUDE.md`](fuel-flow-web/src/lib/CLAUDE.md) |

When the authoritative artefact is the code itself (Swagger, migrations), the scoped `CLAUDE.md` is a *summary index* — code wins on disagreement; update the `CLAUDE.md`. For cross-cutting business specs (a new requirement / lifecycle flip), always update the SRD spec (or `MODULES.md` for unmigrated modules) — never a scoped `CLAUDE.md`.

### 10. Prefer the GitHub MCP server over the `gh` CLI

When `mcp__github__*` tools are available, use them for any operation that touches GitHub server state — PRs, issues, reviews, comments, releases, code search. Use `gh` only for what MCP doesn't cover (e.g. Actions workflow runs). Use raw `git` for purely local operations. Full lookup table: [`.github/github-mcp-cheatsheet.md`](.github/github-mcp-cheatsheet.md).

## graphify

Knowledge graph at `graphify-out/` with god nodes, community structure, and cross-file relationships.

- For codebase questions, first run `graphify query "<question>"` when `graphify-out/graph.json` exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts — these return a scoped subgraph, usually much smaller than `GRAPH_REPORT.md` or raw grep output.
- If `graphify-out/wiki/index.md` exists, use it for broad navigation instead of raw source browsing.
- Read `graphify-out/GRAPH_REPORT.md` only for broad architecture review or when query/path/explain don't surface enough.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
