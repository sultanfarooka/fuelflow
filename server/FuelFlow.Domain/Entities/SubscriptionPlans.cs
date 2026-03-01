using FuelFlow.Domain.Common;

namespace FuelFlow.Domain.Entities;

/// <summary>
/// Plan: subscription_plans (reference data, seeded) — Starter, Professional, Enterprise; max_stations (1, 3, -1 unlimited), max_users.
/// </summary>
public class SubscriptionPlans : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public int MaxStations { get; set; }
    public int MaxUsers { get; set; }

    public ICollection<Subscription> Subscriptions { get; set; } = new List<Subscription>();
}