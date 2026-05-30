using FuelFlow.Domain.Common;
using FuelFlow.Domain.Entities.StationEntities;

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
    public Guid OMCId { get; set; }
    public OMC OMC { get; set; } = null!;
    public ICollection<FuelTank> FuelTanks { get; set; } = new List<FuelTank>();
    public ICollection<FuelNozzle> FuelNozzles { get; set; } = new List<FuelNozzle>();
    public ICollection<StationShift> StationShifts { get; set; } = new List<StationShift>();
    public ICollection<FuelPrices> FuelPrices { get; set; } = new List<FuelPrices>();

    /// <summary>
    /// Users assigned to this station (many-to-many via user_stations). Populated in application layer from junction + AppUser.
    /// </summary>
    public ICollection<User> Employees { get; set; } = new List<User>();

    // M12-F01: onboarding completion flag; blocks dashboard access until the full wizard is done
    public bool IsSetupComplete { get; set; } = false;

    // M12-F01: JSONB list of accepted payment methods; Cash is always included
    public List<string> AcceptedPaymentMethods { get; set; } = new List<string> { "Cash" };

    // M12-F01: one-to-one shift schedule configured during onboarding
    public StationShiftConfig? ShiftConfig { get; set; }
}
