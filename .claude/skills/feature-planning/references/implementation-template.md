# <MXX-FXX[-RXX]> — <Feature / Requirement Name>

> Implementation document. Created by `/feature-planning`. Tracks the phased
> plan and per-task status for this item. The matching `MODULES.md` status flip
> and this file ship in the **same PR** as the code (root `CLAUDE.md` Rule 1–2).

## Item

- **ID:** `<MXX-FXX[-RXX]>` <!-- lowest shared ancestor if multi-requirement -->
- **Legacy ID:** `<e.g. SH-001, or — >`
- **MODULES.md status:** `Planned` → flip to `In Progress` when work starts,
  `Done` in the shipping PR.

## Dependencies

Other `MXX-FXX[-RXX]` items that must be `Done` first:

- `<ID>` — `<why>` (or "None")

## Summary

<2–4 sentences: what this delivers and who uses it. Pulled from MODULES.md +
the planning interview.>

## Acceptance criteria (the test plan)

From `MODULES.md` — these become `[Fact]` test names like
`M04_F03_R01_OnlyOneOpenShiftPerStation`:

- **AC1** — <criterion>
- **AC2** — <criterion>

## Layers touched

- [ ] Domain (entities, enums)
- [ ] Infrastructure — EF config + migration
- [ ] Application (Command/Query, DTO, Validator, interface)
- [ ] Infrastructure — handler
- [ ] Api (controller)
- [ ] Frontend (route, component, query hook, Zod schema, i18n)

## Out of scope

- <Explicitly excluded.>

## Phases

> Each phase is a vertical slice ordered so each builds on the last. Check
> tasks off as they land and verify. One PR per feature against `main`.
> Convention detail (EF config section order, controller pattern, CQRS naming,
> component patterns) lives in the scoped `CLAUDE.md` files — do not restate it
> here; the implementer loads it automatically.

### Phase 1 — <name>

- [ ] <Task> — *Acceptance:* <how to verify>

### Phase 2 — <name>

- [ ] <Task> — *Acceptance:* <...>

### Phase 3 — <name>

- [ ] <Task> — *Acceptance:* <...>

## MODULES.md edits required

- [ ] Flip `<MXX-FXX[-RXX]>` status (and any sub-requirements) to the right state
- [ ] Add any new requirement/feature rows discovered during planning
- [ ] Update the `Last Updated` date in the `MODULES.md` header

## Open questions

- <Genuinely undecided points. Empty if fully specified.>

## Implementation notes

<Blank at planning time. The implementer appends decisions, deviations from the
plan, and anything a reviewer should know.>
