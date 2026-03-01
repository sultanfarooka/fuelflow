namespace FuelFlow.Application.DTOs.Station;

/// <summary>
/// Request to create a new station. Plan: CreateStationRequest — Name required; Address, Phone, LogoUrl optional.
/// </summary>
public class CreateStationRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? Phone { get; set; }
    public string? LogoUrl { get; set; }
}
