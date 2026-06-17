---
name: feature-planning
description: Plan a feature or requirement before implementation. Reads docs/MODULES.md, lets the user pick a MXX-FXX[-RXX] item, runs a requirements interview, cuts the feature branch off main per root CLAUDE.md Rules 3 + 4, and writes a phase-based implementation document onto that branch. Invoke with /feature-planning, or use when the user wants to start, plan, or scope new work.
disable-model-invocation: true
---

# Feature Planning — Fuel Flow

Runs the planning stage before any code is written. Manually invoked
(`/feature-planning`). Output is a reviewed planning document on a freshly
cut feature branch — never code, never a commit.

This skill assumes the Fuel Flow repo conventions in the root `CLAUDE.md`
(Rules 1–10) and the `MXX-FXX-RXX` registry in `docs/MODULES.md`.

## Procedure

### 1. Load MODULES.md and present what can be started

Read `docs/MODULES.md`. The user either names an item (e.g. "plan M04-F03")
or asks what to work on. If they ask:

- Show the **Current Priorities** section — the **Top 5 modules** in priority/
  implementation order (from the `Priority & Implementation Order` section), each
  with its **single next actionable `MXX-FXX[-RXX]` item** (the ★ row for that
  module in `Appendix C — Priority Matrix`). Present these five first — that is
  the intended order.
- If the user wants something outside the Top 5, fall back to the full ranked
  backlog in `Priority & Implementation Order` (modules in `Order` sequence) and,
  within a chosen module, its `Planned` / `In Progress` features from
  `Appendix C` — skip `Done` and `Out of Scope`.

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

### 3. Create the feature branch

Per root `CLAUDE.md` Rule 3 ("Always branch off `main` for new work") and
Rule 4 ("Branch naming convention: `feat-<feature-id-from-modules-file>-<adequate-name>`"),
the branch is cut now so the implementation document, any earlier
working-tree edits from `/feature-discovery`, and the eventual code all
live on the same branch from the start. This is what root Rule 1 requires
("MODULES.md edit and the planning artefact must be in the **same PR** as
the implementation — never a follow-up").

**Sequence (stop on any error — never auto-resolve):**

1. Inspect HEAD.
   - If HEAD is already the target `feat-<id>-<short>` for the chosen ID,
     log "branch already exists, continuing on it" and skip to step 5.
   - If HEAD is any non-`main` branch other than the target, **stop** and
     ask the user to commit/stash and switch back to `main`, or confirm
     the current branch is the intended target.
   - If HEAD is `main`, continue.
2. `git fetch origin main` — purely informational; reveals if local `main`
   is behind.
3. `git checkout main && git pull --ff-only origin main`. If `--ff-only`
   fails (local `main` has diverged), **stop** and tell the user. Any
   uncommitted edits in the working tree (typically the registry edits
   from `/feature-discovery`) are carried across by `git checkout` and the
   subsequent `git checkout -b` — that is the desired behavior.
4. **Auto-derive the short-name silently** from the MODULES.md feature
   title:
   - Lowercase, ASCII-only.
   - Hyphens for spaces.
   - Drop punctuation (`'`, `&`, `(...)`, em-dashes, etc.).
   - Cap at 6 words.
   - Example: `M01-F09 — Phone-First Authentication` →
     `phone-first-authentication`. Branch becomes
     `feat-m01-f09-phone-first-authentication`.
   - R-level items include the `rXX`:
     `feat-m01-f09-r03-<short>`.
5. Create or check out the branch:
   - If the branch does **not** exist locally or remotely:
     `git checkout -b <branch>`.
   - If the branch exists locally already (idempotent re-run):
     `git checkout <branch>`.
   - If the branch exists on `origin` but not locally:
     `git fetch origin && git checkout -b <branch> origin/<branch>`.
6. State the branch name to the user before proceeding.

The MODULES.md `In Progress` flip does **not** happen here. Per Rule 2 it
rides in the first work commit, which is made by `/feature-implementation`.
This skill never commits.

### 4. Write the implementation document

Create `docs/implementation/<id>.md` (e.g. `docs/implementation/M04-F03.md`)
from `references/implementation-template.md`. The file is written onto the
branch created in Step 3 — confirm HEAD is on that branch before writing.
Fill every section from `MODULES.md` plus the interview. Phases are vertical
slices ordered so each builds on the last — for a typical backend feature
that is Domain → config + migration → Application (command/query +
validator) → Infrastructure handler → Api controller → frontend. Do not
invent requirements; genuinely undecided points go under "Open questions".

Do NOT restate convention detail (EF config order, controller pattern, CQRS
naming). Those live in the scoped `CLAUDE.md` files and load automatically when
the implementer works in that folder. The plan references them, it does not
copy them.

### 5. Hand back for review

Give the user:

- The branch name created in Step 3 (and confirmation that any
  pre-existing working-tree edits from `/feature-discovery` are now on
  that branch alongside the new implementation doc).
- The implementation document path and a short phase summary.
- Next step: run `/feature-implementation <id>` — it verifies the branch,
  flips the MODULES.md row to `In Progress` in the first work commit, and
  drives the phased build.

Remind them: review and edit the doc before implementation starts. Per
Rule 1, the `MODULES.md` edit, this planning artefact, and the
implementation all ship in the **same PR** — not as follow-ups. Do not
write code from this skill.

## Notes

- Plan one `MXX-FXX[-RXX]` item per run; one document per item; one branch
  per item.
- If the item spans several requirements, plan at the lowest shared ancestor
  (e.g. `M04-F03` covering `R01` and `R02`) — matches Rule 1.
- This skill never commits, never pushes, never opens PRs. It cuts the
  branch and writes the doc; everything else is the implementer's job.
