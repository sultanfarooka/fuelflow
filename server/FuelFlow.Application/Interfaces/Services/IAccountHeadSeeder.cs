namespace FuelFlow.Application.Interfaces.Services;

public interface IAccountHeadSeeder
{
    /// <summary>Seeds the 7 default expense heads for a newly created organization. Idempotent.</summary>
    Task SeedDefaultExpenseHeadsAsync(Guid organizationId, CancellationToken ct = default);

    /// <summary>Seeds "Fuel Sales {name} (Cash/Card)" and "Credit Sales {name}" income heads for a fuel type. Idempotent.</summary>
    Task SeedFuelTypeIncomeHeadsAsync(Guid organizationId, string fuelTypeName, CancellationToken ct = default);
}
