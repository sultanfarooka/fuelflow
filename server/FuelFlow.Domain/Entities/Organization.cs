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

    // M14-F01: cross-context FK. AppUser/User lives in the control-plane
    // DbContext; Organization lives per-tenant. Stored as a plain Guid;
    // existence is enforced in handlers via the control-plane AppUser repo.
    // The Owner navigation property was dropped — no FK constraint at the
    // model level (M14-F04 will compensate in the onboarding saga).
    public Guid OwnerId { get; set; }

    public ICollection<Station> Stations { get; set; } = new List<Station>();
}
