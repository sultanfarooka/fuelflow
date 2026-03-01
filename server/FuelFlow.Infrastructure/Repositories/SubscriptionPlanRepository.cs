using Microsoft.EntityFrameworkCore;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Domain.Entities;
using FuelFlow.Infrastructure.Data;

namespace FuelFlow.Infrastructure.Repositories;

public class SubscriptionPlanRepository : ISubscriptionPlanRepository
{
    private readonly AppDbContext _dbContext;

    public SubscriptionPlanRepository(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<SubscriptionPlans?> GetByNameAsync(string name, CancellationToken cancellationToken = default)
    {
        return await _dbContext.SubscriptionPlans
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Name == name, cancellationToken);
    }
}
