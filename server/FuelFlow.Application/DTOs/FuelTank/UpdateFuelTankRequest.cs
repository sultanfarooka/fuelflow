namespace FuelFlow.Application.DTOs.FuelTank;

public class UpdateFuelTankRequest
{
    public string? Name { get; set; }
    public decimal CapacityLiters { get; set; }
    public Guid FuelTypeId { get; set; }
}
