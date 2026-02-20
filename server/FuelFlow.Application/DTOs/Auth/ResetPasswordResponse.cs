namespace FuelFlow.Application.DTOs.Auth;

/// <summary>
/// Response after successfully resetting password.
/// </summary>
public class ResetPasswordResponse
{
    public bool Success { get; set; } = true;
    public string Message { get; set; } = "Password has been reset. You can now log in.";
}
