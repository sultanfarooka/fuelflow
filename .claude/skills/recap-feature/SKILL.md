---
name: recap-feature
description: Post-ship recap for one SRD feature (MXX-FXX). Diffs the shipped code and tests against the pre-ship plan.md; captures deviations, follow-up items, tech debt introduced, analytics coverage, and learnings that should feed the next feature. Produces `docs/plans/<MXX>/<MXX-FXX>-recap.md`. Runs after the feature's PR is merged (or standalone anytime after ship to backfill). Closes the plan → design → implement → ship loop that would otherwise leave archaeology unanswered six months later.
---

# /recap-feature — post-ship feature recap

The last stop in the feature lifecycle (see `docs/srd/README.md` for the full pipeline). After the PR ships, this skill:

- Reads `docs/plans/<MXX>/<MXX-FXX>.md` (the pre-ship contract)
- Reads the shipped code, tests, migrations, and design files
- Detects deviations (what changed vs. what was planned)
- Records follow-ups, tech debt, learnings
- Writes `docs/plans/<MXX>/<MXX-FXX>-recap.md`

The recap is the artefact anyone opening `docs/plans/M01/` six months from now reads to understand **what shipped and why it differed from the plan**. `git log` shows the how; recap.md shows the intent.

## When to use

- **Immediately after PR merge** — recall is freshest, follow-ups clearest.
- **Before starting a related feature** — the recap of M01-F01 is required reading before planning M01-F02.
- **Standalone / backfill** — for features shipped before this skill existed. Same shape, just labelled `backfilled: true` in frontmatter.

Skip only when:
- The feature was trivial (skipped `/plan-feature` too — nothing to diff against)
- The feature was reverted or superseded before ship (use `lifecycle: superseded` in SRD frontmatter instead)

## Workflow

### Phase A — Load context

1. Parse the feature ID from `$ARGUMENTS`. Accept `MXX-FXX` (with optional `-RXX` — that's routed to feature-level).
2. Locate artefacts:
   - Plan: `docs/plans/<MXX>/<MXX-FXX>.md` (mandatory — if missing, return `BLOCKED: no plan.md — nothing to diff against`)
   - SRD spec: `docs/srd/M{XX}-*/F{XX}-*.md` or `docs/MODULES.md` section
   - Design: `fuel-flow-web/src/designs/<MXX-FXX>/*.tsx` (may be gone — designs are marked disposable)
   - Shipped code: use grep for the feature ID across `server/**`, `fuel-flow-web/src/**`
   - Tests: unit tests referencing the feature ID, `fuel-flow-web/e2e-tests/<MXX-FXX>.spec.ts`
   - Migrations: `server/FuelFlow.Infrastructure/Migrations/*<matching-name>*` files created since plan approval
   - PR: fetch via `mcp__github__list_pull_requests` filtered by branch prefix `feat-<id>-*`
3. Read the plan.md and the shipped artefacts.

### Phase B — Diff

Compare plan → shipped along seven dimensions. For each, note **what plan said**, **what shipped**, and **status** (matched / partial / missing / added-during-impl / deviated).

1. **Screens** — did every screen in the plan's Screens table ship? Any screens shipped that weren't in the plan?
2. **AC coverage** — did every AC in the plan's AC → surface map get an E2E test or unit test? Any AC silently dropped?
3. **Backend endpoints** — did the endpoints in the plan's Backend flow ship with the planned request/response shapes? Any auth / rate-limit / validation added or removed?
4. **Data model** — did the migrations match the plan's Data model impact? Any additional schema changes?
5. **Analytics** — did the events in the plan's Analytics section get instrumented? Grep for `analytics.track("otp.sent")` etc. and cross-reference.
6. **Test strategy** — E2E happy path shipped? Failure paths covered? Anything the plan said "not designable" ended up untested silently?
7. **Cross-feature dependencies** — did the plan's `depends on` features actually exist at ship time? Any new dependencies added during impl?

For each dimension, ask the user to explain material deviations (if any) via `AskUserQuestion`:
- **Intentional** — will be recorded with the reason
- **Discovered too late to update plan** — will be recorded as "should have been in plan"
- **Bug / not intentional** — will be recorded as follow-up

### Phase C — Collect learnings

Ask the user (via `AskUserQuestion`, optional — user can skip any):

- **What went well?** One or two sentences.
- **What surprised you?** Where did reality diverge from the plan?
- **What tech debt was introduced?** e.g. hardcoded values, skipped tests, `TODO` comments
- **What follow-up items?** Bugs to fix, features implied but not built, refactors owed
- **What should the next feature learn from this?** e.g. "always mock the SMS provider in dev", "the Alert primitive's grid override bites in narrow columns"

### Phase D — Write recap.md

Assemble the recap and present for approval before writing. On approval:

- Write `docs/plans/<MXX>/<MXX-FXX>-recap.md`
- Ensure SRD lifecycle is `shipped` (bump if still `in-implementation`) with today's date
- Bump `docs/SRD.md` index row if the lifecycle changed
- Print a summary with paths and next-feature guidance (e.g. "M01-F02's plan should reference this recap's learning about SMS mocking")

## `recap.md` structure

```markdown
---
feature: MXX-FXX
title: <from SRD>
shipped_at: YYYY-MM-DD
pr: <url>
backfilled: false
recap_last_updated: YYYY-MM-DD
---

# MXX-FXX — <title> · Recap

> Post-ship diff between plan and reality. Pairs with:
> - Plan: [plan.md](./plan.md)
> - SRD: [MXX-FXX](../../srd/MXX-*/FXX-*.md)

## Deviations

| Dimension | Plan said | Shipped | Reason |
|---|---|---|---|
| Screens | … | … | intentional / discovered late / bug |
| ACs | … | … | … |
| Backend | … | … | … |
| Data model | … | … | … |
| Analytics | … | … | … |
| Tests | … | … | … |
| Cross-feature | … | … | … |

## What went well

- …

## What surprised us

- …

## Tech debt introduced

- **TD-1:** … (line / file / owner)

## Follow-up items

- **FU-1:** … (severity, target milestone)
- **FU-2:** …

## Learnings for the next feature

- **L-1:** … (which feature this should inform)

## Files touched

<Auto-list from git diff main..<merged-branch>. Group by layer: Domain / App / Infra / Api / Frontend / Tests / Docs.>
```

## Contract with the pipeline

- **Reads plan.md as authoritative pre-ship contract.**
- **Reads shipped code as authoritative post-ship reality.**
- **Feeds forward into future plans.** `/plan-feature` should read the recap.md of any dependency feature listed in the SRD spec's §7. Learnings shape the plan.
- **Not a bug tracker.** Follow-up items in recap.md are noted, not managed. They should be filed as issues or added to the SRD spec (via `/feature-discovery`) if they're new requirements.
- **Runs standalone.** No agent spawn needed for small features. For features with substantial diffs (many deviations), spawn a `general-purpose` agent for the diff analysis.

## Cost note

Small feature: ~10–15k tokens (read plan + shipped code, one-pass diff).
Large feature (many deviations): ~25–40k tokens.
Skip entirely for trivial features that had no plan.
