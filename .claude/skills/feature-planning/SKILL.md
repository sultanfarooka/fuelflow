---
name: feature-planning
description: Plan a feature or requirement before implementation. Reads docs/MODULES.md, lets the user pick a MXX-FXX[-RXX] item, runs a requirements interview, and writes a phase-based implementation document. Invoke with /feature-planning, or use when the user wants to start, plan, or scope new work.
disable-model-invocation: true
---

# Feature Planning — Fuel Flow

Runs the planning stage before any code is written. Manually invoked
(`/feature-planning`). Output is a reviewed planning document — never code.

This skill assumes the Fuel Flow repo conventions in the root `CLAUDE.md`
(Rules 1–9) and the `MXX-FXX-RXX` registry in `docs/MODULES.md`.

## Procedure

### 1. Load MODULES.md and present what can be started

Read `docs/MODULES.md`. The user either names an item (e.g. "plan M04-F03")
or asks what to work on. If they ask:

- Show the **Current Priorities** section first — that is the intended order.
- Otherwise list features/requirements whose status is `Planned` (not `Done`,
  `In Progress`, or `Out of Scope`), grouped by module.

Do not proceed until the user picks a specific `MXX-FXX` or `MXX-FXX-RXX`.

Per root `CLAUDE.md` Rule 1: if the work has no entry in `MODULES.md` yet,
add it before planning — a new `RXX` row, a new `### MXX-FXX` section, or (rare,
flag it) a new module. State the chosen ID explicitly at the start.

### 2. Run the requirements interview

`MODULES.md` already carries the requirement text and acceptance criteria. Do
NOT re-derive those — read them, and interview the user to fill what the
registry does not capture. Ask a few focused questions at a time covering:

- **Layers touched** — which of Domain / Application / Infrastructure / Api /
  frontend this spans. Most features touch several.
- **Domain** — new or changed entities, enums, navigation/FK properties.
- **Data** — new tables, columns, indexes, global query filter needs,
  migration impact.
- **Application** — new Commands/Queries, DTOs, validators, repository or
  service interfaces.
- **Api** — new controller or actions, route, `[Authorize]` roles, response
  shape, multi-tenancy guard.
- **Frontend** — routes (and role access), components, TanStack Query hooks,
  Zod schemas, i18n keys.
- **Acceptance criteria** — confirm the `.ACx` entries in `MODULES.md` are the
  full test plan; if the interview reveals a gap, a new `RXX` row is needed
  (Rule 1).
- **Out of scope** — what this item explicitly does not include.

Stop only when the spec could be handed to another engineer with no follow-up
questions.

### 3. Write the implementation document

Create `docs/implementation/<id>.md` (e.g. `docs/implementation/M04-F03.md`)
from `references/implementation-template.md`. Fill every section from
`MODULES.md` plus the interview. Phases are vertical slices ordered so each
builds on the last — for a typical backend feature that is Domain → config +
migration → Application (command/query + validator) → Infrastructure handler →
Api controller → frontend. Do not invent requirements; genuinely undecided
points go under "Open questions".

Do NOT restate convention detail (EF config order, controller pattern, CQRS
naming). Those live in the scoped `CLAUDE.md` files and load automatically when
the implementer works in that folder. The plan references them, it does not
copy them.

### 4. Hand back for review

Give the user the document path and a short phase summary. Remind them:
review and edit the doc, then start implementation. Per Rule 1, the
`MODULES.md` edit and this planning artefact ship in the **same PR** as the
implementation — not as a follow-up. Do not write code from this skill.

## Notes

- Plan one `MXX-FXX[-RXX]` item per run; one document per item.
- If the item spans several requirements, plan at the lowest shared ancestor
  (e.g. `M04-F03` covering `R01` and `R02`) — matches Rule 1.
