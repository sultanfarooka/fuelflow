using Microsoft.EntityFrameworkCore;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Domain.Entities;
using FuelFlow.Domain.Enums;
using FuelFlow.Infrastructure.Data;

namespace FuelFlow.Infrastructure.Repositories;

public class StationShiftRepository : IStationShiftRepository
{
    private readonly AppDbContext _dbContext;

    public StationShiftRepository(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<StationShift>> GetByStationIdAsync(Guid stationId, int limit = 50, CancellationToken cancellationToken = default)
    {
        return await _dbContext.StationShifts
            .AsNoTracking()
            .Where(s => s.StationId == stationId)
            .OrderByDescending(s => s.OpenedAt)
            .Take(limit)
            .ToListAsync(cancellationToken);
    }

    public async Task<StationShift?> GetOpenShiftByStationIdAsync(Guid stationId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.StationShifts
            .FirstOrDefaultAsync(s => s.StationId == stationId && s.Status == ShiftStatus.Open, cancellationToken);
    }

    public async Task<StationShift?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.StationShifts
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
    }

    public async Task AddAsync(StationShift stationShift)
    {
        await _dbContext.StationShifts.AddAsync(stationShift);
    }

    public void Update(StationShift stationShift)
    {
        _dbContext.StationShifts.Update(stationShift);
    }
}
