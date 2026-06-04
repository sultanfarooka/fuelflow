using Microsoft.EntityFrameworkCore.Storage;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Infrastructure.Data;

namespace FuelFlow.Infrastructure.Repositories;

/// <summary>
/// Wraps DbContext transaction + change-tracking management behind
/// <see cref="IUnitOfWork"/>.
///
/// M14-F02: now uses <see cref="TenantDbContextAccessor"/> for the per-tenant
/// <see cref="AppDbContext"/> (created lazily per HTTP request with the correct
/// tenant connection string) alongside the direct
/// <see cref="ControlPlaneDbContext"/> injection.
///
/// <para>
/// <b>Save order:</b> <see cref="SaveChangesAsync"/> flushes the tenant
/// <see cref="AppDbContext"/> first (so any newly-created <c>Organization</c> row
/// is visible), then <see cref="ControlPlaneDbContext"/>.
/// </para>
/// <para>
/// <b>Transaction limitation (F02):</b> <see cref="BeginTransactionAsync"/> opens
/// the transaction on the tenant <see cref="AppDbContext"/> only. Both contexts
/// target the same physical Postgres database in F01/F02, so cross-context reads
/// see committed tenant changes; control-plane writes commit independently.
/// M14-F03 replaces this with an explicit saga + compensation once tenant
/// databases physically split.
/// </para>
/// </summary>
public class UnitOfWork : IUnitOfWork
{
    private readonly TenantDbContextAccessor _tenantAccessor;
    private readonly ControlPlaneDbContext _controlPlaneDbContext;
    private IDbContextTransaction? _transaction;

    public UnitOfWork(TenantDbContextAccessor tenantAccessor, ControlPlaneDbContext controlPlaneDbContext)
    {
        _tenantAccessor = tenantAccessor;
        _controlPlaneDbContext = controlPlaneDbContext;
    }

    public async Task SaveChangesAsync()
    {
        // Flush tenant DB first, then control plane (see class doc).
        var tenantCtx = await _tenantAccessor.GetContextAsync();
        await tenantCtx.SaveChangesAsync();
        await _controlPlaneDbContext.SaveChangesAsync();
    }

    public async Task BeginTransactionAsync()
    {
        var tenantCtx = await _tenantAccessor.GetContextAsync();
        _transaction = await tenantCtx.Database.BeginTransactionAsync();
    }

    public async Task CommitAsync()
    {
        if (_transaction != null)
        {
            await _transaction.CommitAsync();
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }

    public async Task RollbackAsync()
    {
        if (_transaction != null)
        {
            await _transaction.RollbackAsync();
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }
}
