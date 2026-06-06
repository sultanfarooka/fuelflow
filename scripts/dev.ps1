# Run both React and .NET projects in separate terminals.
# Use -ResetAll to wipe all databases and rebuild from scratch (dev only).
param(
    [switch]$ResetAll
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")

if ($ResetAll) {
    Write-Host "==> Resetting all databases (control plane + all tenant_* DBs)..." -ForegroundColor Yellow

    # Collect tenant DB names before dropping anything
    $tenantDbs = docker exec fuelflow-db psql -U fuelflow -d postgres -t -c `
        "SELECT datname FROM pg_database WHERE datname LIKE 'tenant_%'" 2>&1 |
        ForEach-Object { $_.Trim() } |
        Where-Object { $_ -ne "" -and $_ -notmatch "^\s*$" }

    foreach ($db in $tenantDbs) {
        Write-Host "  Dropping tenant DB: $db" -ForegroundColor DarkYellow
        docker exec fuelflow-db psql -U fuelflow -d postgres -c `
            "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$db' AND pid <> pg_backend_pid(); DROP DATABASE IF EXISTS ""$db"";" | Out-Null
    }

    # Drop and recreate control plane DB
    Write-Host "  Dropping control plane DB: fuelflow_dev" -ForegroundColor DarkYellow
    docker exec fuelflow-db psql -U fuelflow -d postgres -c `
        "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'fuelflow_dev' AND pid <> pg_backend_pid();" | Out-Null
    docker exec fuelflow-db psql -U fuelflow -d postgres -c `
        "DROP DATABASE IF EXISTS fuelflow_dev; CREATE DATABASE fuelflow_dev;" | Out-Null

    # Rebuild control plane schema
    Write-Host "==> Rebuilding control plane schema..." -ForegroundColor Cyan
    Push-Location "$root\server"
    .\db-update.ps1 -Context ControlPlane
    Pop-Location

    Write-Host "==> Reset complete. Tenant DBs will be provisioned fresh on first onboarding." -ForegroundColor Green
    exit 0
}

# Normal start — launch frontend and backend in separate terminals
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\fuel-flow-web'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\server\FuelFlow.Api'; dotnet run"
