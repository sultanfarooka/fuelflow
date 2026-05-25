using System.Text.Json.Serialization;

namespace FuelFlow.Application.DTOs.Auth;

/// <summary>
/// Returned by auth handlers (login, refresh, get-current-user).
/// Tokens are internal only — set in HTTP-only cookies by the controller, never serialized to JSON.
/// API responses expose only ExpiresIn, User, Subscription.
/// </summary>
public class AuthResponse
{
    /// access token is internal only and should not be serialized to JSON
    [JsonIgnore]
    public string AccessToken { get; set; } = string.Empty;

    /// refresh token is internal only and should not be serialized to JSON
    [JsonIgnore]
    public string RefreshToken { get; set; } = string.Empty;


    public int ExpiresIn { get; set; }

    /// user info
    public UserInfo User { get; set; } = null!;
    public OrganizationInfo? Organization { get; set; } = null!;
    public SubscriptionInfo? Subscription { get; set; } = null!;
    public List<StationInfo>? Stations { get; set; } = null!;


}




/// <summary>
/// Basic user info included in the auth response.
/// Only the fields the frontend needs — not the full entity.
/// <see cref="Email"/> is nullable per [M01-F09-R01] (phone-first auth allows email-less accounts).
/// <see cref="Phone"/> mirrors that — exposes the primary identifier to the frontend.
/// </summary>
public class UserInfo
{
    public Guid Id { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string FullName { get; set; } = string.Empty;
    public List<string> Roles { get; set; } = new List<string>();

}

public class OrganizationInfo
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
}

public class StationInfo
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
}

public class SubscriptionInfo
{
    public string Status { get; set; } = string.Empty;

    public Guid PlanId { get; set; }
    public string PlanName { get; set; } = string.Empty;
    public DateTime? EndsAt { get; set; }
}
