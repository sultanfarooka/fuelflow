using FuelFlow.Domain.Entities;

namespace FuelFlow.Application.Interfaces.Repositories;

/// <summary>
/// Lookup for subscription plans (reference data). Used e.g. to resolve plan by name for trial subscription.
/// </summary>
public interface ISubscriptionPlanRepository
{
    /// <summary>Returns the plan with the given name (e.g. "Professional"), or null if not found.</summary>
    Task<SubscriptionPlans?> GetByNameAsync(string name, CancellationToken cancellationToken = default);
}
