using MediatR;
using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.StationShift;
using FuelFlow.Application.Features.StationShift.Queries;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Application.Interfaces.Services;
using StationShiftEntity = FuelFlow.Domain.Entities.StationShift;

namespace FuelFlow.Infrastructure.Features.StationShift.Queries;

public class GetStationShiftsByStationQueryHandler : IRequestHandler<GetStationShiftsByStationQuery, Result<List<StationShiftDto>>>
{
    private readonly ICurrentUserService _currentUser;
    private readonly IStationRepository _stationRepo;
    private readonly IStationShiftRepository _shiftRepo;

    public GetStationShiftsByStationQueryHandler(
        ICurrentUserService currentUser,
        IStationRepository stationRepo,
        IStationShiftRepository shiftRepo)
    {
        _currentUser = currentUser;
        _stationRepo = stationRepo;
        _shiftRepo = shiftRepo;
    }

    public async Task<Result<List<StationShiftDto>>> Handle(GetStationShiftsByStationQuery request, CancellationToken cancellationToken)
    {
        var orgId = _currentUser.OrganizationId;
        if (orgId == null)
            return Result<List<StationShiftDto>>.Failure("You must belong to an organization.");

        var station = await _stationRepo.GetByIdAsync(request.StationId, cancellationToken);
        if (station == null)
            return Result<List<StationShiftDto>>.Failure("Station not found.");
        if (station.OrganizationId != orgId)
            return Result<List<StationShiftDto>>.Failure("You do not have access to this station.");

        var list = await _shiftRepo.GetByStationIdAsync(request.StationId, request.Limit, cancellationToken);
        var dtos = list.Select(Map).ToList();
        return Result<List<StationShiftDto>>.Success(dtos);
    }

    private static StationShiftDto Map(StationShiftEntity s) => new()
    {
        Id = s.Id,
        StationId = s.StationId,
        Status = s.Status,
        OpenedAt = s.OpenedAt,
        ClosedAt = s.ClosedAt,
        OpeningCash = s.OpeningCash,
        ClosingCash = s.ClosingCash,
        ShiftName = s.ShiftName,
        OpenedByUserId = s.OpenedByUserId,
        ClosedByUserId = s.ClosedByUserId,
    };
}
