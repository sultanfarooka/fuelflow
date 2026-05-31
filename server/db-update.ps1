# Apply pending EF Core migrations to the local database (M14-F01: two DbContexts).
#
# Runs in order: ControlPlane first (Identity + reference data tables), then
# Tenant (operational tables that reference ControlPlane rows by Guid).
# Both contexts target the same physical Postgres database in M14-F01;
# M14-F02 introduces per-tenant connection resolution and M14-F03 splits
# the physical databases per Organization.
#
# Usage:
#   .\db-update.ps1                                  # apply both contexts
#   .\db-update.ps1 -Context ControlPlane            # control plane only
#   .\db-update.ps1 -Context Tenant                  # tenant only

param(
    [ValidateSet("Both", "ControlPlane", "Tenant")] [string]$Context = "Both"
)

function Update-Context([string]$contextType) {
    Write-Host "==> Applying migrations for $contextType" -ForegroundColor Cyan
    dotnet ef database update `
        --context $contextType `
        --project FuelFlow.Infrastructure `
        --startup-project FuelFlow.Api @args
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Migration failed for $contextType (exit $LASTEXITCODE)" -ForegroundColor Red
        exit $LASTEXITCODE
    }
}

if ($Context -eq "Both" -or $Context -eq "ControlPlane") {
    Update-Context "ControlPlaneDbContext"
}
if ($Context -eq "Both" -or $Context -eq "Tenant") {
    Update-Context "AppDbContext"
}
