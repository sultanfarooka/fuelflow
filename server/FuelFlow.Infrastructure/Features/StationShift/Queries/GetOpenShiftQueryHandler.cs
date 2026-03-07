using MediatR;
using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.StationShift;
using FuelFlow.Application.Features.StationShift.Queries;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Application.Interfaces.Services;

namespace FuelFlow.Infrastructure.Features.StationShift.Queries;

public class GetOpenShiftQueryHandler : IRequestHandler<GetOpenShiftQuery, Result<StationShiftDto?>>
{
    private readonly ICurrentUserService _currentUser;
    private readonly IStationRepository _stationRepo;
    private readonly IStationShiftRepository _shiftRepo;

    public GetOpenShiftQueryHandler(
        ICurrentUserService currentUser,
        IStationRepository stationRepo,
        IStationShiftRepository shiftRepo)
    {
        _currentUser = currentUser;
        _stationRepo = stationRepo;
        _shiftRepo = shiftRepo;
    }

    public async Task<Result<StationShiftDto?>> Handle(GetOpenShiftQuery request, CancellationToken cancellationToken)
    {
        var orgId = _currentUser.OrganizationId;
        if (orgId == null)
            return Result<StationShiftDto?>.Failure("You must belong to an organization.");

        var station = await _stationRepo.GetByIdAsync(request.StationId, cancellationToken);
        if (station == null)
            return Result<StationShiftDto?>.Failure("Station not found.");
        if (station.OrganizationId != orgId)
            return Result<StationShiftDto?>.Failure("You do not have access to this station.");

        var shift = await _shiftRepo.GetOpenShiftByStationIdAsync(request.StationId, cancellationToken);
        StationShiftDto? dto = shift == null ? null : new StationShiftDto
        {
            Id = shift.Id,
            StationId = shift.StationId,
            Status = shift.Status,
            OpenedAt = shift.OpenedAt,
            ClosedAt = shift.ClosedAt,
            OpeningCash = shift.OpeningCash,
            ClosingCash = shift.ClosingCash,
            ShiftName = shift.ShiftName,
            OpenedByUserId = shift.OpenedByUserId,
            ClosedByUserId = shift.ClosedByUserId,
        };
        return Result<StationShiftDto?>.Success(dto);
    }
}
