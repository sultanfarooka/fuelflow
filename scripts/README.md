# Dev & DB Scripts â€” How and When

Practical guide to the FuelFlow dev-ops scripts. This is the **central index** for
every script that orchestrates the local database and dev servers, whether it
lives in `scripts/` or in `server/`.

> **Keep this current.** Whenever a dev-ops script is created or changed, update
> its **What / When / How** entry here in the same change. This is enforced by the
> `feature-implementation` skill and the `feature-implementer` agent.

> For the *rules and gotchas* behind these scripts (the two-context migration
> model, the psql-transaction trap, the PowerShell-stderr trap, the port SSOT),
> see [`scripts/CLAUDE.md`](CLAUDE.md).

## Prerequisites

- **Docker Desktop** running (the scripts start the `fuelflow-db` Postgres
  container from [`server/docker-compose.yml`](../server/docker-compose.yml)).
- **.NET 10 SDK** + `dotnet-ef` global tool (`dotnet tool install --global dotnet-ef`).
- **Node.js 18+** (for the frontend).
- The dev DB connection is supplied locally â€” either a
  `ConnectionStrings:DefaultConnection` **user-secret** (per the root `CLAUDE.md`
  setup) or a local `server/FuelFlow.Api/appsettings.Development.json` (which is
  **gitignored**, so a fresh clone won't have it). The container publishes host
  port **5432**, so the connection must use `Host=localhost;Port=5432;Database=fuelflow_dev`
  (see [`CLAUDE.md`](CLAUDE.md) â†’ "Connection / port SSOT").

---

## `scripts/dev.ps1`

- **What:** Ensures the Postgres container is up, then launches the frontend
  (Vite, http://localhost:5173) and backend (ASP.NET, http://localhost:5035) in
  two separate terminal windows. With `-ResetAll`, instead wipes and rebuilds all
  databases (dev only) and exits without launching the servers.
- **When:**
  - *Daily development* â€” start both apps.
  - *After pulling schema/migration changes or when the DB is in a bad state* â€”
    run with `-ResetAll` first, then run again normally.
- **How:**
  ```powershell
  ./scripts/dev.ps1            # start frontend + backend (brings DB up first)
  ./scripts/dev.ps1 -ResetAll  # drop control-plane + all tenant_* DBs, rebuild control plane, exit
  ```
- **`-ResetAll` does:** drop every `tenant_*` database and `fuelflow_dev`,
  recreate `fuelflow_dev`, and apply **ControlPlane** migrations
  (`server/db-update.ps1 -Context ControlPlane`). Tenant databases are **not**
  rebuilt here â€” each is created and migrated automatically on the org's first
  onboarding (and re-checked on API boot).

## `scripts/migrate.ps1`

- **What:** Applies pending EF Core migrations to the local DB. Thin wrapper over
  `server/db-update.ps1` (the real implementation), so it correctly handles the
  two-context split.
- **When:** You added/pulled a migration and want to bring your existing
  `fuelflow_dev` up to date **without** wiping data (the non-destructive
  alternative to `dev.ps1 -ResetAll`).
- **How:**
  ```powershell
  ./scripts/migrate.ps1                       # apply both contexts (ControlPlane then Tenant)
  ./scripts/migrate.ps1 -Context ControlPlane # one context (forwarded to db-update.ps1)
  ./scripts/migrate.ps1 -Context Tenant
  ```

## `server/db-update.ps1`

- **What:** The SSOT for applying migrations. Runs `dotnet ef database update` per
  DbContext, ControlPlane first, then Tenant.
- **When:** Same as `migrate.ps1` â€” use whichever you prefer; `migrate.ps1` just
  calls this from the repo root.
- **How (run from `server/`):**
  ```powershell
  ./db-update.ps1                  # both contexts
  ./db-update.ps1 -Context ControlPlane
  ./db-update.ps1 -Context Tenant
  ```

## `server/db-migration-add.ps1`

- **What:** The SSOT for **creating** a new EF Core migration. Emits it into the
  correct per-context folder (`Migrations/ControlPlane` or `Migrations/Tenant`).
  `-Context` is **mandatory** â€” the wrong context corrupts per-context history.
- **When:** You changed an entity / `IEntityTypeConfiguration<T>` and need a
  migration.
- **How (run from `server/`):**
  ```powershell
  ./db-migration-add.ps1 -Name AddTenantStatusIndex -Context ControlPlane
  ./db-migration-add.ps1 -Name AddStationFlag       -Context Tenant
  ```

---

## Common workflows

| Goal | Commands |
|---|---|
| **First-time setup** | Start Docker Desktop â†’ `./scripts/dev.ps1 -ResetAll` â†’ `./scripts/dev.ps1` |
| **Daily dev** | `./scripts/dev.ps1` |
| **Full clean reset** (bad DB state / after big schema changes) | `./scripts/dev.ps1 -ResetAll` then `./scripts/dev.ps1` |
| **Add a migration** | `cd server; ./db-migration-add.ps1 -Name <Name> -Context <ControlPlane\|Tenant>` |
| **Apply migrations (keep data)** | `./scripts/migrate.ps1` |

> Tenant databases (`tenant_<orgId>`) are created and migrated automatically by
> `TenantProvisioningService` at onboarding and re-migrated on API boot by
> `TenantMigrationHostedService` â€” you never create them by hand.

