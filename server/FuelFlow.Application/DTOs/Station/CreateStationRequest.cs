namespace FuelFlow.Application.DTOs.Station;

/// <summary>
/// Request to create a new station. Name and OMCId required; Address, Phone, LogoUrl optional.
/// </summary>
public class CreateStationRequest
{
    public string Name { get; set; } = string.Empty;
    public Guid OMCId { get; set; }
    public string? Address { get; set; }
    public string? Phone { get; set; }
    public string? LogoUrl { get; set; }
}
