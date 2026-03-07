namespace FuelFlow.Application.DTOs.FuelTank;

/// <summary>
/// Request to create a fuel tank at a station. Capacity and FuelType required; Name optional.
/// </summary>
public class CreateFuelTankRequest
{
    public string? Name { get; set; }
    public decimal CapacityLiters { get; set; }
    public Guid FuelTypeId { get; set; }
}
