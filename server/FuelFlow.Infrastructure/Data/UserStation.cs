using FuelFlow.Domain.Entities;
using FuelFlow.Infrastructure.Identity;

namespace FuelFlow.Infrastructure.Data;

/// <summary>
/// Junction entity for many-to-many between Station and AppUser (user_stations table).
/// Domain uses Station.Employees and User.AssignedStations; persistence uses this join table.
///
/// WHY IN INFRASTRUCTURE AND NOT DOMAIN?
/// In Clean Architecture this concept (user assigned to station) would ideally live in Domain.
/// This entity lives here because it has a navigation property to AppUser (Identity), which is
/// an Infrastructure concern. Putting it in Domain would force Domain to reference
/// FuelFlow.Infrastructure.Identity, breaking the dependency rule (Domain must not depend on
/// outer layers). To move it to Domain later: keep only UserId (Guid) and StationId + Station
/// nav there; drop the AppUser nav and configure the UserId FK to AspNetUsers in this layer.
/// </summary>
public class UserStation
{
    public Guid StationId { get; set; }
    public Station Station { get; set; } = null!;

    public Guid UserId { get; set; }
    public AppUser User { get; set; } = null!;
}
