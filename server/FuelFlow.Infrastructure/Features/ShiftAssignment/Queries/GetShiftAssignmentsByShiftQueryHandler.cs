using MediatR;
using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.ShiftAssignment;
using FuelFlow.Application.Features.ShiftAssignment.Queries;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Application.Interfaces.Services;

namespace FuelFlow.Infrastructure.Features.ShiftAssignment.Queries;

public class GetShiftAssignmentsByShiftQueryHandler : IRequestHandler<GetShiftAssignmentsByShiftQuery, Result<List<ShiftAssignmentDto>>>
{
    private readonly ICurrentUserService _currentUser;
    private readonly IStationRepository _stationRepo;
    private readonly IStationShiftRepository _shiftRepo;
    private readonly IShiftAssignmentRepository _assignmentRepo;

    public GetShiftAssignmentsByShiftQueryHandler(
        ICurrentUserService currentUser,
        IStationRepository stationRepo,
        IStationShiftRepository shiftRepo,
        IShiftAssignmentRepository assignmentRepo)
    {
        _currentUser = currentUser;
        _stationRepo = stationRepo;
        _shiftRepo = shiftRepo;
        _assignmentRepo = assignmentRepo;
    }

    public async Task<Result<List<ShiftAssignmentDto>>> Handle(GetShiftAssignmentsByShiftQuery request, CancellationToken cancellationToken)
    {
        var orgId = _currentUser.OrganizationId;
        if (orgId == null)
            return Result<List<ShiftAssignmentDto>>.Failure("You must belong to an organization.");

        var station = await _stationRepo.GetByIdAsync(request.StationId, cancellationToken);
        if (station == null)
            return Result<List<ShiftAssignmentDto>>.Failure("Station not found.");
        if (station.OrganizationId != orgId)
            return Result<List<ShiftAssignmentDto>>.Failure("You do not have access to this station.");

        var shift = await _shiftRepo.GetByIdAsync(request.ShiftId, cancellationToken);
        if (shift == null)
            return Result<List<ShiftAssignmentDto>>.Failure("Shift not found.");
        if (shift.StationId != request.StationId)
            return Result<List<ShiftAssignmentDto>>.Failure("Shift does not belong to this station.");

        var list = await _assignmentRepo.GetByShiftIdAsync(request.ShiftId, cancellationToken);
        var dtos = list.Select(a => new ShiftAssignmentDto
        {
            Id = a.Id,
            StationShiftId = a.StationShiftId,
            FuelNozzleId = a.FuelNozzleId,
            NozzleNumber = a.FuelNozzle?.NozzleNumber,
            UserId = a.UserId,
        }).ToList();

        return Result<List<ShiftAssignmentDto>>.Success(dtos);
    }
}
