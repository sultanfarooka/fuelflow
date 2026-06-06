---
name: feature-discovery
description: Intake step for a new module / feature / requirement before /feature-planning, plus a rediscovery mode that re-critiques an already-discovered feature for flow gaps, AC holes, missing tags, and ripple coverage. Loads docs/MODULES.md and docs/ProjectOverView.md, then either (a) takes a one-paragraph idea card and collaboratively refines it (who asked, measurable outcome, motivation link, subscription tier, domain tags) or (b) re-opens a recently discovered feature, walks a lifecycle/AC/tag/dependency critique matrix, and proposes additions. Decides whether to skip the registry (existing item, cross-cutting tooling) or write changes. Picks granularity (R / F / M), detects ripple effects, gauges and assigns the priority tier (P0–P3), implementation order, and dependencies — writing the Appendix C Priority Matrix row and updating the module ranking / Current Priorities when warranted — confirms with the user, then edits docs/MODULES.md and — when warranted — docs/ProjectOverView.md. Invoke with /feature-discovery (new) or /feature-discovery rediscover [id]. Hands back the new or modified ID(s) for /feature-planning.
disable-model-invocation: true
---

# Feature Discovery — Fuel Flow

The intake skill that runs **before** `/feature-planning`. Two modes:

1. **New-idea mode** (default) — use when the user has an idea that
   is not yet in `docs/MODULES.md`.
2. **Rediscovery mode** — use when a feature was already added (often
   recently via this same skill) and the user wants to re-critique
   it: complete-flow gaps, AC holes, missing tags, unstated
   dependencies, ripple effects on `Done` items.

Manually invoked. Output is one (or two) edits to the working tree —
never code, never a commit, never a PR.

This skill is a **refinement partner**, not a gate. The user shares a
rough idea (or an existing ID); Claude helps shape or sharpen it by
surfacing the signals a strong spec needs and proposing answers when
the user is unsure. Claude does not block weak ideas — it improves
them.

Conventions are referenced from root [`CLAUDE.md`](../../../CLAUDE.md)
Rules 1, 2, 6, 9 and [`docs/MODULES.md`](../../../docs/MODULES.md)
Maintenance Conventions. They are never restated.

## What this skill is, and isn't

- **Is:** intake and re-intake. Loads context, takes an idea card
  *or* a target ID, refines/critiques it, classifies it, places or
  amends it in `MODULES.md` (and, when warranted,
  `ProjectOverView.md`).
- **Isn't:** `feature-planning`. Stops at the registry. User runs
  `/feature-planning <id>` next.
- **Isn't:** a PR step. No commits, branches, or `gh`. Per root
  Rules 1 + 2 the registry edits ship in the **same PR** as the
  implementation — so the working-tree edit is the right hand-off.
- **Isn't:** a lifecycle-flip step. Rediscovery never downgrades a
  `Done` item to `Planned` because a gap was found — gaps become
  new `RXX` rows or refinements, not status reversals.

## Mode selection

After Step 0 loads context, decide the mode:

- **Explicit invocation** — if the user invoked
  `/feature-discovery rediscover [id]` (or said
  "rediscover M01-F09", "let's re-examine X", "audit the
  flow of …"), go to **Procedure — rediscovery**.
- **Default** — go to **Procedure — new idea**.
- **Ambiguous** — ask one `AskUserQuestion` with two options:
  "Start a new idea" vs "Rediscover an existing feature".

## Procedure — new idea

The skill walks 10 steps. Each step has a clear stop condition. Use
`AskUserQuestion` for any question where the answer is finite
(role / tier / scope / yes-no); use a numbered free-form prompt for
narrative (title, business rule, AC text).

### Step 0 — Load domain context

At the start of every run, read in full:

- `docs/MODULES.md` — the registry. Every existing `MXX-FXX-RXX`,
  every status, every Maintenance Convention. **Including the ranking
  layer**, which this skill must keep current when it writes:
  - the **"Priority & order"** reading guide (tier P0–P3 criteria +
    the least-dependency ranking rule),
  - the **Module Index** `Order` / `Priority` columns,
  - the **`Priority & Implementation Order`** section (module ranking +
    `Depends on`),
  - **`Appendix C — Priority Matrix`** (every feature's `Order`, tier,
    status, `Depends on`, ★ next-to-pick-up marker),
  - **`Current Priorities`** (the Top-5 modules + ★ next item that
    `/feature-planning` consumes).
- `docs/ProjectOverView.md` — narrative source of truth for module
  descriptions, user stories, business model, subscription tiers,
  Pakistan-market context.

These are reread on every invocation so the skill is always aware of
the current state of the registry, the ranking, and the product story.

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

**5c. Gauge priority, order & dependencies.** Every new entry must land
in the ranking layer, not just the registry. Tier and order are a
**re-rankable ordinal layered on top of the stable IDs** — they never
renumber an `MXX/FXX/RXX` (Maintenance Convention #6). Reuse what you
already collected (step 4a cost-of-not-building, step 4c tags, step 5b
precursors) — do not re-interview.

**Dependencies (`Depends on`).** From the step 5b precursor list, keep
the prerequisites that are **not yet `Done`**. If all prerequisites are
`Done` (or there are none), the item is **independent** → `—`.

**Tier (P0–P3, P0 = highest).** Propose from the signals below, then
confirm with one `AskUserQuestion` (4 options = P0/P1/P2/P3, each
labelled with its `MODULES.md` criterion). Derivation:

- **P0 Critical** — independent **and** in an access / billing /
  platform-foundation domain that blocks revenue or other modules.
- **P1 High** — core operational loop: `shift-lifecycle-touch ≠ none`,
  or `money-touch ∈ {prices, credit, margins}`, or inventory / nozzle /
  pricing / finance surface.
- **P2 Medium** — needs operational data to already exist:
  reporting / analytics, or `notification-trigger = yes`.
- **P3 Low** — gated / optional add-on: `tier ∈ {Professional,
  Enterprise}`, or a staff / lubricants-style standalone module.

Most discoveries are P1–P3; reserve P0 for independent
foundation/revenue/access work.

**Order, by granularity:**

- **R (requirement)** — no new order (Appendix C is per-feature).
  Re-evaluate the **parent feature's** Appendix C row: a new `Planned`
  R rolls the feature header up (so its Appendix C `Status` may move
  `Done`→`In Progress`), and may change its `Depends on` and its ★.
- **F (feature)** — new Appendix C row in the parent module's block.
  `Order = <moduleOrder>.<n>`, inserted by dependency (independent →
  earlier in the block; blocked → later) and **renumber only that
  module's `.n` suffixes**. Module-level `Order`/`Priority` are
  unchanged unless the user says the new feature changes the module's
  standing.
- **M (module)** — gauge the module `Order` by tier + least-dependency
  rule (independent leads its tier; the most-blocked sinks), then
  **re-rank**: insert at that slot and shift every later module's
  `Order` +1 in the **Module Index** and the **`Priority &
  Implementation Order`** table, add a new **Appendix C** block, and
  re-prefix the `Order N.n` of every shifted block. Rare — already
  gated by step 4b's M-level confirm. Stable `MXX` IDs never change.

**★ next-to-pick-up & `Current Priorities`.** Decide whether the new
item becomes its module's ★ (continue-if-`In Progress`, else the
module's highest-priority independent `Planned` item). If the item's
module is in the Top-5 by `Order` and the item becomes that module's ★,
propose the matching `Current Priorities` edit and confirm with the
user — never auto-move (same rule as step 5b).

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

A new **F** also gets its **Appendix C** row in the parent module's
block (tier + order from step 5c):

```
| <moduleOrder>.<n> | MXX-FXX | <title> | <Pn> | Planned | <deps or —> | <★ if module's next> |
```

New requirement-only entries get the row + any new AC bullets, plus the
parent feature's Appendix C row delta (step 5c). The `Discovery` and
`Tags` lines are written **only on the parent feature/module**, not on
individual `RXX` rows (R-level inherits tags — and its parent feature's
tier — by convention).

**Ranking-layer edits (from step 5c)** — always part of the diff:

- **Appendix C — Priority Matrix** row(s):
  - **F** → the new row in the parent module's block:
    `| <moduleOrder>.<n> | MXX-FXX | <title> | <Pn> | Planned | <deps or —> | <★ or blank> |`,
    plus the renumbered `.n` of any rows pushed down in that block.
  - **R** → the parent feature's row delta (`Status` roll-up, `Depends
    on`, ★) — no new row.
  - **M** → the new Appendix C block (header `### Order N — MXX … · Pn`
    + its feature rows) and the re-prefixed `Order N.n` of every shifted
    block.
- **Module Index** `Order` + `Priority` row (new **M** only) and the
  `+1` re-rank of every shifted module row.
- **`Priority & Implementation Order`** row (new **M** only) + the same
  re-rank deltas, with the `Depends on (unmet)` value.
- `**Last Updated:** YYYY-MM-DD` bump at the top of `MODULES.md`.
- **`Current Priorities`** changes if step 5c said the item becomes a
  Top-5 module's ★.

Also include in the diff:

- Row(s) being modified elsewhere (step 5b ripple effects), with
  old → new values.

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
- Next step: `/feature-planning <new-id>` — it cuts the
  `feat-<new-id>-<short>` branch off `main` (carrying these
  working-tree edits along) and writes
  `docs/implementation/<new-id>.md` onto it.
- Per root Rules 1 + 2: these doc edits ship in the **same PR** as
  the implementation, not a follow-up.

## Procedure — rediscovery

Use when the user wants to re-critique an existing feature (often
recently discovered via this same skill). The shape mirrors the
new-idea procedure — Step 0 is shared, then it pivots from *intake*
to *critique*, and rejoins the shared confirm/apply path.

### R-Step 0 — Load domain context

Same as new-idea Step 0. Read `docs/MODULES.md` and
`docs/ProjectOverView.md` in full on every invocation.

### R-Step 1 — Pick the target

Grep `MODULES.md` for the Discovery blockquote pattern
(`> _Discovery (`). List the matches as `MXX-FXX — <title>
(YYYY-MM-DD)` most-recent-first. Present with `AskUserQuestion`
when the count fits (≤ 4); otherwise show the list and ask the
user to name an ID.

If the user supplies an ID that has no Discovery note, accept it
anyway — older items can still be critiqued. If `MODULES.md` has
no Discovery blockquotes yet, prompt directly for an ID.

### R-Step 2 — Reload the target in full

Capture, in working memory:

- The full feature section: description, requirements table, ACs,
  `**Tags:**` line, Discovery blockquote.
- Parent module's `**Purpose:**` line.
- Every other `MXX-FXX-RXX` referenced from the feature (linked
  precursors, refinements, ripple targets).
- Matching `ProjectOverView.md` passages (search by title and key
  terms from the description).

State back to the user: "Rediscovering `<id> — <title>` discovered
`<date>`. Tags: `<tags>`. `<n>` requirements, `<m>` ACs. Linked
to: `<list of linked IDs>`. Ready to walk the critique matrix."

### R-Step 3 — Run the critique matrix (5 dimensions)

For each dimension, list **specific** observed gaps as one-line
candidate findings. Do not propose fixes yet — separation of
diagnosis from prescription keeps the user in control.

**3a. Lifecycle / flow completeness.** Walk the feature's lifecycle
and ask, for each stage, "is there an AC or a requirement?":

- Initiation — who can perform it? (role check explicit?)
- Trigger — time-based / user-action / system-event?
- Input — format / range / uniqueness validation?
- Persistence — atomic / multi-step? rollback path?
- Idempotency — replay-safe? duplicate-submit protection?
- Failure paths — invalid input / permission denied / quota
  exceeded / external dependency down (e.g. SMS provider) /
  partial success?
- Compensating actions — rollback / retry / notify on failure?
- Side effects — audit (M01-F08), notifications (M10-F01),
  billing (M11), shift state (M04), variance (M02-F05)?
- Exit / cleanup — what cancels the flow? what's the timeout?

**3b. AC coverage matrix.** For each requirement row, check whether
ACs cover: happy path / each input-validation failure / permission-
denied per non-authorized role / multi-tenant boundary (Station A
vs B; Owner vs scoped) / race conditions / trial & plan-limit
edges / mobile-PWA / i18n (English + Urdu) and PKR formatting.

**3c. Tag completeness.** Inspect the 8 tags
(`tenant-scope`, `tier`, `capacity-impact`, `locale`,
`sensitive-action`, `notification-trigger`, `money-touch`,
`shift-lifecycle-touch`). Flag missing values; flag values that
look wrong given the feature's behavior (e.g. `sensitive-action=no`
on a feature that obviously touches auth or money).

**3d. Dependencies & ripples.** Identify:

- Precursor IDs the feature depends on but doesn't reference
  (e.g. `M01-F09` depends on `M10-F03`).
- `Done` items the feature modifies — refinement, extension, or
  supersession (see R-Step 6 below for status-suffix classification).
- Downstream features this enables that should now link back.
- **Ranking drift** — does the feature's **Appendix C** row still hold
  after these findings? Check the tier (still matches its P0–P3
  criterion?), the `Depends on` value (a newly-found precursor may make
  a once-independent item blocked, or a now-`Done` precursor may free
  it), the ★ marker, and whether `Current Priorities` should move. Flag
  each as a finding; the fix lands in R-Step 5.

**3e. `ProjectOverView.md` alignment.** Does the narrative still
match the registry after this feature? Are there passages that
describe pre-feature behavior in present tense?

### R-Step 4 — Findings table

Render the gaps as a single table. Empty dimensions are fine.

| # | Dimension | Issue (observed gap) | Proposed action |
|---|---|---|---|
| 1 | Lifecycle | OTP provider outage path unspecified | New R: fallback to email when verified, else max-3 retry with backoff |
| 2 | AC coverage | No AC for max-attempts lockout (R04) | Add AC9: "Given OTP attempts > 3, When user retries, Then 15-min lockout returned" |
| 3 | Dependency | M01-F08 audit not explicitly linked | Add inline `(see M01-F08)` to R09 description |
| 4 | Tags | `notification-trigger=yes` but no `M10-F01` event ID | Add new `M10-F01-RXX` event for "phone-changed" + cross-link |

For each row ask the user one of three answers:

- **Accept** — incorporate into the proposed edit (next step).
- **Defer** — record as a known gap in the Discovery blockquote
  but don't change anything else now.
- **Reject** — won't-fix; do not record.

Use a numbered free-form prompt: "For each row reply with
`<#> accept|defer|reject [optional note]`. Multiple lines OK."

### R-Step 5 — Refine accepted findings

Group accepted findings by the edit they imply:

- **New `RXX` row(s)** — same shape and rules as new-idea
  Step 7. Append-only numbering; pick next free `RXX` in the
  feature's table.
- **New `ACx` bullet(s)** on an existing requirement — append-only;
  next free `ACx` after the last existing one.
- **Inline cross-reference edits** on existing rows — narrowly
  scoped wording add, no behavior change.
- **Tag edits** on the `**Tags:**` line — add missing tags or
  correct a clearly wrong value.
- **Ranking-layer edits** (step 5c logic) — update the feature's
  **Appendix C** row when a finding changes its tier, `Depends on`, or
  ★; a new `Planned` `RXX` rolls the feature header up so its Appendix C
  `Status` may move `Done`→`In Progress`. A new `FXX` from rediscovery
  gets a full new Appendix C row (tier + `<moduleOrder>.<n>` order).
  Propose any `Current Priorities` shift and confirm — never auto-move.

If an accepted finding involves a `Done` item, apply the **Status
rule for Done items** (next section). If it would affect
`ProjectOverView.md`, draft that edit too (new-idea Step 6 logic
applies).

If `Current Priorities` should change (e.g. accepted findings
escalate the work), propose a slot and ask the user to confirm —
do not auto-move.

### R-Step 6 — Status rule for Done items

> **Done means shipped — forever. Suffix it `· refined by [ID]` / `· extended by [ID]` when the new row adds, `· superseded by [ID]` when the new row replaces. `· superseded` rolls up; the rest stay Done.**

When an accepted finding touches a `Done` row, **write the
cross-reference into the Status column as a suffix** — not into the
requirement text. The same schema is canonicalised in
[`docs/MODULES.md`](../../../docs/MODULES.md) Status Legend.

| Case | Status value to write | Header roll-up effect |
|---|---|---|
| Feature header (e.g. `M01-F01`) | — | Rolls up from its row statuses; never edit the header directly. |
| Existing `Done` row that is *refined* (narrowed / clarified by `[RYY]`; original rule still holds) | `Done · refined by [MXX-FXX-RYY](#…)` | Counts as **Done**. Header stays Done. |
| Existing `Done` row that is *extended* (new branches / options added by `[RYY]`; original rule still holds) | `Done · extended by [MXX-FXX-RYY](#…)` | Counts as **Done**. Header stays Done. |
| Existing `Done` row that is *superseded* (original behavior replaced; row is reference-only) | `Done · superseded by [MXX-FXX-RYY](#…)` | Counts as **In Progress**. Header rolls up. |
| New `RYY` row added through rediscovery | Status `Planned` (full new row) | Counts as **Planned**. Header rolls up. |

Whenever a header rolls up (a new `Planned` row under a `Done` feature),
**sync the feature's Appendix C `Status`** to the rolled-up value
(`Done`→`In Progress`) and re-check its ★ — the matrix must agree with
the header.

**The decision test — refine/extended vs superseded.** Ask, for the
finding at hand:

> *Could this missing piece have been written when the original
> feature shipped, with the knowledge available at that time?*

- **No** → genuinely new context introduced by a later feature (a
  new failure mode, a new dependency, a new locale). The original
  was complete-for-its-time. Use **`· refined by`** (narrows /
  clarifies) or **`· extended by`** (adds branches).
- **Yes** → the original was wrong or incomplete by its own
  standards. Use **`· superseded by`** — the row is no longer
  authoritative, and the feature header rolls up.

If unclear, ask the user: "After this new row ships, does the old
rule still hold as written, or is it gone?"

**Worked example.** During M01-F09 rediscovery, finding #17 adds
"platform absorbs signup SMS cost" as a new R-row on M11-F02
(Trial Period, currently `Done`). Apply the test: could M11-F02
have written this when it shipped? No — signup SMS didn't exist
until M01-F09 introduced it. So the new R is `Planned`, the
existing M11-F02 R-rows stay plain `Done`, and the M11-F02 header
rolls up to `In Progress` automatically (because of the new
`Planned` child). No suffix needed on the existing rows.

**Anti-example.** A finding that says "M01-F01 AC1 should return
202 instead of 409 to avoid enumeration" *would* be a supersession
of M01-F01-R01: anti-enumeration was achievable when the feature
shipped (well-known web pattern). Status would become
`Done · superseded by [the new R-row]`, and M01-F01's header rolls
up.

Confirm the classification with the user for every Done-touching
finding before drafting the edit.

### R-Step 7 — Rediscovery log line

Append a one-line rediscovery entry to the feature's Discovery
blockquote so the in-file audit trail survives:

```
> _Discovery (2026-05-19): … original note …_
> _Rediscovered 2026-05-23: added R11–R13 (provider outage,
> SIM-swap audit, recovery channel exhaust); refined R03 with
> AC9; deferred 1 finding (quiet-hours OTP suppression)._
```

One line per rediscovery pass. Today's date from system context.

### R-Step 8 — Present, confirm, apply

Reuse new-idea Steps 7 → 8 → 9 verbatim: render the full diff
(both files when applicable), get explicit yes/no, write the
edits. Hand back the new/modified IDs and remind the user that
these working-tree edits ship in the same PR as the
implementation (root Rules 1 + 2).

If the user runs rediscovery and accepts zero findings, the
correct outcome is **no edits** — tell them the feature looks
sound and exit cleanly.

## Boundaries

- Never opens a PR, never commits, never creates a branch. Edits sit
  in the working tree for the implementation PR to pick up.
- Never adds a row for cross-cutting tooling — ships as
  `feat-tooling-<name>` with no registry edit.
- Never reuses or renumbers a retired ID (Maintenance Convention #6).
  Tier and `Order` are a separate **re-rankable** ordinal layered on
  top of the IDs — re-ranking the `Order` sequence (e.g. when inserting
  a new module) is allowed and expected; renaming an `MXX/FXX/RXX` is
  not.
- Never edits a feature `###` heading. Priority/tier/order live in the
  **Module Index**, the **`Priority & Implementation Order`** section,
  and **`Appendix C`** — never appended to a heading (that would break
  the cross-reference anchors). The skill must keep these ranking tables
  in sync with every row it adds.
- Never flips status of existing items as a side effect of new-idea
  intake — discovery is intake, not lifecycle. The status changes
  this skill is allowed to write are (a) appending a `· refined by`
  / `· extended by` / `· superseded by` suffix on an existing `Done`
  row per rediscovery R-Step 6 and (b) initial `Planned` for brand-
  new rows. All other status flips happen in `feature-implementation`
  and the shipping PR (root Rule 2).
- Never downgrades a `Done` row to plain `In Progress` or `Planned`.
  When a `Done` row needs to surface follow-up work, suffix it
  (`Done · refined/extended/superseded by [ID]`) — never strip the
  `Done`. What shipped, shipped.
- Never edits a feature header's status directly. Headers roll up
  from row statuses per the rule in
  [`docs/MODULES.md`](../../../docs/MODULES.md) Status Legend.
- Never deletes a row. `Out of Scope` is how items are retired.
- Never edits scoped `CLAUDE.md` files. `ProjectOverView.md` is the
  only other file this skill may edit, and only when step 6 (new
  idea) or R-Step 5 (rediscovery) warrants it.
- Never edits `docs/implementation/<id>.md`. That belongs to
  `feature-planning`.
- Never edits `docs/CHANGELOG.md`. CHANGELOG entries are added in
  the shipping PR per `docs/CLAUDE.md`, not at discovery.
- Never refuses an idea (or a rediscovery finding) on the user's
  behalf. If a value signal is missing, the skill helps the user
  articulate it; if it remains missing, the gap is **recorded**
  (in the Discovery note for new ideas; as a `Defer` row in the
  Findings table for rediscovery) and the user proceeds.

## Conventions referenced (not redefined)

- ID format: `MXX-FXX-RXX`, three-tier hierarchical, append-only.
- Status legend: `Planned` / `In Progress` / `Done` / `Done · refined by [ID]` / `Done · extended by [ID]` / `Done · superseded by [ID]` / `Out of Scope` — full schema and roll-up rule in [`docs/MODULES.md`](../../../docs/MODULES.md) Status Legend.
- Priority/order ranking: tiers `P0 Critical` / `P1 High` / `P2 Medium` / `P3 Low` (P0 = highest), the module `Order`, the `<moduleOrder>.<n>` feature order, the `Depends on` independence rule, and the ★ next-to-pick-up marker — all defined in [`docs/MODULES.md`](../../../docs/MODULES.md) "Priority & order" guide, `Priority & Implementation Order`, and `Appendix C — Priority Matrix`. This skill assigns them; it never redefines them here.
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
User has a new idea (paragraph)       User wants to re-critique an existing feature
       │                                          │
       ▼                                          ▼
/feature-discovery                       /feature-discovery rediscover [id]
       │ (loads MODULES.md +                      │ (loads MODULES.md +
       │  ProjectOverView.md,                     │  ProjectOverView.md,
       │  refines with user)                      │  walks 5-dimension critique)
       │                                          │
       ├─ already exists? → stop, return ID       ├─ zero findings? → stop, no edits
       ├─ cross-cutting?  → stop, "feat-tooling-…"├─ findings accepted → edits MODULES.md
       └─ new R / F / M  → edits MODULES.md       │   (+ ProjectOverView.md when warranted)
                          (+ ProjectOverView.md   │   appends Rediscovered log line
                          when warranted),        │   applies Done-row status rule
                          returns new ID          │   returns new/modified IDs
                                    │             │
                                    └─────┬───────┘
                                          ▼
                                  /feature-planning <id>
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
