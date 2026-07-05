# GitHub MCP cheat sheet

When the GitHub MCP server is available (tools prefixed `mcp__github__`), prefer it over the `gh` CLI for anything that touches GitHub server state. Use raw `git` for purely local operations.

## Quick lookup

| Operation | Preferred tool |
|---|---|
| Create / read / update / list / merge PRs | `mcp__github__create_pull_request`, `mcp__github__pull_request_read`, `mcp__github__update_pull_request`, `mcp__github__list_pull_requests`, `mcp__github__merge_pull_request` |
| Submit / read PR reviews & inline review comments | `mcp__github__pull_request_review_write`, `mcp__github__add_comment_to_pending_review`, `mcp__github__add_reply_to_pull_request_comment` |
| Create / read / list issues, post issue comments | `mcp__github__issue_write`, `mcp__github__issue_read`, `mcp__github__list_issues`, `mcp__github__add_issue_comment`, `mcp__github__sub_issue_write` |
| List / get branches on GitHub, get commits, list tags / releases | `mcp__github__list_branches`, `mcp__github__create_branch`, `mcp__github__get_commit`, `mcp__github__list_commits`, `mcp__github__list_tags`, `mcp__github__list_releases`, `mcp__github__get_latest_release` |
| Fetch a file from a remote ref without checking it out | `mcp__github__get_file_contents` |
| Search code / issues / PRs / users / repos across GitHub | `mcp__github__search_code`, `mcp__github__search_issues`, `mcp__github__search_pull_requests`, `mcp__github__search_users`, `mcp__github__search_repositories` |
| Local commits, branching, push / pull, working-tree state | raw `git` |
| Actions / workflow runs, anything MCP doesn't cover | `gh` CLI |

## Why

MCP tools return structured data (no `gh ... --json … | jq` plumbing), execute in fewer round-trips than chained shell calls, and avoid bash escaping for multi-line PR bodies / commit messages. Schema errors surface at call time, not at parse time. They also work uniformly across platforms (no PowerShell vs bash quoting differences).

## How to apply

- Before reaching for `gh pr <…>` / `gh issue <…>` / `gh api <…>`, check whether the equivalent `mcp__github__*` tool exists. If yes, prefer it.
- For PR creation: `mcp__github__create_pull_request` is the preferred path; `gh pr create` is the fallback when MCP is unavailable.
- For PR reviews you intend to leave as the author or reviewer, prefer `mcp__github__pull_request_review_write` over `gh pr review` — the structured payload is less error-prone.
- For one-off local tasks (status, log, diff, blame), keep using `git` — MCP isn't a substitute for the local repo.
