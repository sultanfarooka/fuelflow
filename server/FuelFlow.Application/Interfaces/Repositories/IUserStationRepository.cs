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

    /// <summary>
    /// Stage new user→station assignment rows ([M01-F05-R02]). Tuple signature keeps
    /// Application free of the Infrastructure <c>UserStation</c> type. Does not call
    /// SaveChanges — commit via <see cref="IUnitOfWork"/>. Calling this initializes the
    /// tenant context so UnitOfWork flushes it.
    /// </summary>
    Task AddRangeAsync(IEnumerable<(Guid userId, Guid stationId)> rows, CancellationToken cancellationToken = default);

    /// <summary>
    /// Stage deletion of every assignment row for a user ([M01-F05-R02] compensation path).
    /// Does not call SaveChanges — commit via <see cref="IUnitOfWork"/>.
    /// </summary>
    Task RemoveByUserAsync(Guid userId, CancellationToken cancellationToken = default);
}
