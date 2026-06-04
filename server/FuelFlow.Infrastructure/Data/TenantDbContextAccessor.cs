using FuelFlow.Application.Interfaces.Services;
using Microsoft.EntityFrameworkCore;
using Npgsql.EntityFrameworkCore.PostgreSQL.Infrastructure;

namespace FuelFlow.Infrastructure.Data;

/// <summary>
/// Scoped service that owns the per-request <see cref="AppDbContext"/> instance
/// for the current tenant (M14-F02-R02).
///
/// On first call to <see cref="GetContextAsync"/> it resolves the tenant connection
/// string via <see cref="ITenantConnectionResolver"/>, constructs an
/// <see cref="AppDbContext"/> with those options, and caches it for the lifetime of
/// the HTTP request. All 11 per-tenant repositories and <see cref="FuelFlow.Infrastructure.Repositories.UnitOfWork"/>
/// inject this accessor and call <see cref="GetContextAsync"/> rather than holding
/// a direct <see cref="AppDbContext"/> reference.
/// </summary>
public sealed class TenantDbContextAccessor : IAsyncDisposable
{
    private readonly ITenantConnectionResolver _resolver;
    private AppDbContext? _context;

    public TenantDbContextAccessor(ITenantConnectionResolver resolver)
    {
        _resolver = resolver;
    }

    /// <summary>
    /// Returns the tenant's <see cref="AppDbContext"/>, creating it on first call.
    /// Subsequent calls within the same HTTP request return the cached instance.
    /// </summary>
    public async Task<AppDbContext> GetContextAsync(CancellationToken ct = default)
    {
        if (_context is not null)
            return _context;

        var connStr = await _resolver.ResolveAsync(ct)
            ?? throw new InvalidOperationException(
                "TenantDbContextAccessor.GetContextAsync called for a request with no org_id claim. " +
                "Only inject the accessor in endpoints that require an authenticated tenant context.");

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(connStr, static npgsql =>
                npgsql.MigrationsHistoryTable("__EFMigrationsHistory_AppDb"))
            .Options;

        _context = new AppDbContext(options);
        return _context;
    }

    public async ValueTask DisposeAsync()
    {
        if (_context is not null)
            await _context.DisposeAsync();
    }
}
