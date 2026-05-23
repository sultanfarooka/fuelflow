# Scope fence

> Claude checks this file at session start, alongside [`docs/ACTIVE-TASK.md`](ACTIVE-TASK.md).
> Do not touch frozen paths. Log deferred ideas — do not implement them.
> The **live** priority queue is in [`docs/MODULES.md`](MODULES.md) "Current Priorities" — this file mirrors the in-flight selection and adds the dimensions MODULES.md doesn't track (frozen paths, deferred ideas).

## In scope for current sprint

Source of truth: [`docs/MODULES.md`](MODULES.md) "Current Priorities".

| # | ID | Title | Area |
|---|---|---|---|
| 1 | [M07-F07](MODULES.md#m07-f07--ui-shell) | Basic UI shell (layout, sidebar, navigation) | Frontend |
| 2 | [M01-F09](MODULES.md#m01-f09--phone-first-authentication) | Phone-first authentication (SMS OTP, phone-primary login, email optional) | Full-stack |
| 3 | [M01-F05-R02](MODULES.md#m01-f05--roles--hierarchy), [M01-F05-R03](MODULES.md#m01-f05--roles--hierarchy), [M01-F06](MODULES.md#m01-f06--granular-permissions) | User management — Owner creates Managers; Managers create Custom Users with granular permissions | Backend |
| 4 | [M11-F08](MODULES.md#m11-f08--plan-comparison--pricing-page) | Pricing page (plan comparison, monthly/yearly toggle) | Frontend |

When this list drifts from MODULES.md "Current Priorities", **MODULES.md wins** — update this file.

## Frozen (do not touch)

| Path | Reason | Owner | Unfreeze when |
|---|---|---|---|
| _none today_ | — | — | — |

> Add a row when a path is temporarily off-limits — e.g., a legacy auth path during a migration, a vendored library mid-upgrade, or a hot-fix branch that must not be re-touched until shipped. Always include a reason and the condition that lifts the freeze.

## Deferred (valid ideas — not now)

| Idea | Why deferred | Reconsider when |
|---|---|---|
| _none captured_ | — | — |

> Use this row when an idea surfaces mid-session that is genuinely worth doing but not part of the current scope. Better than losing the idea or implementing it out-of-scope. For requirements that belong to a future feature, prefer adding them to [`MODULES.md`](MODULES.md) directly with `Status: Planned` per root [`CLAUDE.md`](../CLAUDE.md) Rule 1.
