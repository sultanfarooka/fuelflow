using Microsoft.EntityFrameworkCore.Storage;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Infrastructure.Data;

namespace FuelFlow.Infrastructure.Repositories;

/// <summary>
/// Wraps DbContext's transaction management behind the IUnitOfWork interface.
/// 
/// WHY wrap DbContext?
/// - Handlers (e.g. RegisterCommandHandler) need transactional work across multiple repos.
/// - Using IUnitOfWork keeps the handler code portable and testable.
/// - In tests, you can mock IUnitOfWork (you can't easily mock DbContext).
/// </summary>
public class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _dbContext;
    private IDbContextTransaction? _transaction;

    public UnitOfWork(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task SaveChangesAsync()
    {
        await _dbContext.SaveChangesAsync();
    }

    public async Task BeginTransactionAsync()
    {
        _transaction = await _dbContext.Database.BeginTransactionAsync();
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
