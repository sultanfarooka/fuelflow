namespace FuelFlow.Application.DTOs.Onboarding;

/// <summary>
/// Request for onboarding: create organization and first station. Same shape as org name + station fields.
/// </summary>
public class OnboardingRequest
{
    public string OrganizationName { get; set; } = string.Empty;
    public string StationName { get; set; } = string.Empty;
    public Guid OMCId { get; set; }
    public string? Address { get; set; }
    public string? Phone { get; set; }
    public string? LogoUrl { get; set; }
}
