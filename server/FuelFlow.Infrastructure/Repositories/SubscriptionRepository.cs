using Microsoft.EntityFrameworkCore;
using FuelFlow.Application.DTOs.Auth;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Domain.Entities;
using FuelFlow.Domain.Enums;
using FuelFlow.Infrastructure.Data;

namespace FuelFlow.Infrastructure.Repositories;

public class SubscriptionRepository : ISubscriptionRepository
{
    private readonly ControlPlaneDbContext _dbContext;

    public SubscriptionRepository(ControlPlaneDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<SubscriptionInfo?> GetActiveSubscriptionForUserAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var sub = await _dbContext.Subscriptions
            .Include(s => s.Plan)
            .Where(s => s.UserId == userId && (s.Status == SubscriptionStatus.Trial || s.Status == SubscriptionStatus.Active))
            .OrderByDescending(s => s.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (sub == null)
            return null;

        return new SubscriptionInfo
        {
            Status = sub.Status.ToString(),
            PlanId = sub.PlanId,
            PlanName = sub.Plan.Name,
            EndsAt = sub.EndsAt,
        };
    }

    public async Task<Subscription?> GetActiveSubscriptionWithPlanForUserAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Subscriptions
            .Include(s => s.Plan)
            .Where(s => s.UserId == userId && (s.Status == SubscriptionStatus.Trial || s.Status == SubscriptionStatus.Active))
            .OrderByDescending(s => s.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task AddAsync(Subscription subscription, CancellationToken cancellationToken = default)
    {
        await _dbContext.Subscriptions.AddAsync(subscription, cancellationToken);
    }
}
