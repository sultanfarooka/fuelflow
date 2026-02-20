namespace FuelFlow.Application.DTOs.Auth;

/// <summary>
/// Request to send a password reset email.
/// </summary>
public class ForgotPasswordRequest
{
    public string Email { get; set; } = string.Empty;
}
