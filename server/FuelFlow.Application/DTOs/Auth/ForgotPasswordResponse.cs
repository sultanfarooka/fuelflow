namespace FuelFlow.Application.DTOs.Auth;

/// <summary>
/// Response after requesting password reset.
/// Uses generic message for security (don't reveal if email exists).
/// </summary>
public class ForgotPasswordResponse
{
    public bool Success { get; set; } = true;
    public string Message { get; set; } = "If an account exists with this email, a password reset link has been sent.";
}
