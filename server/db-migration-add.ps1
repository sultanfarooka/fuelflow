# Add an EF Core migration for a specific DbContext (M14-F01 split: ControlPlane | Tenant).
#
# Usage:
#   .\db-migration-add.ps1 -Name <MigrationName> -Context <ControlPlane|Tenant>
#
# Examples:
#   .\db-migration-add.ps1 -Name AddTenantStatusIndex -Context ControlPlane
#   .\db-migration-add.ps1 -Name AddStationFlag       -Context Tenant
#
# The -Context choice is intentionally required (no default) — picking the
# wrong context would emit migration files into the wrong folder and corrupt
# the per-context migration history. M14-F01 introduced the split; ControlPlane
# tracks Identity + reference data, Tenant tracks per-tenant operational data.

param(
    [Parameter(Mandatory = $true)] [string]$Name,
    [Parameter(Mandatory = $true)] [ValidateSet("ControlPlane", "Tenant")] [string]$Context
)

$contextType = if ($Context -eq "ControlPlane") { "ControlPlaneDbContext" } else { "AppDbContext" }
$outDir = "Migrations/$Context"

dotnet ef migrations add $Name `
    --context $contextType `
    --project FuelFlow.Infrastructure `
    --startup-project FuelFlow.Api `
    -o $outDir @args
