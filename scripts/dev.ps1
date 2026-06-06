# Run both React and .NET projects in separate terminals.
# Use -ResetAll to wipe all databases and rebuild from scratch (dev only).
#
# Both modes first ensure the Postgres container (server/docker-compose.yml) is up
# and accepting connections. See scripts/README.md for how/when to run this, and
# scripts/CLAUDE.md for the psql-transaction and PowerShell-stderr rules behind
# the patterns below.
param(
    [switch]$ResetAll
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$composeFile = Join-Path $root "server\docker-compose.yml"

function Start-Postgres {
    # Bring up the DB container (idempotent) and block until it accepts connections.
    # No 2>&1 on the native calls: in Windows PowerShell, merging a native exe's
    # stderr into the pipeline wraps it as a terminating error under
    # $ErrorActionPreference = "Stop". We branch on $LASTEXITCODE instead.
    Write-Host "==> Ensuring Postgres is up (docker compose up -d)..." -ForegroundColor Cyan
    docker compose -f $composeFile up -d
    if ($LASTEXITCODE -ne 0) {
        Write-Host "docker compose up failed (exit $LASTEXITCODE). Is Docker Desktop running?" -ForegroundColor Red
        exit $LASTEXITCODE
    }
    for ($i = 1; $i -le 30; $i++) {
        $null = docker exec fuelflow-db pg_isready -U fuelflow -d postgres
        if ($LASTEXITCODE -eq 0) {
            Write-Host "    Postgres is ready." -ForegroundColor DarkGray
            return
        }
        Start-Sleep -Seconds 1
    }
    Write-Host "Postgres did not become ready within 30s." -ForegroundColor Red
    exit 1
}

if ($ResetAll) {
    Start-Postgres

    Write-Host "==> Resetting all databases (control plane + all tenant_* DBs)..." -ForegroundColor Yellow

    # Collect tenant DB names before dropping anything.
    # No 2>&1 — only stdout (datnames) belongs in the pipeline; -A strips padding.
    $tenantDbs = docker exec fuelflow-db psql -U fuelflow -d postgres -t -A `
        -c "SELECT datname FROM pg_database WHERE datname LIKE 'tenant_%';" |
        ForEach-Object { $_.Trim() } |
        Where-Object { $_ -ne "" }

    foreach ($db in $tenantDbs) {
        Write-Host "  Dropping tenant DB: $db" -ForegroundColor DarkYellow
        # Separate -c flags: DROP DATABASE cannot run in a transaction block, and a
        # single -c with multiple statements is sent as one implicit transaction.
        docker exec fuelflow-db psql -U fuelflow -d postgres `
            -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$db' AND pid <> pg_backend_pid();" `
            -c "DROP DATABASE IF EXISTS ""$db"";" | Out-Null
    }

    # Drop and recreate control plane DB
    Write-Host "  Dropping control plane DB: fuelflow_dev" -ForegroundColor DarkYellow
    docker exec fuelflow-db psql -U fuelflow -d postgres -c `
        "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'fuelflow_dev' AND pid <> pg_backend_pid();" | Out-Null
    # Separate -c flags: DROP/CREATE DATABASE cannot run in a transaction block, and a
    # single -c with both statements is sent as one implicit transaction (which fails).
    docker exec fuelflow-db psql -U fuelflow -d postgres `
        -c "DROP DATABASE IF EXISTS fuelflow_dev;" `
        -c "CREATE DATABASE fuelflow_dev;" | Out-Null

    # Rebuild control plane schema. db-update.ps1 checks $LASTEXITCODE itself; do NOT
    # pipe dotnet through 2>&1 (its NU1902 stderr warning would abort under Stop).
    Write-Host "==> Rebuilding control plane schema..." -ForegroundColor Cyan
    Push-Location "$root\server"
    .\db-update.ps1 -Context ControlPlane
    $updateExit = $LASTEXITCODE
    Pop-Location
    if ($updateExit -ne 0) {
        Write-Host "Control plane migration failed (exit $updateExit). Reset aborted." -ForegroundColor Red
        exit $updateExit
    }

    Write-Host "==> Reset complete. Tenant DBs will be provisioned fresh on first onboarding." -ForegroundColor Green
    exit 0
}

# Normal start — ensure DB is up, then launch frontend and backend in separate terminals
Start-Postgres
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\fuel-flow-web'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\server\FuelFlow.Api'; dotnet run"
