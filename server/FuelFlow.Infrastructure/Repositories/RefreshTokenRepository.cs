using Microsoft.EntityFrameworkCore;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Domain.Entities;
using FuelFlow.Infrastructure.Data;

namespace FuelFlow.Infrastructure.Repositories;

/// <summary>
/// Concrete implementation of IRefreshTokenRepository.
/// 
/// This is the only place that knows refresh tokens are stored in PostgreSQL
/// via EF Core. Handlers work only with the interface and domain entities.
/// </summary>
public class RefreshTokenRepository : IRefreshTokenRepository
{
    private readonly AppDbContext _dbContext;

    public RefreshTokenRepository(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task AddAsync(RefreshToken token)
    {
        await _dbContext.RefreshTokens.AddAsync(token);
    }

    public async Task<RefreshToken?> GetByTokenHashAsync(string tokenHash)
    {
        return await _dbContext.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.TokenHash == tokenHash);
    }

    public async Task<IReadOnlyList<RefreshToken>> GetActiveTokensByUserAsync(Guid userId)
    {
        var now = DateTime.UtcNow;

        return await _dbContext.RefreshTokens
            .Where(rt =>
                rt.UserId == userId &&
                rt.RevokedAt == null &&
                rt.ExpiresAt >= now)
            .OrderByDescending(rt => rt.CreatedAt)
            .ToListAsync();
    }
}

