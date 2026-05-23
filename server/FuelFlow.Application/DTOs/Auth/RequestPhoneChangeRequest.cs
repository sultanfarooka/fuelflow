namespace FuelFlow.Application.DTOs.Auth;

/// <summary>
/// Step 1 of phone change ([M01-F09-R11]): authenticated user submits the new
/// phone number. Backend issues an SMS OTP to the new number; the user proves
/// ownership at <see cref="ConfirmPhoneChangeRequest"/>.
/// </summary>
public class RequestPhoneChangeRequest
{
    /// <summary>The new Pakistani phone in <c>+92XXXXXXXXXX</c> format.</summary>
    public string NewPhone { get; set; } = string.Empty;
}
