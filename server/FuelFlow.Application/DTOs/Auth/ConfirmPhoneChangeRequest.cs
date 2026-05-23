namespace FuelFlow.Application.DTOs.Auth;

/// <summary>
/// Step 2 of phone change ([M01-F09-R11]): user submits the OTP that landed on
/// the new phone. On success the user's phone number swaps to <see cref="NewPhone"/>.
/// </summary>
public class ConfirmPhoneChangeRequest
{
    /// <summary>The new phone number the user previously requested.</summary>
    public string NewPhone { get; set; } = string.Empty;

    /// <summary>The OTP delivered to <see cref="NewPhone"/>.</summary>
    public string Code { get; set; } = string.Empty;
}
