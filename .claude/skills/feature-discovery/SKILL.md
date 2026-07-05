---
name: feature-discovery
description: Classify a new feature/requirement ask against the Fuel Flow SRD. Determines whether the ask is a duplicate, a new R-row under an existing feature, a change to an existing R-row, a new feature in an existing module, a new module, or a conflict with existing requirements. ALSO detects cascading impacts — other features whose §7 Dependencies, §1 cross-references, §8 Audit emissions, or §9 API surface need updates because of this ask — and bundles all proposed edits into a single approval gate. After approval, applies every edit and updates the feature lifecycle in BOTH the feature file frontmatter AND the docs/SRD.md index row, for every affected feature. Use when the user describes a feature/requirement and asks where it fits, whether it already exists, conflicts with something, or what else needs to change because of it.
---

# /discover-feature — SRD discovery & classification

Locate where a new ask belongs in the SRD before any code is written (CLAUDE.md Rule 1). Verdict-first, **never writes before user approval**. After classifying the primary ask, the skill also identifies **cascading impacts** — other features whose dependencies, cross-references, audit emissions, or API surface need updates — and bundles every proposed edit into a single approval block. When a requirement is added or changed, the feature lifecycle is reassessed and updated in **two places** (feature file frontmatter AND `docs/SRD.md` index column) for **every** affected feature. The module-level lifecycle in `SRD.md` is reassessed too.

## When to invoke

- User types `/discover-feature` (or `/discover`).
- User describes a feature/requirement and asks "where does this belong in SRD?", "does this already exist?", "is this a duplicate?", "does this conflict with anything?".
- You are about to start work on something not yet referenced in `docs/SRD.md` and need to decide whether to add an R-row, modify an R-row, add an F-file, or add a new module.

## Reference docs

- `docs/SRD.md` — module + feature index, **lifecycle column** (one of the two places lifecycle is recorded).
- `docs/srd/README.md` — feature-file template (§§1–11), ID rules, lifecycle table, R-row statuses, "Changing or replacing a feature".
- `docs/MODULES.md` — **read-only** legacy registry for unmigrated modules (M02–M15 except M16). Never add rows here.
- `docs/CLAUDE.md` — transition rules for SRD vs MODULES.md.
- Root `CLAUDE.md` — workflow Rule 1 (locate in SRD before any work).

## Phase 1 — Elicit

If the user's opening description is detailed enough to classify (mentions role + trigger + outcome), skip to Phase 2. Otherwise probe for whichever of these is missing:

- **User role(s)** — Owner, Manager, Cashier, Customer, Platform.
- **Trigger** — what action / screen / event starts the flow.
- **Expected outcome** — what state changes, what the user sees.
- **Data / external systems** — DB entities, SMS, email, OGRA, third-party.
- **New ask vs. change to existing requirement** — the user's belief here drives Phase 4 routing.

Use `AskUserQuestion` only if a clarification truly blocks classification.

## Phase 2 — Index scan (read-only)

Read `docs/SRD.md` and `docs/MODULES.md`. Pick **2–4 candidate modules** by keyword + semantic fit. State each candidate with a one-line "why" before scanning deeper.

## Phase 3 — Deep scan (parallel Explore subagents)

Spawn one `Explore` subagent per shortlisted module **in parallel** (single message, multiple Agent tool calls).

For **migrated** modules (M01, M16, M17 today), brief each subagent to:

1. Read the module `README.md` and every `FXX-*.md` in `docs/srd/<module-dir>/`.
2. For each existing feature, report:
   - **Overlap** — §1 Purpose / §3 Functional Requirement / §5 AC that already covers the ask. Cite `MXX-FXX[-RXX]` + the exact line.
   - **Conflict** — any AC or R-row whose behavior contradicts the ask. Cite `MXX-FXX-RXX` + line.
   - **Close fit** — feature this ask would most naturally extend.
3. Report the feature's **current lifecycle** (frontmatter `Lifecycle:` value) and, if the ask modifies an existing R-row, the **current R-row status**.
4. Best-fit placement: R-row under existing FXX (add or modify), new FXX, or no fit.

For **unmigrated** candidate modules (in `MODULES.md` only), the subagent reads only the module's section in `MODULES.md` and returns the same shape — overlap, conflict, close fit — no per-feature lifecycle exists yet.

Breadth: **medium**. Pass the user's full ask verbatim.

## Phase 3.5 — Cascade scan (impact analysis)

Once the primary target feature is known from Phase 3, run a **second pass** to find every other feature whose spec needs updating because of this ask. Spawn a parallel `Explore` subagent (or one per module if cascade scope is wide) briefed to find:

| Impact category | What to look for | Example edit needed |
|---|---|---|
| **§7 Dependencies — inbound** | Features that list the primary target in their §7 Dependencies table with relation `depends on` / `extends` / `triggers`. | If primary's behavior changes, their dependency rationale may need updating; their lifecycle may revert (see Phase 6.5). |
| **§7 Dependencies — outbound** | Features the primary target depends on. Does the new R-row introduce a new dependency? | Add a row to primary's §7. Add a reciprocal mention to the depended-on feature's §10 Open questions if it owes new behavior. |
| **§1 / §6 cross-references** | Markdown links like `[MXX-FXX]` in §1 Purpose, §6 Design flow, or inline anywhere. | If primary's name or scope changes, referencing features need link/wording updates. |
| **§8 Audit emissions** | New event types added → M17 (Audit & Compliance) catalogues them. | Add an entry under M17-F01 Audit Event Schema, or update M17's emission contract. |
| **§9 API surface** | Endpoint paths that overlap or share contract with other features. | Update API description in primary; warn user if a non-primary feature references the same endpoint. |
| **Module-wide NFRs** | If §4 of primary diverges from the module README's NFRs (rate limits, i18n, perf budgets). | Either bring primary in line or update the module README NFR section. |

Each subagent returns a list of `(target feature, impact category, proposed edit, current lifecycle)` tuples. **No file writes.**

If no cascades exist, state that explicitly in the verdict block ("No cascading impacts detected").

## Phase 4 — Verdict

Synthesize subagent reports into **one** of these verdicts with citations.

| Verdict | Meaning | Scaffold action (Phase 6) |
|---|---|---|
| **Duplicate of `MXX-FXX[-RXX]`** | Existing line already covers the ask. | No file changes. Print decision recap. |
| **Modify existing requirement `MXX-FXX-RXX`** | Ask **changes** an existing R-row's wording / behavior. | Edit R-row in place + §11 entry + **lifecycle/status flip (Phase 6.5)** + `Last updated` + **SRD.md index lifecycle column update**. |
| **New requirement under `MXX-FXX`** | Adds an `R<next>` to an existing feature. | Append R-row to §3 + §11 entry + **lifecycle/status flip (Phase 6.5)** + `Last updated` + **SRD.md index lifecycle column update**. |
| **New feature in `MXX`** (migrated module) | Warrants its own `FXX-<kebab>.md`. | Create new file from template + add row to `SRD.md` module table + add to module `README.md` feature index + reassess module-level lifecycle in `SRD.md`. |
| **New feature in `MXX`** (unmigrated module) | Module needs SRD migration first per `docs/CLAUDE.md`. | Do **not** scaffold. Tell user to migrate `MXX` to SRD first, then re-run. |
| **New module needed** | Rare. Doesn't fit any existing module. | Do **not** scaffold. Recommend the user confirm M-level addition per root `CLAUDE.md` Rule 1. |
| **Conflicts with `MXX-FXX-RXX`** | Behaves contrary to existing locked AC. | Do **not** scaffold. Ask user how to resolve: supersede / re-scope / drop. |

The verdict block **must include the proposed lifecycle/status flip** (computed via Phase 6.5 rules) AND **the full cascade impact list** (from Phase 3.5) so the user sees every change before approving. Example:

> **Verdict: Modify existing requirement M01-F04-R03** — current R03 says "...". New ask requires "...".
> **Current state:** feature lifecycle `design-approved`, R03 status `Planned`.
> **Proposed primary edit:** rewrite R03 in `F04-login.md` §3; add §11 entry; bump `Last updated`.
> **Proposed lifecycle flip:** `F04-login.md` frontmatter `design-approved` → `drafting`; `SRD.md` M01 table row `design-approved` → `drafting`. Design playground may need re-approval — warning.
>
> **Cascading impacts (3):**
> 1. **M01-F07 PIN Quick Login** — §7 Dependencies lists F04 as `depends on`. Wording update needed: "...new behavior...". Lifecycle currently `spec-locked` → revert to `drafting`. Update in `F07-pin-quick-login.md` + `SRD.md` index.
> 2. **M01-F08 Device & Session Management** — §1 cross-references F04 ("after successful login via [F04]..."). Link still valid; text wording may need a tweak. Lifecycle unaffected (already `drafting`).
> 3. **M17-F01 Audit Event Schema** — new audit event `login.<new-mode>` introduced. Add row to M17-F01 §3. M17-F01 currently `_not drafted_` — flip to `drafting`.

## Phase 5 — Approval gate (mandatory)

Approval is **one decision over the entire bundle** — primary edit + every cascade item + every lifecycle flip listed in the verdict block. Use `AskUserQuestion`:

- **Approve full bundle and scaffold** — apply primary edit + all cascade edits + all lifecycle flips in one pass.
- **Approve verdict only (no file changes)** — print the recap, stop.
- **Approve partial bundle** — user names which cascade items to skip; the rest proceed. Use a follow-up `AskUserQuestion` (multi-select) listing each cascade item.
- **Revise verdict — feedback follows** — return to Phase 4 after user input.

**No file writes until an "Approve … and scaffold" option is chosen.**

If the bundle includes a terminal lifecycle flip (`shipped` / `superseded` / `removed` on any affected feature), surface that as a separate confirmation **inside the same approval block** — never auto-flip terminals.

## Phase 6 — Scaffold (only after approval)

### Case A — Modify existing requirement `MXX-FXX-RXX`

1. Edit the R-row text in §3 of the feature file. **Never renumber. Never reuse a deleted ID.**
2. Append a §11 Change history entry: `- **<today YYYY-MM-DD>** — <one-line why>.`
3. Bump `Last updated` in the frontmatter to today.
4. **Apply Phase 6.5 lifecycle/status flip rules.** This updates the feature file frontmatter `Lifecycle:` AND the lifecycle column in `docs/SRD.md` AND, if necessary, the module-level lifecycle in `SRD.md`.

### Case B — New requirement under `MXX-FXX`

1. Append `R<next>` to §3 (next free slot — append-only). Status `Drafting` by default; Phase 6.5 may override.
2. Append §11 entry with today's date and why.
3. Bump `Last updated`.
4. **Apply Phase 6.5 lifecycle/status flip rules** — same dual update (feature file + `SRD.md` index).

### Case C — New feature in migrated module `MXX`

1. Create `docs/srd/<module-dir>/F<next>-<kebab>.md` using the template at `docs/srd/README.md` §"Feature file template" — all 11 sections in order, empty ones get `_None._`. Frontmatter: `Lifecycle: drafting`, `Last updated: <today>`, `Design: _Design pending — see §10._`.
2. Edit `docs/SRD.md`: add the new feature row to the module's table with `Lifecycle: drafting`.
3. Edit `docs/srd/<module-dir>/README.md`: add the feature to the module's feature index.
4. **Reassess module-level lifecycle.** Per `docs/srd/README.md`: "At the module level the same vocabulary summarises every feature inside — `drafting` if ≥ 1 feature is still drafting, `shipped` when all are." Adding a `drafting` feature means a `shipped` module reverts to `drafting` in `SRD.md`. Update if needed.

### Case D — Duplicate / Conflict / Unmigrated-module / New-module

No file writes on the primary. Cascade items (if any) are still considered — for example, a "Duplicate" verdict might still surface that an existing cross-reference is stale. Apply approved cascade edits only; print a 3–5 line recap for the primary.

### Case E — Cascade edits (applies after Cases A/B/C, in the same pass)

For every cascade item in the approved bundle, apply the proposed edit. Common shapes:

- **§7 Dependencies edit** — `Edit` the dependent feature's §7 table row (or add a new one). Append §11 entry. Bump `Last updated`. Apply Phase 6.5 lifecycle rules if the change is substantive.
- **§1 / §6 cross-reference text** — `Edit` the wording / link in place. §11 entry only if the change alters intent; pure link rename is a trivial edit (no §11 per `docs/srd/README.md` "Changing or replacing a feature" rules).
- **§8 Audit emissions** — add a row to the target feature's §8 table. If a new event type is introduced, also `Edit` `docs/srd/M17-audit-and-compliance/F01-audit-event-schema-and-emission-contract.md` to register it. Each touched feature gets a §11 entry + `Last updated` bump.
- **§9 API surface** — add/edit the row in the §9 table of the owning feature. §11 entry. Bump `Last updated`.
- **Module-wide NFR change** — `Edit` the module's `README.md` NFR section. Bump module-level `Last updated`. Reassess module lifecycle in `SRD.md`.

For **every cascade-affected feature**, after editing, reapply Phase 6.5: update `Lifecycle:` in both the feature file frontmatter AND its row in `docs/SRD.md`. Reassess module-level lifecycle in `SRD.md` if any feature's lifecycle reverted.

Cascade lifecycle reversion follows the same severity rules as the primary — wording-only edits to a cross-reference don't revert lifecycle; substantive §7/§8/§9 changes do.

## Phase 6.5 — Lifecycle / Status flip rules (Cases A & B only)

A requirement change or addition reopens the spec to some degree. Apply these rules, **and always update lifecycle in two places** — the feature file frontmatter AND the lifecycle column for that feature's row in `docs/SRD.md`. If the module-level lifecycle in `SRD.md` is also affected (e.g. module was `shipped`, now has a `drafting` feature again), update that too.

### Feature lifecycle reversion

| Current `Lifecycle:` | On **R-row added** | On **R-row changed** | Side effect to flag |
|---|---|---|---|
| `drafting` | stay `drafting` | stay `drafting` | none |
| `spec-locked` | → `drafting` (spec no longer frozen) | → `drafting` | none |
| `design-approved` | → `drafting` | → `drafting` | Design playground file (`Design:` link in frontmatter) may need re-approval — warn user. |
| `in-implementation` | stay `in-implementation` | stay `in-implementation` (impl continues; flip the R-row status — see below) | If the change invalidates merged code, recommend a follow-up PR. |
| `shipped` | **Confirm with user.** Default: open a new feature (Case C) instead — `shipped` is terminal. Alternative: revert to `in-implementation` if user explicitly wants scope creep. | **Confirm with user.** Default recommendation: new feature with `supersedes:` linkage to this one, per `docs/srd/README.md` "Changing or replacing a feature" → "Wholesale replace". | Same. |
| `superseded` / `removed` | **Do not edit.** Recommend a new feature in the same module. | Same. | Same. |

### R-row status flip

| Feature lifecycle (current) | New R-row status | Changed R-row status flip |
|---|---|---|
| `drafting` (or just reverted to it) | `Drafting` | `Drafting` |
| `in-implementation` | `Planned` | Was `Done` → flip to `Planned` (impl invalidated). Was `In Progress` → stay `In Progress` + warn user impl needs review. Was `Planned` → stay `Planned`. Was `Removed` → don't touch removed rows. |
| `shipped` | per user confirmation in lifecycle table above | per user confirmation |

### Two-place lifecycle update (ALWAYS do both)

When the feature lifecycle changes:

1. **Feature file** — edit the `Lifecycle:` row in the frontmatter table at the top of `docs/srd/<module-dir>/FXX-*.md`.
2. **SRD index** — edit the lifecycle column in the feature's row in `docs/SRD.md` under the module's table.

If the module-level lifecycle in `SRD.md` is now stale (e.g. all features were `shipped` but one just reverted to `drafting`), update the **`Lifecycle:`** value on the module's heading line in `SRD.md` too. Apply the same rule symbolically: module lifecycle = the "earliest" lifecycle present across its features (`drafting` < `spec-locked` < `design-approved` < `in-implementation` < `shipped`).

**Terminal flips (`shipped` → anything, `superseded` / `removed` → anything) ALWAYS require explicit user confirmation via `AskUserQuestion`** — never auto-flip.

## Phase 7 — Handoff

After writing, print:

1. **Files-changed table** — every file touched (primary + cascade), with a one-line summary per file (what changed, lifecycle before → after).
2. **Suggested branch name** per root `CLAUDE.md` Rule 4: `feat-<id-lowercase-kebab>-<short-name>` (e.g. `feat-m01-f04-r12-rate-limit-per-ip`).
3. **Reminder:** flip lifecycle to `in-implementation` in the PR that starts the implementation (same PR — never a follow-up). The cascaded features ride along in the same PR — never split them off.

Stop. The skill does not create branches, run `git`, or open PRs.

## Guard-rails (non-negotiable)

- **Read-only until approval.** No Edit / Write before Phase 5 returns "Approve and scaffold".
- **Never modify `MODULES.md`.** It's frozen — migrate the module to SRD first per `docs/CLAUDE.md`.
- **Never reuse a deleted `RXX` or `FXX` slot.** Removed rows keep their slot forever with status `Removed`.
- **Cross-feature references use full relative paths**, e.g. `[M01-F04](../M01-identity-and-authentication/F04-login.md)`.
- **Lifecycle updates always happen in two places** — feature file frontmatter AND `SRD.md` index. Plus the module-level lifecycle in `SRD.md` when needed. **Apply to every cascade-affected feature**, not just the primary.
- **Cascade analysis is mandatory** — never skip Phase 3.5. If no cascades exist, say so explicitly in the verdict.
- **All cascade edits land in the same PR** as the primary edit — never as follow-ups.
- **Terminal lifecycle flips (`shipped` / `superseded` / `removed`) require explicit user confirmation** — for primary AND cascade items.
- **No `git` operations.**
