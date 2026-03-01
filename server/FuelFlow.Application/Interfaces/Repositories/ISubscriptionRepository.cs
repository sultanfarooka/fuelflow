using FuelFlow.Application.DTOs.Auth;
using FuelFlow.Domain.Entities;

namespace FuelFlow.Application.Interfaces.Repositories;

/// <summary>
/// Lookup and create for user subscriptions (auth response, plan limits, trial on onboarding).
/// </summary>
public interface ISubscriptionRepository
{
    /// <summary>Returns the user's active or trial subscription with plan name, or null.</summary>
    Task<SubscriptionInfo?> GetActiveSubscriptionForUserAsync(Guid userId, CancellationToken cancellationToken = default);

    /// <summary>Returns the user's active or trial subscription with Plan included (e.g. for MaxStations limit check).</summary>
    Task<Subscription?> GetActiveSubscriptionWithPlanForUserAsync(Guid userId, CancellationToken cancellationToken = default);

    /// <summary>Adds a new subscription (e.g. trial on onboarding).</summary>
    Task AddAsync(Subscription subscription, CancellationToken cancellationToken = default);
}
