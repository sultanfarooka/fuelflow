using FuelFlow.Domain.Entities;

namespace FuelFlow.Application.Interfaces.Repositories;

/// <summary>
/// Repository interface for working with refresh tokens.
/// 
/// WHY in Application?
/// - Handlers (e.g. RefreshTokenCommandHandler) depend on this abstraction,
///   not on EF Core or DbContext directly.
/// - Infrastructure will provide the concrete implementation using AppDbContext.
/// 
/// NOTE:
/// - Saving changes is handled via IUnitOfWork; this interface focuses on
///   querying and adding entities.
/// </summary>
public interface IRefreshTokenRepository
{
    /// <summary>
    /// Add a new refresh token to the store.
    /// Does not call SaveChanges — use IUnitOfWork for that.
    /// </summary>
    Task AddAsync(RefreshToken token);

    /// <summary>
    /// Find a refresh token by its hash (stored value).
    /// Returns null if not found.
    /// </summary>
    Task<RefreshToken?> GetByTokenHashAsync(string tokenHash);

    /// <summary>
    /// Get all active (non-revoked, non-expired) tokens for a given user.
    /// Useful for security checks and “logout everywhere” features.
    /// </summary>
    Task<IReadOnlyList<RefreshToken>> GetActiveTokensByUserAsync(Guid userId);
}

