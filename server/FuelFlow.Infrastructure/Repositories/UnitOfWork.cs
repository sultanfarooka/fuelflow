using Microsoft.EntityFrameworkCore.Storage;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Infrastructure.Data;

namespace FuelFlow.Infrastructure.Repositories;

/// <summary>
/// Wraps DbContext transaction + change-tracking management behind the
/// <see cref="IUnitOfWork"/> interface.
///
/// M14-F01: now manages two DbContexts —
/// <see cref="AppDbContext"/> (per-tenant operational data) and
/// <see cref="ControlPlaneDbContext"/> (Identity + Tenants + reference data).
/// <see cref="SaveChangesAsync"/> flushes both.
///
/// <para>
/// <b>F01 transaction limitation:</b> <see cref="BeginTransactionAsync"/> still
/// opens the transaction on <see cref="AppDbContext"/> only — its writes are
/// atomic, but control-plane writes commit independently. This is acceptable
/// in F01 because both contexts target the same physical Postgres database
/// and existing handlers (notably <c>OnboardingCommandHandler</c>) already
/// commit some control-plane operations (UserManager.UpdateAsync) outside
/// the transaction today. <b>M14-F03 must replace this with an explicit
/// saga + compensation</b> once tenant databases physically split — at that
/// point a single connection-level transaction can no longer span both DBs.
/// </para>
/// </summary>
public class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _appDbContext;
    private readonly ControlPlaneDbContext _controlPlaneDbContext;
    private IDbContextTransaction? _transaction;

    public UnitOfWork(AppDbContext appDbContext, ControlPlaneDbContext controlPlaneDbContext)
    {
        _appDbContext = appDbContext;
        _controlPlaneDbContext = controlPlaneDbContext;
    }

    public async Task SaveChangesAsync()
    {
        // Save AppDbContext first so any FK from control-plane to per-tenant
        // (e.g. AppUser.OrganizationId after onboarding) resolves against a
        // freshly-committed Organization row when the control-plane save runs.
        await _appDbContext.SaveChangesAsync();
        await _controlPlaneDbContext.SaveChangesAsync();
    }

    public async Task BeginTransactionAsync()
    {
        // TODO M14-F03: replace single-DbContext transaction with an explicit
        // saga + compensation pattern. In F01 the AppDbContext transaction is
        // sufficient because both contexts share the same physical DB and
        // control-plane writes are already non-transactional in practice
        // (UserManager.UpdateAsync flushes its own context outside any
        // ambient transaction).
        _transaction = await _appDbContext.Database.BeginTransactionAsync();
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
