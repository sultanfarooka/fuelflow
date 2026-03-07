namespace FuelFlow.Application.DTOs.FuelType;

/// <summary>
/// Response after creating a custom fuel type. Id can be used as FuelTypeId for tanks and fuel prices.
/// </summary>
public class CreateFuelTypeResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Unit { get; set; } = "L";
    public bool IsCustom { get; set; } = false;
    public Guid? OMCId { get; set; } = null;
}