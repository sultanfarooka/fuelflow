namespace FuelFlow.Application.DTOs.Auth;

/// <summary>
/// Request to verify email using the token from the verification link.
/// </summary>
public class VerifyEmailRequest
{
    public Guid UserId { get; set; }
    public string Token { get; set; } = string.Empty;
}
