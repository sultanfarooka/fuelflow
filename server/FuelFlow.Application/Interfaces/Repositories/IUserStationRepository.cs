namespace FuelFlow.Application.Interfaces.Repositories;

/// <summary>
/// Query methods for user_stations junction (users assigned to stations).
/// Used to populate UserInfo.Stations in auth and station employees in API.
/// </summary>
public interface IUserStationRepository
{
    /// <summary>Station IDs the user is assigned to (for auth response / "my stations").</summary>
    Task<List<Guid>> GetStationIdsByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);

    /// <summary>User IDs assigned to the station (for station employees list).</summary>
    Task<List<Guid>> GetUserIdsByStationIdAsync(Guid stationId, CancellationToken cancellationToken = default);
}
