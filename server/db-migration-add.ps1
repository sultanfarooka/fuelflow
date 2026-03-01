# Add EF migration from server directory (no project flags needed)
# Usage: .\db-migration-add.ps1 <MigrationName>
param([Parameter(Mandatory = $true)] [string]$Name)
dotnet ef migrations add $Name --project FuelFlow.Infrastructure --startup-project FuelFlow.Api @args
