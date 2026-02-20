namespace FuelFlow.Application.DTOs.Auth;

/// <summary>
/// Response returned after successful registration when email verification is required.
/// User must verify email before they can log in.
/// </summary>
public class RegisterResponse
{
    public bool Success { get; set; } = true;
    public string Message { get; set; } = "Please check your email to verify your account.";
}
