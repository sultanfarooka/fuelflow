using FuelFlow.Domain.Entities;
using FuelFlow.Domain.Enums;

namespace FuelFlow.Application.Interfaces.Repositories;

/// <summary>
/// Repository for PhoneVerification (OTP rows).
///
/// WHY in Application?
/// - Handlers (VerifyPhone, ResendOtp, RequestPhoneChange, …) depend on this
///   abstraction, not on EF Core or DbContext directly.
/// - Infrastructure provides the concrete impl backed by AppDbContext.
///
/// NOTE:
/// - Persistence is committed via IUnitOfWork.SaveChangesAsync() — these
///   methods only stage the work.
/// </summary>
public interface IPhoneVerificationRepository
{
    /// <summary>
    /// Returns the most recent unconsumed OTP row for the given user + purpose,
    /// or null when none exists. Caller checks ExpiresAt / AttemptCount itself
    /// (handler-level rule enforcement keeps the repo small).
    /// </summary>
    Task<PhoneVerification?> GetActiveForUserAsync(Guid userId, OtpPurpose purpose);

    /// <summary>
    /// Stage a new OTP row. Does not call SaveChanges — use IUnitOfWork.
    /// </summary>
    Task AddAsync(PhoneVerification verification);

    /// <summary>
    /// Count OTP rows issued for the given user since <paramref name="sinceUtc"/>.
    /// Backs the daily-cap rule [M01-F09-R12] — counts across all purposes by
    /// default so the cap covers signup, recovery, and phone-change together.
    /// </summary>
    Task<int> CountIssuedSinceAsync(Guid userId, DateTime sinceUtc);

    /// <summary>
    /// Mark every currently-active OTP row for (user, purpose) as consumed.
    /// Called on resend so "active" never returns more than one row.
    /// </summary>
    Task ConsumeActiveAsync(Guid userId, OtpPurpose purpose, DateTime nowUtc);
}
