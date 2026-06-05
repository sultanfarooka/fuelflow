using Microsoft.EntityFrameworkCore;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Infrastructure.Data;

namespace FuelFlow.Infrastructure.Repositories;

public class UserStationRepository : IUserStationRepository
{
    private readonly TenantDbContextAccessor _accessor;

    public UserStationRepository(TenantDbContextAccessor accessor)
    {
        _accessor = accessor;
    }

    public async Task<List<Guid>> GetStationIdsByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var ctx = await _accessor.GetContextAsync(cancellationToken);
        return await ctx.UserStations
            .Where(us => us.UserId == userId)
            .Select(us => us.StationId)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Guid>> GetUserIdsByStationIdAsync(Guid stationId, CancellationToken cancellationToken = default)
    {
        var ctx = await _accessor.GetContextAsync(cancellationToken);
        return await ctx.UserStations
            .Where(us => us.StationId == stationId)
            .Select(us => us.UserId)
            .ToListAsync(cancellationToken);
    }
}
