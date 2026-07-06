---
name: plan-feature
description: Draft the implementation plan for one SRD feature (MXX-FXX[-RXX]) before design or code. Produces `docs/implementation/<MXX-FXX>/plan.md` with the screen inventory, user journeys, backend flow, AC → surface mapping, open questions, test strategy, analytics events, and cross-feature dependencies. Invokes `/feature-discovery` on the fly when the planning discussion surfaces a new requirement that needs to be classified against the SRD. Its output is the canonical input for `/design-feature` (which reads plan.md to scope screen generation) and for `/feature-implementation`. Use whenever the user picks up a feature, before spawning designs or writing code.
---

# /plan-feature — feature implementation plan

Produces a durable planning artefact at `docs/implementation/<MXX-FXX>/plan.md` that answers:

- **Which screens** does this feature own?
- **How does the user move through them?** (state machine / journey)
- **What backend does it invoke?** (endpoints, side effects, audit events)
- **Which AC maps to which surface** (UI vs backend vs both)?
- **What's ambiguous** in the spec that we must resolve before design?
- **What could go wrong** in production (test strategy)?
- **What must we instrument** (analytics)?
- **What depends on this / what does this depend on?** (cross-feature)
- **Does the DB schema change?**

`/design-feature` reads this file as its scope contract. `/feature-implementation` reads it too. It is the bridge between the SRD spec and the running code.

Applies both to migrated modules (M01, M16, M17 today) whose specs live under `docs/srd/MXX-*/FXX-*.md` and to features still in `docs/MODULES.md` — with the same output shape.

## When to skip

Trivial features skip the planning artefact — same heuristic as `/design-feature`:

- Confirmation dialogs, single-action modals, settings toggles, static empty states → build directly
- Cross-cutting infra (validators, hooks, migrations that map to no MXX-FXX) → skip; use SRD comments instead

The playground pays off when the feature has ≥3 states OR ≥2 viewports OR a real user journey. The plan pays off any time the feature has ≥2 screens OR ≥3 acceptance criteria OR any material backend flow. When in doubt, plan — it's cheaper than an agent iteration.

## Workflow

The skill runs in **four phases**, gated by the user at each hand-off.

---

### Phase A — Resolve the feature and load context

1. Parse the feature ID from `$ARGUMENTS`. Accept `MXX-FXX` or `MXX-FXX-RXX` (case-insensitive).
   - Missing / unparseable → `AskUserQuestion` populating options from `docs/SRD.md` `drafting` features that don't yet have a plan file.
2. Locate the spec:
   - **Preferred:** glob `docs/srd/M{XX}-*/F{XX}-*.md`.
   - **Fallback:** `docs/MODULES.md` section `M{XX}-F{XX}` if the SRD file doesn't exist AND the module is listed under "Unmigrated" in `docs/SRD.md`.
   - Neither → return `BLOCKED: feature MXX-FXX has no SRD or MODULES.md entry — run /feature-discovery first`.
3. Read in parallel:
   - Spec file (mandatory)
   - `docs/srd/M{XX}-*/README.md` module context (if it exists)
   - Any linked features cited in the spec's §7 Dependencies / §1 cross-references
   - Existing `docs/implementation/<MXX-FXX>/` folder — if `plan.md` already exists, ask before overwriting (offer: refresh, iterate, cancel)
4. State the resolved ID + the SRD path used in one sentence.

### Phase B — Draft the plan structure

Extract the following from the spec — none require the user yet:

- **Screens inventory** — enumerate from §6 Flows / §5 Acceptance Criteria. Row per screen: name, purpose, primary states (default / loading / error / empty / api-4xx variants).
- **User journey** — sketch a state diagram from the flows (`stateDiagram-v2` Mermaid). Include entry points (which feature / route lands here), success outcome (which feature / route to next), and failure outcomes (recovery paths).
- **Backend flow** — enumerate endpoints, HTTP methods, request/response shapes, side effects (SMS, email, audit events per §8, cache invalidation), and preconditions (auth, tenant scope).
- **AC → surface mapping** — table with columns: AC id (R01, R02, …), UI screen(s) it lands on, backend behaviour it requires, "backend-only" flag for the ACs the user can't see. Missing rows are a red flag.
- **Open questions** — read the spec critically. What does it not answer? Common gaps: microcopy tone, error message wording, race conditions, boundary values (min/max/off-by-one), retry semantics, race-condition winner, offline behaviour, RTL edge cases. Prefix each with `OQ-N:` for tracking.
- **Test strategy** — split into E2E (Playwright, mandatory happy path + at least one failure), unit (validators, hooks), and "not designable" (backend-only ACs that ship without visual coverage).
- **Analytics events** — what to instrument. Format: `<domain>.<action>` (e.g. `otp.sent`, `otp.verified`, `otp.expired`, `otp.rate_limited`). Include event properties.
- **Data model impact** — new tables, columns, migrations, indexes, constraints. Check `server/FuelFlow.Infrastructure/Migrations/` for existing schema. Nothing new = state "No schema changes."
- **Cross-feature dependencies** — read §7 Dependencies. List both `depends on ...` and `is depended on by ...`. If a dependency is `drafting` or missing, flag it.

Write to memory (don't file-write yet). This is the draft the user reviews.

### Phase C — Interactive review with SRD validation

Present the plan section by section. For each section use `AskUserQuestion` with options: **Approve**, **Iterate**, **Skip** (some sections don't apply — e.g. no analytics for internal-only features).

**Critical:** at ANY point in Phase C the user may surface a NEW requirement or feature that's not in the current spec. Common phrasings:

- "We should also handle X"
- "What if the user does Y?"
- "Add a rule that Z"
- "This should apply to another module too"
- "I want to also cover W"

When you detect this, you MUST NOT silently add it to the plan. Instead:

1. **Confirm intent** — quote the ask back to the user and ask via `AskUserQuestion`:
   - "Add as a new requirement, validated against the SRD" (Recommended)
   - "Add to this plan only, don't touch SRD" (design note, non-canonical)
   - "Discard — was thinking aloud"
2. **If "validated against SRD"** → invoke the `feature-discovery` skill via the Skill tool with the requirement text and the current feature ID as context. Let feature-discovery classify:
   - Duplicate of an existing R/F
   - New R-row under the current feature
   - New R-row under a DIFFERENT feature (needs cross-feature edit)
   - New feature (F-level) inside an existing module
   - New module (M-level, flag for team discussion)
   - Conflict with an existing R/F (needs resolution)
   And detect cascading impacts (other features' §7 Dependencies, §1 cross-references, §8 Audit emissions, §9 API surface).
3. **Present feature-discovery's findings + the cascading impacts** to the user as one approval gate. On approval, feature-discovery applies its edits to SRD (both the frontmatter lifecycle AND the `docs/SRD.md` index row, per its own contract).
4. **Return to the plan** — add the newly-validated requirement to the AC → surface mapping table. Update open questions if the new requirement raised any. Update cross-feature dependencies if it touched other features.

Do NOT let unvalidated requirements slip into the plan. The plan is a contract — every AC row must trace back to a validated SRD line.

### Phase D — Finalize and hand off

1. Assemble the plan.md content (structure below).
2. Present the full plan to the user via `AskUserQuestion`:
   - **Approve and write to disk**
   - **Iterate on a specific section** (specify which)
   - **Cancel**
3. On approve:
   - Write `docs/implementation/<MXX-FXX>/plan.md`
   - If the feature was `drafting` in the SRD frontmatter AND every AC now has a resolved surface + resolved open questions, offer to bump the SRD lifecycle to `spec-locked` (the state where "we know what to build; now we design").
4. Print the hand-off summary — one line each:
   - Plan file written
   - SRD lifecycle change (if any)
   - New requirements added via `/feature-discovery` (if any) with their new IDs
   - Recommended next command: `/design-feature MXX-FXX` (or note if plan says the feature is not designable in the playground per the "when to skip" rules)

## `plan.md` structure

The file uses YAML frontmatter followed by sections. Everything is markdown so GitHub renders it fully (including mermaid).

```markdown
---
feature: MXX-FXX
title: <short title from SRD>
srd_path: docs/srd/M{XX}-.../F{XX}-...md
lifecycle_at_plan: <drafting | spec-locked | ...>
plan_last_updated: YYYY-MM-DD
---

# MXX-FXX — <title> · Implementation Plan

> Canonical input for `/design-feature` and `/feature-implementation`.
> SRD spec: [MXX-FXX](../../srd/MXX-*/FXX-*.md)

## Screens

| Screen | Purpose | States |
|---|---|---|
| … | … | default, loading, error, empty, api-409, api-429 |

## User journey

```mermaid
stateDiagram-v2
  [*] --> ...
  ...
```

## Backend flow

- **Endpoint** `POST /auth/…` — request: `{ ... }`, response: `{ ... }`
  - Preconditions: …
  - Side effects: audit `AUD-…`, SMS via `Sms:Provider`, cache invalidation …
  - Failure modes: 401 / 409 / 429 with the error codes and their UI treatment

## AC → surface mapping

| AC | UI screen | Backend behaviour | Backend-only? |
|---|---|---|---|
| R01 | … | … | no |
| R02 | — | … | yes |

## Open questions

- **OQ-1:** …
- **OQ-2:** …

(Open questions with no answer at design-time are surfaced by `/design-feature`
as CLARIFY prompts to the user.)

## Test strategy

- **E2E** (Playwright): happy path — …; failure — …
- **Unit**: …
- **Not designable in TSX**: R06, R07 (audit emissions, side effects)

## Analytics events

- `otp.sent` — properties: …
- `otp.verified` — properties: …

## Data model impact

<Either "No schema changes" or a bullet list of tables/columns/migrations.>

## Cross-feature dependencies

- **Depends on**: MXX-F.. — …
- **Depended on by**: MXX-F.. — …
- **New requirements introduced during planning** (via `/feature-discovery`):
  - MXX-FXX-RNN — …
```

## Contract with `/design-feature`

- `/design-feature` reads `docs/implementation/<MXX-FXX>/plan.md` at Phase A.
- It uses the **Screens** table to enumerate what TSX to generate — no more, no less.
- It uses the **AC → surface mapping** to know which ACs must be visible somewhere.
- It uses **Open questions** — if any remain unresolved in the plan, `/design-feature` surfaces them as CLARIFY prompts before generating.
- If `plan.md` is MISSING, `/design-feature` will warn but proceed (relaxed mode). Prefer running `/plan-feature` first.

## Backpressure — escalation to SRD

The pipeline is forward-flowing by default, but any stage may hit a spec bug or discover a
requirement the SRD doesn't cover. This skill formalises the escape hatch:

### When `/plan-feature` escalates

- The SRD spec is internally inconsistent (two AC rows conflict).
- The spec is missing a critical detail the plan can't invent (e.g. cooldown timings, error codes,
  audit event fields).
- Planning reveals a cross-feature contradiction with a shipped feature.
- A new requirement surfaces that the user chose "add as new SRD requirement" for.

### How

Emit an `ESCALATE_TO_SRD:` block instead of continuing to write plan.md:

```
ESCALATE_TO_SRD:
Feature: MXX-FXX
Reason: <one paragraph — what's ambiguous, what's contradicted, what's missing>
Suggested action: <invoke /feature-discovery / edit spec directly / discuss with team>
State: <what you were doing when you hit this — so we can resume>
```

Main thread:
1. Saves the current planning state to `docs/implementation/<MXX-FXX>/.plan-in-progress.md`
2. Presents the escalation to the user
3. On user approval, invokes `/feature-discovery` with the reason
4. After SRD is updated, offers to resume planning (`/plan-feature MXX-FXX --resume`) or restart

The state file is a plain markdown scratchpad — restart-safe. Delete when Phase D writes the
final plan.md.

## Rules

- **One feature per invocation.** For a whole module, run per feature or use `/module-planning` (if that skill exists).
- **SRD is the source of truth.** The plan is downstream — it never contradicts SRD, only expands it. If planning reveals a contradiction, use `/feature-discovery` to reconcile.
- **New requirements MUST go through `/feature-discovery`** — no plan-local AC rows that aren't traced back to SRD.
- **Plan file is markdown, git-native.** No hosted app, no MDX, no vendor. Renders fully in GitHub, IDE, and CLI.
- **Plan is disposable after ship.** Per `docs/CLAUDE.md`, `docs/implementation/` artefacts are archived after the PR ships — they document the journey, not the final state.
- **The plan is not the design.** The design is the running TSX. The plan is the prose that scopes the design.

## Cost note

A clean plan session should consume:

- 1 SRD spec read (mandatory)
- Cross-feature reads (only for cited dependencies)
- Zero screenshots
- Zero agent spawns unless `/feature-discovery` is invoked

If `/feature-discovery` fires, add its cost (one skill invocation per new requirement). Bundle multiple new requirements into a single validation batch when possible.

Target total: ~15–25k tokens per feature. Much cheaper than one iteration of `/design-feature` (~40–60k) and saves at least one iteration by resolving screen scope + open questions upfront.
