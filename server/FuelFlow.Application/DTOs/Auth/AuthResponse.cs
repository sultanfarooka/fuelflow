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
    public SubscriptionInfo? Subscription { get; set; }
}




/// <summary>
/// Basic user info included in the auth response.
/// Only the fields the frontend needs — not the full entity.
/// </summary>
public class UserInfo
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public List<StationInfo> Stations { get; set; } = new();
}

public class StationInfo
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
}

public class SubscriptionInfo
{
    public string Status { get; set; } = string.Empty;
    public string Plan { get; set; } = string.Empty;
    public DateTime? EndsAt { get; set; }
}
