---
name: plan-feature
description: Draft the implementation plan for one SRD feature (MXX-FXX[-RXX]) before design or code. Produces `docs/plans/<MXX>/<MXX-FXX>.md` with the screen inventory, user journeys, backend flow, AC → surface mapping, open questions, test strategy, analytics events, and cross-feature dependencies. Invokes `/feature-discovery` on the fly when the planning discussion surfaces a new requirement that needs to be classified against the SRD. Its output is the canonical input for `/design-feature` (which reads plan.md to scope screen generation) and for `/feature-implementation`. Use whenever the user picks up a feature, before spawning designs or writing code.
---

# /plan-feature — feature implementation plan

Produces a durable planning artefact at `docs/plans/<MXX>/<MXX-FXX>.md` that answers:

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
3. **Check for module plan** — read `docs/plans/<MXX>/module-plan.md` if it exists. This is the AI Workflow synthesis artefact (see [`docs/AI-WORKFLOW.md`](../../../docs/AI-WORKFLOW.md)).
   - **If module-plan.md exists:**
     - Check §8 "Per-feature planning necessity" table for this feature's row.
     - **If §8 says "No" for this feature** → return `SKIP: covered by module plan §8 — proceed directly to /design-feature MXX-FXX`. Print a one-line reason from the §8 "Why" column so the user understands the routing decision. Do NOT write a plan file.
     - **If §8 says "Yes"** → continue, and treat module-plan as authoritative for shared model (§2), shared shells (§3), events (§4), auth (§5), and cross-feature deps (§1). The feature plan inherits these and does NOT re-declare them.
     - **If §8 is silent** on this feature (module plan predates the feature) → warn the user via `AskUserQuestion`: "Module plan doesn't route this feature. Options: (a) Continue with full feature plan, (b) Update module plan §8 first via `/plan-module MXX --refresh`, (c) Cancel."
     - **Staleness check** — compare `plan_last_updated:` in module-plan frontmatter against the SRD spec's `Last updated`. If SRD is newer, warn: "Module plan may be stale — consider `/plan-module MXX --refresh` before continuing."
   - **If module-plan.md is missing:** proceed in relaxed mode (per-feature planning without module synthesis). If the module has ≥3 features that share entities or events, note in the final summary that `/plan-module MXX` would prevent drift.
4. Read in parallel:
   - Spec file (mandatory)
   - `docs/srd/M{XX}-*/README.md` module context (if it exists)
   - `docs/plans/<MXX>/module-plan.md` (already located in step 3, if present)
   - Any linked features cited in the spec's §7 Dependencies / §1 cross-references
   - Existing `docs/plans/<MXX>/<MXX-FXX>.md` — if it already exists, ask before overwriting (offer: refresh, iterate, cancel)
5. State the resolved ID + the SRD path used + module-plan status (used / absent / stale) in one sentence.

### Phase B — Draft the plan structure

Extract the following from the spec — none require the user yet.

**When `module-plan.md` exists**, the plan is thinner: **Data model impact** and **Cross-feature dependencies** are one-liners that reference the module plan rather than re-declaring the shared shape. Any deviation from the module plan (a feature-specific field, a new dep not in the module DAG) escalates via `ESCALATE_TO_SRD:` — the module plan is authoritative and must be updated first via `/plan-module MXX --refresh` or `/feature-discovery`.

- **Screens inventory** — enumerate from §6 Flows / §5 Acceptance Criteria. Row per screen: name, purpose, primary states (default / loading / error / empty / api-4xx variants).
- **User journey** — sketch a state diagram from the flows (`stateDiagram-v2` Mermaid). Include entry points (which feature / route lands here), success outcome (which feature / route to next), and failure outcomes (recovery paths).
- **Backend flow** — enumerate endpoints, HTTP methods, request/response shapes, side effects (SMS, email, audit events per §8, cache invalidation), and preconditions (auth, tenant scope).
- **AC → surface mapping** — table with columns: AC id (R01, R02, …), UI screen(s) it lands on, backend behaviour it requires, "backend-only" flag for the ACs the user can't see. Missing rows are a red flag.
- **Open questions** — read the spec critically. What does it not answer? Common gaps: microcopy tone, error message wording, race conditions, boundary values (min/max/off-by-one), retry semantics, race-condition winner, offline behaviour, RTL edge cases. Prefix each with `OQ-N:` for tracking.
- **Test strategy** — split into E2E (Playwright, mandatory happy path + at least one failure), unit (validators, hooks), and "not designable" (backend-only ACs that ship without visual coverage).
- **Analytics events** — what to instrument. Format: `<domain>.<action>` (e.g. `otp.sent`, `otp.verified`, `otp.expired`, `otp.rate_limited`). Include event properties.
- **Data model impact** — new tables, columns, migrations, indexes, constraints. Check `server/FuelFlow.Infrastructure/Migrations/` for existing schema.
  - **If module-plan.md exists:** write `"Inherits from module-plan §2 shared model. Delta: <none | specific fields this feature adds that aren't yet in §2>"`. Any material delta means the module plan needs updating first — escalate rather than adding to the feature plan.
  - **If module-plan.md is absent:** enumerate here as before. Nothing new = state "No schema changes."
- **Cross-feature dependencies** — read §7 Dependencies. List both `depends on ...` and `is depended on by ...`. If a dependency is `drafting` or missing, flag it.
  - **If module-plan.md exists:** write `"See module-plan §1 interaction diagram. Delta: <none | new dep this feature introduces>"`. New deps that aren't in the module plan escalate.

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
   - Write `docs/plans/<MXX>/<MXX-FXX>.md`
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

- `/design-feature` reads `docs/plans/<MXX>/<MXX-FXX>.md` at Phase A.
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
1. Saves the current planning state to `docs/plans/<MXX>/.<MXX-FXX>-in-progress.md`
2. Presents the escalation to the user
3. On user approval, invokes `/feature-discovery` with the reason
4. After SRD is updated, offers to resume planning (`/plan-feature MXX-FXX --resume`) or restart

The state file is a plain markdown scratchpad — restart-safe. Delete when Phase D writes the
final plan.md.

## Rules

- **One feature per invocation.** For a whole module, run `/plan-module MXX` first — it produces the cross-feature synthesis and its §8 table decides which features still need their own `/plan-feature`.
- **Module plan is authoritative when present.** Feature plan inherits §2 shared model, §3 shared shells, §4 events, §5 auth, and §1 cross-feature deps from module-plan. Deviations escalate — never silently expand.
- **`SKIP: covered by module plan §8` is a valid return.** When the module plan routes this feature to design directly, `/plan-feature` returns SKIP without writing a plan.md. The main thread then proceeds to `/design-feature MXX-FXX`.
- **SRD is the source of truth.** The plan is downstream — it never contradicts SRD, only expands it. If planning reveals a contradiction, use `/feature-discovery` to reconcile.
- **New requirements MUST go through `/feature-discovery`** — no plan-local AC rows that aren't traced back to SRD.
- **Plan file is markdown, git-native.** No hosted app, no MDX, no vendor. Renders fully in GitHub, IDE, and CLI.
- **Plan is disposable after ship.** Per `docs/CLAUDE.md`, `docs/plans/` per-feature artefacts are archived after the PR ships — they document the journey, not the final state. `module-plan.md` and `module-recap.md` stay.
- **The plan is not the design.** The design is the running TSX. The plan is the prose that scopes the design.

## Cost note

A clean plan session should consume:

- 1 SRD spec read (mandatory)
- Cross-feature reads (only for cited dependencies)
- Zero screenshots
- Zero agent spawns unless `/feature-discovery` is invoked

If `/feature-discovery` fires, add its cost (one skill invocation per new requirement). Bundle multiple new requirements into a single validation batch when possible.

Target total: ~15–25k tokens per feature. Much cheaper than one iteration of `/design-feature` (~40–60k) and saves at least one iteration by resolving screen scope + open questions upfront.
