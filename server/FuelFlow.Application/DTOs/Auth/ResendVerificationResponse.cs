namespace FuelFlow.Application.DTOs.Auth;

/// <summary>
/// Response after resending verification email.
/// Uses generic message for security (don't reveal if email exists).
/// </summary>
public class ResendVerificationResponse
{
    public bool Success { get; set; } = true;
    public string Message { get; set; } = "If an account exists with this email, a verification link has been sent.";
}
