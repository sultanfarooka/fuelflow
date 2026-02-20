namespace FuelFlow.Application.DTOs.Auth;

/// <summary>
/// Request to resend the verification email.
/// </summary>
public class ResendVerificationRequest
{
    public string Email { get; set; } = string.Empty;
}
