using FuelFlow.Domain.Entities;
using FuelFlow.Infrastructure.Identity;

namespace FuelFlow.Infrastructure.Data;

/// <summary>
/// Junction entity for many-to-many between Station and AppUser (user_stations table).
/// Domain uses Station.Employees and User.AssignedStations; persistence uses this join table.
/// </summary>
public class UserStation
{
    public Guid StationId { get; set; }
    public Station Station { get; set; } = null!;

    public Guid UserId { get; set; }
    public AppUser User { get; set; } = null!;
}
