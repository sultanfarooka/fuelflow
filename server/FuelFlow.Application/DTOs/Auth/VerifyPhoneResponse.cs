namespace FuelFlow.Application.DTOs.Auth;

/// <summary>
/// Response from phone OTP verification ([M01-F09]).
/// </summary>
public class VerifyPhoneResponse
{
    public bool Success { get; set; } = true;
    public string Message { get; set; } = "Phone verified. You can now log in.";
}
