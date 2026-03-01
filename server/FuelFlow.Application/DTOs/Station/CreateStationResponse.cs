namespace FuelFlow.Application.DTOs.Station;

/// <summary>
/// Response after creating a station (id and name for client).
/// </summary>
public class CreateStationResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
}
