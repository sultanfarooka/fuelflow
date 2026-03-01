using Microsoft.EntityFrameworkCore;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Infrastructure.Data;

namespace FuelFlow.Infrastructure.Repositories;

public class UserStationRepository : IUserStationRepository
{
    private readonly AppDbContext _dbContext;

    public UserStationRepository(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<Guid>> GetStationIdsByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.UserStations
            .Where(us => us.UserId == userId)
            .Select(us => us.StationId)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Guid>> GetUserIdsByStationIdAsync(Guid stationId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.UserStations
            .Where(us => us.StationId == stationId)
            .Select(us => us.UserId)
            .ToListAsync(cancellationToken);
    }
}
