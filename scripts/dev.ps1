# Run both React and .NET projects in separate terminals
$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\fuel-flow-web'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\server\FuelFlow.Api'; dotnet run"
