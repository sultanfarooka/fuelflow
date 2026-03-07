namespace FuelFlow.Application.DTOs.OMCFuelType;

/// <summary>
/// DTO for OMC fuel type in list/get responses.
/// </summary>
public class OMCFuelTypeDto
{
    public Guid Id { get; set; }
    public Guid OMCId { get; set; }
    public required string OMCName { get; set; }
    public required string Name { get; set; }
    public required string Unit { get; set; }
}
