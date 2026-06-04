using Microsoft.EntityFrameworkCore;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Domain.Entities;
using FuelFlow.Infrastructure.Data;

namespace FuelFlow.Infrastructure.Repositories;

public class ShiftAssignmentRepository : IShiftAssignmentRepository
{
    private readonly TenantDbContextAccessor _accessor;

    public ShiftAssignmentRepository(TenantDbContextAccessor accessor)
    {
        _accessor = accessor;
    }

    public async Task<List<ShiftAssignment>> GetByShiftIdAsync(Guid stationShiftId, CancellationToken cancellationToken = default)
    {
        var ctx = await _accessor.GetContextAsync(cancellationToken);
        return await ctx.ShiftAssignments
            .AsNoTracking()
            .Include(s => s.FuelNozzle)
            .Where(s => s.StationShiftId == stationShiftId)
            .ToListAsync(cancellationToken);
    }

    public async Task<ShiftAssignment?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var ctx = await _accessor.GetContextAsync(cancellationToken);
        return await ctx.ShiftAssignments
            .Include(s => s.FuelNozzle)
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
    }

    public async Task AddAsync(ShiftAssignment shiftAssignment)
    {
        var ctx = await _accessor.GetContextAsync();
        await ctx.ShiftAssignments.AddAsync(shiftAssignment);
    }
}
