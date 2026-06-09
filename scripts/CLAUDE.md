# scripts — Dev & DB Orchestration

PowerShell scripts that are the **single source of truth** for spinning up the
local dev stack and managing migrations. For *how and when* to run each script,
see [`scripts/README.md`](README.md) — this file is the *rules and gotchas* an
agent must honour when **authoring or modifying** these scripts.

## Script map (SSOTs)

| Script | Role |
|---|---|
| `scripts/dev.ps1` | Ensure Postgres up → launch frontend + backend; `-ResetAll` wipes+rebuilds DBs (dev only) |
| `scripts/migrate.ps1` | Root-level wrapper → delegates to `server/db-update.ps1` |
| `server/db-update.ps1` | **Apply** migrations, per context (ControlPlane first, then Tenant) |
| `server/db-migration-add.ps1` | **Create** a migration into the correct per-context folder (`-Context` mandatory) |

Reference examples to follow when writing new scripts: `server/db-update.ps1`,
`server/db-migration-add.ps1` (both are context-aware and check `$LASTEXITCODE`).

## Rules

### Two-context migration model (M14-F01)
There are two DbContexts: **ControlPlane** (`ControlPlaneDbContext` — Identity,
Tenants, subscriptions, reference data) and **Tenant** (`AppDbContext` —
per-tenant operational tables). Migrations live in `Migrations/ControlPlane` and
`Migrations/Tenant` with separate history tables. Always pass
`-Context ControlPlane|Tenant`; a bare `dotnet ef … database update` /
`migrations add` targets only the alphabetically-first context and silently does
the wrong thing. `-ResetAll` rebuilds **only** the control plane —
`fuelflow_dev`; tenant DBs (`tenant_<orgId>`) are created + migrated by
`TenantProvisioningService` at onboarding and re-migrated on API boot by
`TenantMigrationHostedService`.

### Connection / port SSOT
Canonical dev host port is **5432**. The **committed** port SSOT is
`server/docker-compose.yml` (`5432:5432`) plus `appsettings.Development.json`
and the documented dev connection format in root `CLAUDE.md` and `docs/ENV-MAP.md`.
The connection string itself is supplied **locally** — either a
`ConnectionStrings:DefaultConnection` user-secret (the path the setup docs use) or
a `server/FuelFlow.Api/appsettings.Development.json` (which is **gitignored**, so a
fresh clone won't have it). Whichever you use, it MUST use port **5432**.
User-secrets override appsettings; if both are set, keep them consistent.

### psql: DROP/CREATE DATABASE can't run in a transaction
`psql -c "stmt1; stmt2;"` sends a multi-statement string as **one implicit
transaction**, and `DROP DATABASE` / `CREATE DATABASE` (and other
non-transactional DDL) fail inside a transaction block. **Never** put multiple
statements — especially database-level DDL — in a single `-c`. Use **repeated
`-c` flags**; each runs as its own transaction:
```powershell
docker exec fuelflow-db psql -U fuelflow -d postgres `
    -c "DROP DATABASE IF EXISTS fuelflow_dev;" `
    -c "CREATE DATABASE fuelflow_dev;"
```

### PowerShell + native exes: don't merge stderr under `Stop`
These scripts set `$ErrorActionPreference = "Stop"`. In Windows PowerShell,
piping a native exe's stderr into the pipeline (`2>&1`) wraps each line as a
terminating `NativeCommandError` — so e.g. `dotnet`'s benign `NU1902` warning
aborts the script even on exit code 0. **Do not `2>&1`** `dotnet` / `psql` /
`docker`. Branch on **`$LASTEXITCODE`** for real failures (as `db-update.ps1`
does). When you only want stdout, omit the redirect and let stderr fall through
to the console.

### Destructive ops are dev-only and explicit
`-ResetAll` drops every `tenant_*` DB and the control plane. Guard such
operations behind an explicit switch, log what is being dropped, and keep them
idempotent. Fail loudly (`exit $LASTEXITCODE`) — never swallow a failed reset.

### Keep `scripts/README.md` current
Any time you create or modify a dev-ops script (`scripts/*.ps1`, `server/*.ps1`),
update that script's **What / When / How** entry in
[`scripts/README.md`](README.md) in the **same change**. This mirrors the rule in
the `feature-implementation` skill and the `feature-implementer` agent.
