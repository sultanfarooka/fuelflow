namespace FuelFlow.Application.DTOs.Auth;

/// <summary>
/// Response after successful email verification.
/// </summary>
public class VerifyEmailResponse
{
    public bool Success { get; set; } = true;
    public string Message { get; set; } = "Email verified successfully. You can now log in.";
}
