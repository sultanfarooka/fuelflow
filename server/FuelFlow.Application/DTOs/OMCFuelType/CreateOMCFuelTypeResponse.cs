namespace FuelFlow.Application.DTOs.OMCFuelType;

/// <summary>
/// Response after creating an OMC fuel type.
/// </summary>
public class CreateOMCFuelTypeResponse
{
    public Guid Id { get; set; }
    public Guid OMCId { get; set; }
    public string Name { get; set; } = string.Empty;
}
