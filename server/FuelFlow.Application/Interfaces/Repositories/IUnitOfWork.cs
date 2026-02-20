namespace FuelFlow.Application.Interfaces.Repositories;

/// <summary>
/// Manages database transactions across multiple repositories.
/// 
/// SaveChangesAsync() = sends SQL to database (inside a transaction, not final)
/// CommitAsync() = makes the transaction permanent
/// RollbackAsync() = undoes everything since BeginTransaction
/// </summary>
public interface IUnitOfWork
{
    Task SaveChangesAsync();
    Task BeginTransactionAsync();
    Task CommitAsync();
    Task RollbackAsync();
}
