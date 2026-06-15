# <MXX-FXX> — <Feature Name>  (part of module <MXX>)

> Feature task document. Created by `/module-planning` as part of the `<MXX>`
> module plan. Tracks the granular, task-level plan and per-task status for this
> feature. Built on the `module/<MXX>` branch in dependency order; the matching
> `MODULES.md` status flips ride the single module PR (root `CLAUDE.md` Rule 1–2).
> Sibling overview: `_module-plan.md`.

## Item

- **ID:** `<MXX-FXX>`
- **Parent module:** `<MXX>`
- **Build order #:** `<n in the module build sequence>`
- **MODULES.md status:** `Planned` → flip to `In Progress` when this feature's
  work starts → `Done` when it lands on the module branch.

## Dependencies (built first on the branch)

Built before this feature on `module/<MXX>`:

- Foundation (shared spine) — always.
- `<MXX-FYY>` — `<why>` (or "None beyond the Foundation").

## Summary

<2–4 sentences: what this feature delivers and who uses it. From MODULES.md +
the module interview.>

## Shared-spine usage

What this feature consumes from the Foundation (reuse, do not re-create):

- **Entities / DTOs:** `<shared types>`.
- **Routes / API:** `<shared controller / route prefix>`.
- **i18n:** `<shared namespace keys>`.

## Acceptance criteria (the test plan)

From `MODULES.md` `<MXX-FXX>` — these become `[Fact]` test names like
`<MXX>_<FXX>_R01_<Behavior>`:

- **AC1** — <criterion>
- **AC2** — <criterion>

## Layers touched

- [ ] Domain (entities, enums)
- [ ] Infrastructure — EF config + migration
- [ ] Application (Command/Query, DTO, Validator, interface)
- [ ] Infrastructure — handler
- [ ] Api (controller)
- [ ] Frontend (route, component, query hook, Zod schema, i18n)

## Tasks

> Atomic, ordered. Each task names its layer, the file(s) it touches, and its
> acceptance check. Tick `- [ ]` → `- [x]` in the same commit as the work.
> Convention detail (EF config section order, controller pattern, CQRS naming,
> component patterns) lives in the scoped `CLAUDE.md` files — do not restate it
> here; the implementer loads it automatically. Drop any phase this feature does
> not touch.

### Phase 1 — Domain

- [ ] <task> — *file:* `FuelFlow.Domain/<…>` — *Acceptance:* <check>

### Phase 2 — Infrastructure (EF config + migration)

- [ ] <task> — *files:* `FuelFlow.Infrastructure/.../Configurations/<X>Config.cs`,
  `AppDbContext` DbSet, migration `Add_<X>` — *Acceptance:* <migration applies>

### Phase 3 — Application

- [ ] <task> — *files:* `FuelFlow.Application/<…>` (Command/Query, DTO, Validator,
  interface) — *Acceptance:* <check>

### Phase 4 — Infrastructure (handler)

- [ ] <task> — *file:* `FuelFlow.Infrastructure/.../Handlers/<…>` returning
  `Result<T>`, multi-tenancy guard applied — *Acceptance:* <check>

### Phase 5 — Api

- [ ] <task> — *file:* `FuelFlow.Api/Controllers/<…>` thin dispatch via
  `IMediator` — *Acceptance:* <route, `[Authorize]` roles, response shape>

### Phase 6 — Frontend

- [ ] <task> — *files:* `fuel-flow-web/src/<…>` (route + role guard, component,
  TanStack Query hook, Zod schema, i18n keys) — *Acceptance:* <check>

## Out of scope

- <Explicitly excluded from this feature.>

## Open questions

- <Genuinely undecided points. Empty if fully specified.>

## Implementation notes

<Blank at planning time. The module-implementer appends decisions, deviations
from the plan, and anything a reviewer should know.>

## E2E verification (Playwright MCP)

<Blank at planning time. The feature-e2e-tester appends the walked journeys,
fixed bugs, and the spec path after the feature is built.>
