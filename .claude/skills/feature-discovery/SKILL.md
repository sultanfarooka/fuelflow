---
name: feature-discovery
description: Intake step for a new module / feature / requirement before /feature-planning. Loads docs/MODULES.md and docs/ProjectOverView.md, takes a one-paragraph idea card from the user, then collaboratively refines it (who asked, measurable outcome, motivation link, subscription tier, domain tags) and decides whether the idea already exists, is cross-cutting tooling (skip the registry), or needs a new row. Picks granularity (R / F / M), detects ripple effects, confirms with the user, then edits docs/MODULES.md and — when warranted — docs/ProjectOverView.md. Invoke with /feature-discovery. Hands back the new ID for /feature-planning to plan against.
disable-model-invocation: true
---

# Feature Discovery — Fuel Flow

The intake skill that runs **before** `/feature-planning`. Use when the
user has an idea that is not yet in `docs/MODULES.md`. Manually
invoked (`/feature-discovery`). Output is one (or two) edits to the
working tree — never code, never a commit, never a PR.

This skill is a **refinement partner**, not a gate. The user shares a
rough idea; Claude helps shape it by surfacing the signals a strong
spec needs (who asked, what outcome, which motivation, which tier,
which domain dimensions) and proposing answers when the user is
unsure. Claude does not block weak ideas — it improves them.

Conventions are referenced from root [`CLAUDE.md`](../../../CLAUDE.md)
Rules 1, 2, 6, 9 and [`docs/MODULES.md`](../../../docs/MODULES.md)
Maintenance Conventions. They are never restated.

## What this skill is, and isn't

- **Is:** intake. Loads context, takes an idea card, refines it,
  classifies it, places it in `MODULES.md` (and, when warranted,
  `ProjectOverView.md`).
- **Isn't:** `feature-planning`. Stops at the registry. User runs
  `/feature-planning <new-id>` next.
- **Isn't:** a PR step. No commits, branches, or `gh`. Per root
  Rules 1 + 2 the registry edits ship in the **same PR** as the
  implementation — so the working-tree edit is the right hand-off.

## Procedure

The skill walks 10 steps. Each step has a clear stop condition. Use
`AskUserQuestion` for any question where the answer is finite
(role / tier / scope / yes-no); use a numbered free-form prompt for
narrative (title, business rule, AC text).

### Step 0 — Load domain context

At the start of every run, read in full:

- `docs/MODULES.md` — the registry. Every existing `MXX-FXX-RXX`,
  every status, every Maintenance Convention.
- `docs/ProjectOverView.md` — narrative source of truth for module
  descriptions, user stories, business model, subscription tiers,
  Pakistan-market context.

These are reread on every invocation so the skill is always aware of
the current state of the registry and the product story.

### Step 1 — Idea card

Ask the user to paste a one-paragraph idea card. Template (give them
this exact prompt):

> Paste a short paragraph covering:
> 1. **Problem** — what's broken or missing today?
> 2. **Who is affected** — Owner / Manager / Nozzleman / Credit
>    customer / Platform admin / other?
> 3. **Expected outcome** — what should be different after this ships?
> 4. **Why now** — what triggered the idea (customer request, sales
>    deal, bug pattern, regulation, your own observation)?
>
> If you can only answer 1 or 2 of these, paste what you have — we'll
> figure out the rest together.

Capture the paragraph verbatim. Do not paraphrase. Then parse it into
structured fields (problem, affected role, outcome, trigger). Note
which fields the paragraph already covered and which are blank.

### Step 2 — Overlap detection

Match the candidate against:

- `docs/MODULES.md` rows — title and requirement text.
- `docs/ProjectOverView.md` passages — narrative descriptions that may
  not yet be in the registry.
- `Out of Scope` items — explicitly rejected earlier work.

Sort the results:

- **Exact match** in `MODULES.md` → return the existing ID and stop
  at step 3 (a).
- **Out of Scope match** → call this out loudly: "this was explicitly
  rejected as `<id>`; do you want to revive it?" If yes, treat as new
  work, but require the user to state what has changed since rejection
  (this becomes part of the Discovery note in step 8).
- **Near match** — similar item. Ask: "is this the same as
  `<existing-id>` or genuinely different?"
- **`ProjectOverView`-only mention** — described in narrative but
  never promoted to `MODULES.md`. Flag it explicitly: "this is in
  `ProjectOverView.md` §X but has no `MXX-FXX-RXX`. Promoting now."

### Step 3 — Classify

Pick one path:

(a) **Already exists** — stop. Tell the user the existing ID, its
status, and to run `/feature-planning <existing-id>`. No edits.

(b) **Cross-cutting tooling / infra / repo-wide config** (per root
Rule 1) — stop. Skip the registry. Tell the user:

> Tooling, not product surface. Branch as
> `feat-tooling-<short-name>` and ship as `feat(tooling): …` (same
> shape as `feat(tooling): graphify` and PR #3). No `MODULES.md`
> edit.

No edits.

(c) **Product surface** — continue to step 4.

### Step 4 — Refine and spec

This is where Claude earns its keep. The goal is a full spec with no
blanks, built collaboratively with the user.

**4a. Refinement probe — fill the value signals.** For each signal
the idea card left blank or vague, ask one focused question. Where
the user is unsure, Claude proposes the most plausible answer based
on the loaded `ProjectOverView.md` motivations and existing
`MODULES.md` patterns, and the user accepts or corrects:

- **Who specifically asked for this?** real customer / sales / support
  ticket pattern / regulatory / "I imagined it from a problem I saw".
- **Measurable outcome.** Minutes saved per shift, mistakes avoided,
  rupees of fraud prevented, churn reduction, % of users affected.
  Numbers are nice; concrete observable changes are required.
- **Maps to which `ProjectOverView.md` motivation?** Multi-station
  management / inventory / udhaar (credit customers) / shift ops /
  reporting / subscription & billing / Pakistan-market context (PKR,
  Urdu, +92 phone, JazzCash/Easypaisa) / platform/devops. If it maps
  to none, say so explicitly — that is information, not a blocker.
- **Cost of not building it.** Station can't operate / data lost /
  billing fails (must build) → nice-to-have (defer-eligible).
- **Could an existing item absorb this?** Second-look at near-matches
  from step 2 before committing to a new row.

Capture answers verbatim. They become the **Discovery note** written
in step 8.

**4b. Choose granularity (R / F / M).** Append-only — never reuse a
retired number, never renumber existing IDs (Maintenance Convention
#6). Read the registry to compute "next free":

- **R (requirement)** — fits inside an existing `MXX-FXX`. Next free
  `RXX` in that feature's requirements table. Intake: rule text,
  one or more `- **ACx** Given… When… Then…` lines.
- **F (feature)** — new feature inside an existing `MXX`. Next free
  `FXX`. Intake: title, 1–2 line description, requirements table
  (≥ 1 `RXX`), acceptance criteria, domain tags (step 4c).
- **M (module)** — brand new module. **Rare** — flag and ask the
  user to confirm. Next free `MXX` (≥ M12 today). Intake: title,
  `**Purpose:**` line, Module Index row, ≥ 1 feature underneath
  with ≥ 1 requirement, domain tags.

**4c. Required domain tags.** Use `AskUserQuestion` with structured
options for each tag. Required for new **F** and **M**; new **R**
inherits its parent feature's tags unless the user overrides:

| Tag | Options | Why it matters |
|---|---|---|
| `tenant-scope` | per-station / per-organization / platform-global | EF global query filter, Owner-bypass behavior |
| `tier` | Starter / Professional / Enterprise / All | M11-F06 gating (`SUB-010`), JSONB feature flags (M11-F01-R04) |
| `capacity-impact` | max_stations / max_users / none | Triggers M11-F06-R02 / R03 review |
| `locale` | PKR-only / Urdu-needed / locale-agnostic | M08-F05 i18n, Pakistan number format (Rs. 1,25,000), `+92` phone, JazzCash/Easypaisa |
| `sensitive-action` | yes / no | If yes, auto-link to M01-F08 audit trail (`AUD-*`) |
| `notification-trigger` | yes / no | If yes, link to M10-F01 event catalog |
| `money-touch` | prices / credit / billing / margins / none | Auto-link to M05 / M06 / M11; multi-tenancy guard; audit |
| `shift-lifecycle-touch` | open / close / mid-shift / none | M04-F03..F05 invariants (one open shift per station, opening meter ≥ last closing, variance threshold) |

Render these as a one-line `**Tags:**` field in the new entry (step
7 shows the exact layout). They are a contract with downstream
skills (`feature-planning`, `feature-implementation`) — the planner
knows what files to scaffold from the tag set alone.

**4d. Domain-routed probe.** Based on the answers in 4c, ask one
domain-specific follow-up:

- `money-touch != none` → "PKR only? Audit-required? Affects credit
  limits or `customer special rates` (M06-F05)?"
- `shift-lifecycle-touch != none` → "Runs during an open shift or
  between shifts? Affects variance calculation (M02-F05-R03)?"
- `sensitive-action = yes` → "Confirm: this needs an `AUD-*` audit
  log entry per M01-F08."
- `notification-trigger = yes` → "Which `M10-F01` event ID, or new
  event?"
- `tier != All` → "Does this need a JSONB feature flag (M11-F01-R04)
  for the gating check?"
- `locale = Urdu-needed` → "Which i18n keys? Confirm M08-F05-R02
  applies."

### Step 5 — Side-effects check

Two passes:

**5a. Anti-pattern detection.** Block or flag:

- Item is currently `Out of Scope` → confirm with user before
  re-adding (already partially covered in step 2 if matched there).
- Violates a stated invariant — e.g. "allow multiple open shifts per
  station" contradicts `M04-F03-R01`. **Block.** Cite the rule, ask
  the user to either reframe or explicitly retire the invariant
  (which is a separate discovery).
- Idea card paragraph is still purely "it would be nice if…" with
  no `who asked` and no `measurable outcome` after step 4a — flag
  this in the Discovery note (do not block; let the user proceed
  with the gap recorded).

**5b. Ripple effects on existing items.** For every `MXX-FXX-RXX`
that may be affected, ask the user — do not auto-decide:

- Does this new item *modify* an existing rule (tighten / supersede)?
- Does it *depend on* an existing item being changed (new field on
  an entity already `Done`)?
- Does it *change a `Done` item's observable behavior*? → regression
  risk; **flag loudly**.
- Should `Current Priorities` change? If yes, propose a slot
  (above/below specific existing priorities) and a one-line reason.
  User accepts or moves it.

List each affected ID with a one-line `<id>: <what changes>` note.
Empty list is fine.

### Step 6 — Decide on `ProjectOverView.md`

Apply this default; let the user override:

- **New module (M-level)** → `ProjectOverView.md` **always** gets a
  matching module section (purpose, primary user roles, user
  stories, feature list).
- **New feature (F-level)** → `ProjectOverView.md` **usually** gets
  a feature paragraph or bullet under the parent module. Skip only
  if the user confirms the feature is purely internal-mechanism.
- **New requirement (R-level)** → `ProjectOverView.md` **rarely**
  changes. Update only if user-visible behavior is introduced or a
  documented business rule changes.
- **Modifications to existing items** (from step 5b) that change
  user-visible behavior → propose the matching
  `ProjectOverView.md` edit alongside the `MODULES.md` change.

If `ProjectOverView.md` has no existing section to host the new
item, place the new section in the order the file already uses
(domain grouping — read the file before placing). Do not guess.

### Step 7 — Present proposed edits

Show, diff-style, every line that will change, grouped by file.

**For `docs/MODULES.md`,** new entries use this exact shape:

```
### MXX-FXX — <title>   [Status: Planned]

> _Discovery (YYYY-MM-DD): <who asked> · <measurable outcome> ·
> maps to ProjectOverView "<motivation>" · cost-of-not-building:
> <one phrase>_

**Tags:** tenant-scope=<…>; tier=<…>; capacity-impact=<…>;
locale=<…>; sensitive-action=<…>; notification-trigger=<…>;
money-touch=<…>; shift-lifecycle-touch=<…>

<1–2 line description>

**Requirements:**

| ID | Requirement | Legacy | Status |
|---|---|---|---|
| MXX-FXX-R01 | … | — | Planned |

**Acceptance Criteria:**
- **AC1** Given … When … Then …
```

New requirement-only entries get the row + any new AC bullets. The
`Discovery` and `Tags` lines are written **only on the parent
feature/module**, not on individual `RXX` rows (R-level inherits
tags by convention).

Also include in the diff:

- Row(s) being modified elsewhere (step 5b ripple effects), with
  old → new values.
- `**Last Updated:** YYYY-MM-DD` bump at the top of `MODULES.md`.
- New entries in `Current Priorities` if step 5b said so.

**For `docs/ProjectOverView.md`** (only when step 6 said yes): the
new section / paragraph / bullet, placed at the right location,
plus any wording changes from step 5b's ripple analysis.

Defaults for new rows:

- Status → `Planned`.
- Legacy → `—` unless the user explicitly maps to a legacy ID.
- Acceptance criteria shape → `- **AC1** Given… When… Then…`.

### Step 8 — Confirm

Get explicit yes/no from the user on the whole proposed diff (both
files, if `ProjectOverView.md` is part of it). If they want changes,
loop back to step 4 / 5 / 6 / 7 as appropriate. **Do not write
until confirmed.**

### Step 9 — Apply and hand back

Edit `docs/MODULES.md`, and `docs/ProjectOverView.md` if step 6 said
yes. No commits, branches, or PRs.

Tell the user:

- The new ID(s).
- What was modified elsewhere (both files, if applicable).
- Next step: `/feature-planning <new-id>` to produce
  `docs/implementation/<new-id>.md`.
- Per root Rules 1 + 2: these doc edits ship in the **same PR** as
  the implementation, not a follow-up.

## Boundaries

- Never opens a PR, never commits, never creates a branch. Edits sit
  in the working tree for the implementation PR to pick up.
- Never adds a row for cross-cutting tooling — ships as
  `feat-tooling-<name>` with no registry edit.
- Never reuses or renumbers a retired ID (Maintenance Convention #6).
- Never flips status of existing items as a side effect — discovery
  is intake, not lifecycle. Status flips happen in
  `feature-implementation` and the shipping PR (root Rule 2).
- Never deletes a row. `Out of Scope` is how items are retired and
  even that is an explicit user action — not a discovery action.
- Never edits scoped `CLAUDE.md` files. `ProjectOverView.md` is the
  only other file this skill may edit, and only when step 6
  warrants it.
- Never edits `docs/implementation/<id>.md`. That belongs to
  `feature-planning`.
- Never edits `docs/CHANGELOG.md`. CHANGELOG entries are added in
  the shipping PR per `docs/CLAUDE.md`, not at discovery.
- Never refuses an idea on the user's behalf. If a value signal is
  missing, the skill helps the user articulate it; if it remains
  missing, the gap is **recorded** in the Discovery note and the
  user proceeds.

## Conventions referenced (not redefined)

- ID format: `MXX-FXX-RXX`, three-tier hierarchical, append-only.
- Status legend: `Planned` / `In Progress` / `Done` / `Out of Scope`.
- Acceptance criteria are the test plan (Maintenance Convention #5),
  shape: `- **AC1** Given… When… Then…`.
- Status flip ships in the same PR as the code (root Rule 2).
- `MODULES.md` edits and the implementation ship in one PR (root
  Rule 1).
- Cross-cutting tooling skips the ID (root Rule 1, second paragraph).
- `ProjectOverView.md` is the source of truth for module
  descriptions, user stories, and feature specs
  (`docs/CLAUDE.md` "What Goes Where").
- Pakistan-market defaults — currency PKR, language English + Urdu,
  phone `+92XXXXXXXXXX`, payment methods include JazzCash and
  Easypaisa — live in M08-F05 and M11-F03 respectively.

## How this slots into the existing pipeline

```
User has a new idea (paragraph)
       │
       ▼
/feature-discovery
       │ (loads MODULES.md + ProjectOverView.md, refines with user)
       │
       ├─ already exists?         → stop, return existing ID
       ├─ cross-cutting tooling?  → stop, "branch as feat-tooling-…"
       └─ new R / F / M           → edits MODULES.md (+ ProjectOverView.md
                                    when warranted), returns new ID
                                    │
                                    ▼
                            /feature-planning <new-id>
                                    │
                                    ▼
                            /feature-implementation
                                    │
                                    ▼
                            /pr-workflow
                                    │
                                    ▼
                            One PR, all doc edits + impl in same diff
```

Each step has its own user-confirmation gate; nothing chains
automatically.
