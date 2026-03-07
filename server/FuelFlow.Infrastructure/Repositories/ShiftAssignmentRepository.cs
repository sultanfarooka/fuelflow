using Microsoft.EntityFrameworkCore;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Domain.Entities;
using FuelFlow.Infrastructure.Data;

namespace FuelFlow.Infrastructure.Repositories;

public class ShiftAssignmentRepository : IShiftAssignmentRepository
{
    private readonly AppDbContext _dbContext;

    public ShiftAssignmentRepository(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<ShiftAssignment>> GetByShiftIdAsync(Guid stationShiftId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.ShiftAssignments
            .AsNoTracking()
            .Include(s => s.FuelNozzle)
            .Where(s => s.StationShiftId == stationShiftId)
            .ToListAsync(cancellationToken);
    }

    public async Task<ShiftAssignment?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.ShiftAssignments
            .Include(s => s.FuelNozzle)
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
    }

    public async Task AddAsync(ShiftAssignment shiftAssignment)
    {
        await _dbContext.ShiftAssignments.AddAsync(shiftAssignment);
    }
}
