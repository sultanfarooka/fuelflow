namespace FuelFlow.Application.DTOs.FuelTank;

/// <summary>
/// Response after creating a fuel tank.
/// </summary>
public class CreateFuelTankResponse
{
    public Guid Id { get; set; }
    public string? Name { get; set; }
    public decimal CapacityLiters { get; set; }
    public Guid FuelTypeId { get; set; }
    public string? FuelTypeName { get; set; }
}
