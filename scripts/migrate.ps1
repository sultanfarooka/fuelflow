# Run EF Core migrations from project root
$ErrorActionPreference = "Stop"
Set-Location (Resolve-Path (Join-Path $PSScriptRoot ".."))

dotnet ef database update `
  --project server/FuelFlow.Infrastructure `
  --startup-project server/FuelFlow.Api
