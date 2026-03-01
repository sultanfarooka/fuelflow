# Update database from server directory (no project flags needed)
dotnet ef database update --project FuelFlow.Infrastructure --startup-project FuelFlow.Api @args
