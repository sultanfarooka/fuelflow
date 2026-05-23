namespace FuelFlow.Domain.Enums;

/// <summary>
/// Reason a phone-verification OTP was issued.
/// Lets handlers and repos scope queries (e.g. daily cap per purpose,
/// "what is the active signup OTP for this user?").
/// See [M01-F09].
/// </summary>
public enum OtpPurpose
{
    /// <summary>Verifying the phone number provided at registration.</summary>
    Signup,

    /// <summary>Verifying a new phone number an authenticated user is switching to ([M01-F09-R11]).</summary>
    PhoneChange,

    /// <summary>Verifying ownership of the phone before resetting a password ([M01-F09-R08], [M01-F04-R04]).</summary>
    PasswordRecovery
}
