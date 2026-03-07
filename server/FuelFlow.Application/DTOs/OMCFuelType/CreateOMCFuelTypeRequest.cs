namespace FuelFlow.Application.DTOs.OMCFuelType;

/// <summary>
/// Request to create a new OMC fuel type.
/// </summary>
public class CreateOMCFuelTypeRequest
{
    public Guid OMCId { get; set; }
    public string Name { get; set; } = string.Empty;
}
