namespace FuelFlow.Application.DTOs.FuelType;

/// <summary>
/// Request to create a custom fuel type for a station. Station is determined by the URL (stationId).
/// Name required; Unit optional (default L).
/// </summary>
public class CreateFuelTypeRequest
{
    public string Name { get; set; } = string.Empty;
    public string Unit { get; set; } = "L";
    public bool IsCustom { get; set; } = false;
    public Guid? OmcId { get; set; } = null;
}