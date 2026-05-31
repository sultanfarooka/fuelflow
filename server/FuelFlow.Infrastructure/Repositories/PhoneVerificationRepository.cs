using Microsoft.EntityFrameworkCore;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Domain.Entities;
using FuelFlow.Domain.Enums;
using FuelFlow.Infrastructure.Data;

namespace FuelFlow.Infrastructure.Repositories;

/// <summary>
/// Concrete implementation of IPhoneVerificationRepository. The only place
/// that knows OTP rows live in PostgreSQL via EF Core.
/// </summary>
public class PhoneVerificationRepository : IPhoneVerificationRepository
{
    private readonly ControlPlaneDbContext _dbContext;

    public PhoneVerificationRepository(ControlPlaneDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<PhoneVerification?> GetActiveForUserAsync(Guid userId, OtpPurpose purpose)
    {
        return await _dbContext.PhoneVerifications
            .Where(pv => pv.UserId == userId && pv.Purpose == purpose && pv.ConsumedAt == null)
            .OrderByDescending(pv => pv.CreatedAt)
            .FirstOrDefaultAsync();
    }

    public async Task AddAsync(PhoneVerification verification)
    {
        await _dbContext.PhoneVerifications.AddAsync(verification);
    }

    public async Task<int> CountIssuedSinceAsync(Guid userId, DateTime sinceUtc)
    {
        return await _dbContext.PhoneVerifications
            .CountAsync(pv => pv.UserId == userId && pv.CreatedAt >= sinceUtc);
    }

    public async Task ConsumeActiveAsync(Guid userId, OtpPurpose purpose, DateTime nowUtc)
    {
        await _dbContext.PhoneVerifications
            .Where(pv => pv.UserId == userId && pv.Purpose == purpose && pv.ConsumedAt == null)
            .ExecuteUpdateAsync(setters => setters.SetProperty(pv => pv.ConsumedAt, nowUtc));
    }
}
