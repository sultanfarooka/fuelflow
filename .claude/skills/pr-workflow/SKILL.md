---
name: pr-workflow
description: Push a completed feature branch and open one pull request against main using gh. Invoke with /pr-workflow, or it is called by feature-implementation when an item is done. Encodes the Fuel Flow branch, commit, and PR conventions from root CLAUDE.md Rules 3-8.
disable-model-invocation: true
---

# PR Workflow — Fuel Flow

Pushes a completed branch and opens one PR against `main`. Encodes root
`CLAUDE.md` Rules 3–8. Manually invoked or called by `feature-implementation`.
Claude does not open PRs on its own initiative.

GitHub is reached via the `gh` CLI (per the repo's stated convention) or the
GitHub MCP server if that is what the user has configured — use whichever the
user has set up.

## Scope

One PR per `MXX-FXX[-RXX]` item. Never per task or per phase. If uncommitted
work spans more than one item, stop and ask which item this PR is for.

## Procedure

### 1. Confirm the item is complete

The implementation document at `docs/implementation/<id>.md` must have every
phase task checked, or the user must explicitly say to proceed. Verify the diff
includes the `MODULES.md` status flip to `Done` (and any new rows) — per
Rule 2 this is part of the same PR, not a follow-up. If missing, stop and say
so.

### 2. Pre-push checks (Rule 8)

- Backend: `dotnet format` produces no diff.
- Frontend: ESLint + Prettier pass.

Do not push until both are clean.

### 3. Branch and commits

The branch should already follow Rule 4: `feat-<id>-<short-name>` (or `fix-`,
`docs-`). Commits inside it follow Rule 7 — conventional commits scoped by ID,
e.g. `feat(m04-f03): implement open-shift endpoint`, and test names reference
the ID (`M04_F03_R01_OnlyOneOpenShiftPerStation`). Do not include unrelated
changes.

### 4. Push and open the PR (Rule 5)

```
git push -u origin <branch>
gh pr create --base main --title "<title>" --body "<body>"
```

- **Title** references the ID: `M04-F03-R01: enforce one-open-shift-per-station`.
- **Body** uses the exact template from root `CLAUDE.md` Rule 6:

```markdown
## Summary
- Implements **MXX-FXX[-RXX]**: <one-line description>
- Key implementation points:
  - <bullet 1: what changed at a high level>
  - <bullet 2: notable design choice / trade-off>
  - <bullet 3: any data model / migration / breaking impact>

## MODULES.md Status Update
- [ ] Flipped `MXX-FXX[-RXX]` to `Done` in `docs/MODULES.md`
- [ ] Added any new feature(s)/requirement(s) discovered during this work
- [ ] Updated `Last Updated` date in `docs/MODULES.md` header

## Test Plan
- [ ] <how to verify the golden path>
- [ ] <edge case(s) covered>

🤖 Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

Fill the `MODULES.md` and Test Plan checkboxes to reflect what is actually
true in the diff — derive the Test Plan from the item's acceptance criteria.

### 5. Report back

Give the user the PR URL. State plainly: the PR is open against `main`,
`MODULES.md` is updated in the same diff, and it awaits their review and merge.
Do NOT merge.

## Rules

- Base branch is always `main`.
- Never merge, never force-push `main`, never auto-resolve conflicts on `main`.
  If the branch is behind, say so and let the user decide.
- One `MXX-FXX[-RXX]` item per PR.
