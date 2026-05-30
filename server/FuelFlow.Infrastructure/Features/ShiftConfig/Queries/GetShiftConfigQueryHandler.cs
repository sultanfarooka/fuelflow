using MediatR;
using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.ShiftConfig;
using FuelFlow.Application.Features.ShiftConfig.Queries;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Application.Interfaces.Services;
using FuelFlow.Domain.Entities.StationEntities;

namespace FuelFlow.Infrastructure.Features.ShiftConfig.Queries;

public class GetShiftConfigQueryHandler : IRequestHandler<GetShiftConfigQuery, Result<ShiftConfigDto?>>
{
    private readonly ICurrentUserService _currentUser;
    private readonly IStationRepository _stationRepo;
    private readonly IStationShiftConfigRepository _configRepo;

    public GetShiftConfigQueryHandler(
        ICurrentUserService currentUser,
        IStationRepository stationRepo,
        IStationShiftConfigRepository configRepo)
    {
        _currentUser = currentUser;
        _stationRepo = stationRepo;
        _configRepo = configRepo;
    }

    public async Task<Result<ShiftConfigDto?>> Handle(GetShiftConfigQuery request, CancellationToken ct)
    {
        var orgId = _currentUser.OrganizationId;
        if (orgId == null)
            return Result<ShiftConfigDto?>.Failure("You must belong to an organization.");

        var station = await _stationRepo.GetByIdAsync(request.StationId, ct);
        if (station == null || station.OrganizationId != orgId)
            return Result<ShiftConfigDto?>.Failure("Station not found or access denied.");

        var config = await _configRepo.GetByStationIdAsync(request.StationId, ct);
        if (config == null)
            return Result<ShiftConfigDto?>.Success(null);

        return Result<ShiftConfigDto?>.Success(ToDto(config));
    }

    private static ShiftConfigDto ToDto(StationShiftConfig c) => new()
    {
        Id = c.Id,
        StationId = c.StationId,
        ShiftCount = c.ShiftCount,
        Shift1Name = c.Shift1Name,
        Shift1StartTime = c.Shift1StartTime,
        Shift2Name = c.Shift2Name,
        Shift2StartTime = c.Shift2StartTime,
        Shift3Name = c.Shift3Name,
        Shift3StartTime = c.Shift3StartTime,
    };
}
