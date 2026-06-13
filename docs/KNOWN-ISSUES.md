# Known issues

> Log bugs, workarounds, and intentional technical debt here.
> Claude reads this before touching affected modules to avoid undoing workarounds.
> Use this file for things that are **knowingly broken or compromised** — not for planned features (those live in [`MODULES.md`](MODULES.md) with status `Planned`).

## Active

| ID | Issue | Affected paths | Workaround | Fix in |
|---|---|---|---|---|
| KI-01 | **Fresh (cookieless) login of an onboarded user returns 500.** `LoginCommandHandler` loads org/stations via the tenant-routed `OrganizationRepository`, whose `TenantDbContextAccessor` resolves the tenant DB only from the JWT `org_id` claim — absent during the pre-auth login request → `InvalidOperationException("GetContextAsync called for a request with no org_id claim")`. Masked in normal use because the browser keeps the `org_id` cookie after the post-onboarding token refresh; a cookie-cleared login exposes it. Surfaced by the M01-F05-R02 E2E. | `server/FuelFlow.Infrastructure/Features/Auth/Commands/LoginCommandHandler.cs` (~L123); `…/Data/TenantDbContextAccessor.cs`; `…/Services/TenantConnectionResolver.cs` | None shipped. Re-login of an onboarded user fails until a new auth cookie with `org_id` is obtained (e.g. via onboarding's token refresh). | Pending M14 fix: resolve the tenant from `user.OrganizationId` during login (explicit org override on the resolver/accessor) instead of the absent JWT claim. |

## Resolved

| ID | Issue | Resolved in |
|---|---|---|
| _none_ | — | — |

---

## How to use this file

**When to add a row to "Active":**
- A bug is found but not fixed this session (capture so the next session doesn't re-discover it)
- An intentional workaround is shipped (e.g., a feature flag because the proper fix is blocked)
- A known performance / accuracy compromise (e.g., "in-memory dedupe scales to ~10k rows; switch to DB-side when N grows")
- A planned feature has a sharp edge that callers must know about (e.g., "M02-F05-R04 variance alert currently delivered async via console log — until M10-F03 lands, Owner sees the alert only by opening the shift detail view")

**When NOT to add a row:**
- The work is planned and tracked in `MODULES.md` — that's not a "known issue", that's a backlog item
- The "issue" is a TODO comment in code. Inline TODOs are fine for tiny gaps; this file is for things that warrant cross-session memory

**ID format:** `KI-01`, `KI-02`, … — append-only, never renumber.

**Move to "Resolved" when:** the fix ships. Don't delete rows — keep the history so future drift investigations can find the link to the original workaround.
