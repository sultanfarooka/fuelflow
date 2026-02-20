using FuelFlow.Domain.Common;
using FuelFlow.Domain.Enums;

namespace FuelFlow.Domain.Entities;

/// <summary>
/// The top-level tenant in the system. Every station, user, and subscription
/// belongs to an Organization.
/// 
/// WHY this is the root entity:
/// - One Owner registers → one Organization is created
/// - That Organization can have multiple Stations
/// - All users belong to the Organization
/// - Billing/subscription is per Organization (not per station)
/// 
/// From PRD (REG-002): Registration creates Organization + Owner + Station
/// in a single transaction.
/// 
/// NOTICE: No [Table] or [Column] attributes — this is a pure C# class.
/// The database mapping (table name, column types) is configured separately
/// in Infrastructure using EF Core's Fluent API.
/// </summary>
public class Organization : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }

    // Subscription tracking (denormalized here for quick access)
    public SubscriptionStatus SubscriptionStatus { get; set; } = SubscriptionStatus.Trial;
    public DateTime? TrialEndsAt { get; set; }
    public DateTime? RegisteredAt { get; set; }

    // Navigation properties — EF Core uses these to understand relationships
    // "An Organization HAS MANY Stations" and "HAS MANY Users"
    public ICollection<Station> Stations { get; set; } = new List<Station>();
    public ICollection<User> Users { get; set; } = new List<User>();
}
