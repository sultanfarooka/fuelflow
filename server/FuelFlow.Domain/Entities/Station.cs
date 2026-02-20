using FuelFlow.Domain.Common;

namespace FuelFlow.Domain.Entities;

/// <summary>
/// A physical filling station. This is the main unit of multi-tenancy —
/// almost every table in the system has a StationId foreign key.
/// 
/// WHY multi-tenancy matters:
/// - Station A's data must be invisible to Station B's users
/// - Only the Owner can see data across all stations
/// - EF Core query filters will automatically add "WHERE station_id = X"
/// 
/// From PRD: An Organization can have 1, 3, or unlimited stations
/// depending on their subscription plan (Starter=1, Professional=3, Enterprise=unlimited).
/// </summary>
public class Station : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? Phone { get; set; }
    public string? LogoUrl { get; set; }
    public bool IsActive { get; set; } = true;

    // Foreign key — every Station belongs to exactly one Organization
    public Guid OrganizationId { get; set; }

    // Navigation property — EF Core uses this to JOIN to organizations table
    public Organization Organization { get; set; } = null!;
}
