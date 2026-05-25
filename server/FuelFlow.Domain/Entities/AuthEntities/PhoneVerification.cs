using FuelFlow.Domain.Common;
using FuelFlow.Domain.Enums;

namespace FuelFlow.Domain.Entities;

/// <summary>
/// A one-time SMS verification code issued to a user for a specific purpose
/// (signup, phone change, or password recovery). The code is stored hashed
/// (HMAC-SHA256 with server-side pepper) — never in plaintext.
///
/// Lifecycle:
///   1. Issued: row created with CodeHash, ExpiresAt = now + Otp:TtlMinutes.
///   2. Verified: ConsumedAt set; row stays for audit/replay-protection.
///   3. Expired: ExpiresAt is in the past — row is left in place for the daily
///      cap query ([M01-F09-R12]).
///   4. Superseded on resend: previous active rows for the same (user, purpose)
///      are marked ConsumedAt = now before a new one is issued, so "active"
///      means at most one row.
///
/// Limits (per [M01-F09-R04]):
///   - AttemptCount &lt; Otp:MaxAttempts (default 3) before further verify is rejected.
///   - ResendCount + 60s window enforced in the resend handler.
///
/// Not station-scoped — used pre-auth during signup, so no global query filter.
/// FK targets <c>AspNetUsers</c> (Identity AppUser); the Domain User navigation
/// is included for readability and Ignored in EF config (mirrors RefreshToken).
/// </summary>
public class PhoneVerification : BaseEntity
{
    /// <summary>The user this verification was issued for.</summary>
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    /// <summary>HMAC-SHA256(pepper, plaintextCode), base64-encoded. Never store the raw code.</summary>
    public string CodeHash { get; set; } = string.Empty;

    /// <summary>Wall-clock UTC time after which the code is no longer valid.</summary>
    public DateTime ExpiresAt { get; set; }

    /// <summary>Number of verify attempts made against this row. Capped per Otp:MaxAttempts.</summary>
    public int AttemptCount { get; set; }

    /// <summary>How many times a fresh OTP has been re-issued for the same purpose since this row was created. Informational; cooldowns are queried via CreatedAt.</summary>
    public int ResendCount { get; set; }

    /// <summary>Set to the verify time when the user enters the right code (one-shot use), or to now when superseded by a resend.</summary>
    public DateTime? ConsumedAt { get; set; }

    /// <summary>Why this OTP was issued.</summary>
    public OtpPurpose Purpose { get; set; }

    /// <summary>
    /// For <see cref="OtpPurpose.PhoneChange"/>: the phone number the user intends
    /// to switch to. The OTP is delivered to this number and, on successful
    /// verification, becomes the user's new <c>PhoneNumber</c>.
    /// Null for Signup / PasswordRecovery (those target the user's current phone).
    /// </summary>
    public string? TargetPhone { get; set; }
}
