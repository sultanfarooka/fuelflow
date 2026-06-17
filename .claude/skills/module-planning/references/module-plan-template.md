# <MXX> — <Module Name> — Module Plan

> Module plan. Created by `/module-planning`. Gives the module overview, the
> shared Foundation, the dependency order, and the build sequence. Per-feature
> detail lives in the sibling `<MXX-FXX>.md` task docs. The whole
> `docs/implementation/<MXX>/` directory is committed first on `module/<MXX>`
> and ships in the single module PR (root `CLAUDE.md` Rule 1–2).

## Module

- **ID:** `<MXX>`
- **Name:** `<module name>`
- **Tier / Order:** `<P0–P3>` / `<Order from Priority & Implementation Order>`
- **Overall status:** rolled up from in-scope feature statuses.

## In-scope features (this pass)

| Build # | Feature | Title | Status | Depends on |
|---|---|---|---|---|
| 0 | Foundation | shared spine | — | — |
| 1 | `<MXX-FXX>` | `<title>` | `<status>` | Foundation |
| 2 | `<MXX-FXX>` | `<title>` | `<status>` | `<MXX-FXX>` |

## Out of scope / already Done

- **Already Done (context, not re-planned):** `<MXX-FXX>` — `<title>`.
- **Out of scope this pass:** `<MXX-FXX>` — `<why deferred>`.

## Cross-module dependencies (must be Done first)

- `<MXX-FYY>` — `<why this module needs it>` (or "None").

## Shared spine (Foundation — built first)

- **Entities / enums:** `<new here / extends MXX>` + data model + migration
  strategy (one migration per feature vs. batched).
- **API surface:** shared controller(s) / route prefix / response shapes.
- **UI shell / IA:** shared shell or tabbed page, route prefix, role visibility.
- **i18n namespace:** `<shared English + Urdu key namespace>`.
- **Role × permission matrix:** Owner / Manager / Custom across the module.
- **Subscription gating:** `<which features are plan/tier-gated>`.

## Foundation tasks

> The Foundation is built first, before any feature. Atomic, ordered tasks at the
> same granularity as the feature task docs — each names its layer, file(s), and
> acceptance check. Use only the phases the Foundation needs (often Domain + EF
> config + shared UI/nav); drop the rest. Empty if the module has no real shared
> spine.

### Phase 1 — Domain

- [ ] <task> — *file:* `FuelFlow.Domain/<…>` — *Acceptance:* <check>

### Phase 2 — Infrastructure (EF config + migration)

- [ ] <task> — *files:* `…/Configurations/<X>Config.cs`, `AppDbContext` DbSet,
  migration `Add_<X>` — *Acceptance:* <migration applies>

### Phase 3 — Api / shared scaffolding

- [ ] <task> — *file:* `FuelFlow.Api/<…>` — *Acceptance:* <check>

### Phase 4 — Frontend (shared shell / nav / i18n)

- [ ] <task> — *files:* `fuel-flow-web/src/<…>` — *Acceptance:* <check>

## Dependency order & build sequence

`Foundation → <MXX-FXX> → <MXX-FXX> → …` (linear, no cycles). Each feature is
built after its prerequisites on the same branch, so it always sees them.

## Delivery

One `module/<MXX>` branch off `main`; features built sequentially in the order
above; one `module/<MXX> → main` PR at the end. No per-feature merge gates.

## Module-spanning journeys

- `<journey crossing several features, e.g. configure tank → add nozzle → set
  price → open shift>` — exercised by the per-feature e2e walks.

## Per-feature task docs

- `<MXX-FXX>.md` — `<title>`
- `<MXX-FXX>.md` — `<title>`

## MODULES.md edits required

- [ ] Flip each in-scope feature's rows to the right state as they land
      (`In Progress` → `Done`).
- [ ] Add any new requirement/feature rows discovered during planning.
- [ ] Update the `Last Updated` date in the `MODULES.md` header.

## Open questions

- <Genuinely undecided module-level points. Empty if fully specified.>
