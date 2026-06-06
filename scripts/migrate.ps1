# Apply EF Core migrations to the local dev database.
#
# Thin wrapper over the real SSOT: server/db-update.ps1. Since the M14-F01 split
# there are TWO DbContexts (ControlPlane + Tenant); a bare `dotnet ef database
# update` with no --context only touches one of them. This delegates to
# db-update.ps1, which applies both in the correct order (ControlPlane first).
#
# Usage:
#   .\migrate.ps1                       # apply both contexts
#   .\migrate.ps1 -Context ControlPlane # forwarded to db-update.ps1
#   .\migrate.ps1 -Context Tenant
#
# See scripts/README.md for how/when to run; server/db-update.ps1 for the impl.

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")

Push-Location (Join-Path $root "server")
try {
    & .\db-update.ps1 @args
}
finally {
    Pop-Location
}

exit $LASTEXITCODE
