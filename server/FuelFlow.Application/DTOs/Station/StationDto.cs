namespace FuelFlow.Application.DTOs.Station;

/// <summary>
/// DTO for station in list responses (GET stations by organization).
/// </summary>
public class StationDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? Phone { get; set; }
    public string? LogoUrl { get; set; }
    public bool IsActive { get; set; }
    public Guid OMCId { get; set; }
    public bool IsSetupComplete { get; set; }
    public List<string> AcceptedPaymentMethods { get; set; } = new();
}
