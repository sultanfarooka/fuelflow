namespace FuelFlow.Application.DTOs.Auth;

/// <summary>
/// Request to logout (revoke refresh token).
/// Client sends the refresh token to revoke.
/// </summary>
public class LogoutRequest
{
    public string RefreshToken { get; set; } = string.Empty;
}
