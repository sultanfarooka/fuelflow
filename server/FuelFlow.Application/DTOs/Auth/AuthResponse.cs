namespace FuelFlow.Application.DTOs.Auth;

/// <summary>
/// Returned after successful registration or login.
/// 
/// Contains the JWT tokens and basic user info so the frontend can:
/// 1. Store the tokens (localStorage or httpOnly cookie)
/// 2. Display the user's name and role in the UI
/// 3. Know which stations the user has access to
/// 4. Show subscription status (trial banner, etc.)
/// 
/// From PRD Section 4.5 — matches the sample response format.
/// </summary>
public class AuthResponse
{
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public int ExpiresIn { get; set; }
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
    public DateTime? TrialEndsAt { get; set; }
}
