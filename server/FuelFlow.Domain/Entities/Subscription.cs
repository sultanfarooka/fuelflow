using FuelFlow.Domain.Common;
using FuelFlow.Domain.Enums;

namespace FuelFlow.Domain.Entities;

/// <summary>
/// A user's subscription to a plan. Plan: subscriptions — user_id, plan_id, status, trial_ends_at, started_at, ends_at.
/// User (1) → Subscriptions (many; typically one active at a time).
/// </summary>
public class Subscription : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public Guid PlanId { get; set; }
    public SubscriptionPlans Plan { get; set; } = null!;
    public SubscriptionStatus Status { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? EndsAt { get; set; }
}
