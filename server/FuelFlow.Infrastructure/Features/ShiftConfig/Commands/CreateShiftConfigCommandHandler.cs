using System;
using MediatR;
using Microsoft.Extensions.Logging;
using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.ShiftConfig;
using FuelFlow.Application.Features.ShiftConfig.Commands;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Application.Interfaces.Services;
using FuelFlow.Domain.Entities.StationEntities;

namespace FuelFlow.Infrastructure.Features.ShiftConfig.Commands;

public class CreateShiftConfigCommandHandler : IRequestHandler<CreateShiftConfigCommand, Result<ShiftConfigDto>>
{
    private readonly ICurrentUserService _currentUser;
    private readonly IStationRepository _stationRepo;
    private readonly IStationShiftConfigRepository _configRepo;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<CreateShiftConfigCommandHandler> _logger;

    public CreateShiftConfigCommandHandler(
        ICurrentUserService currentUser,
        IStationRepository stationRepo,
        IStationShiftConfigRepository configRepo,
        IUnitOfWork unitOfWork,
        ILogger<CreateShiftConfigCommandHandler> logger)
    {
        _currentUser = currentUser;
        _stationRepo = stationRepo;
        _configRepo = configRepo;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Result<ShiftConfigDto>> Handle(CreateShiftConfigCommand request, CancellationToken ct)
    {
        var orgId = _currentUser.OrganizationId;
        if (orgId == null)
            return Result<ShiftConfigDto>.Failure("You must belong to an organization.");

        var station = await _stationRepo.GetByIdAsync(request.StationId, ct);
        if (station == null || station.OrganizationId != orgId)
            return Result<ShiftConfigDto>.Failure("Station not found or access denied.");

        var req = request.Request;

        if (!TimeSpan.TryParse(req.Shift1StartTime, out var shift1Start))
            return Result<ShiftConfigDto>.Failure("Shift 1 start time is not a valid time (HH:mm).");
        if (!TimeSpan.TryParse(req.Shift2StartTime, out var shift2Start))
            return Result<ShiftConfigDto>.Failure("Shift 2 start time is not a valid time (HH:mm).");

        TimeSpan? shift3Start = null;
        if (req.ShiftCount == 3)
        {
            if (string.IsNullOrWhiteSpace(req.Shift3StartTime) || !TimeSpan.TryParse(req.Shift3StartTime, out var s3))
                return Result<ShiftConfigDto>.Failure("Shift 3 start time is required and must be a valid time (HH:mm).");
            shift3Start = s3;
        }

        // Upsert: delete existing config if present
        await _configRepo.DeleteByStationIdAsync(request.StationId, ct);

        var config = new StationShiftConfig
        {
            StationId = request.StationId,
            ShiftCount = req.ShiftCount,
            Shift1Name = req.Shift1Name.Trim(),
            Shift1StartTime = shift1Start,
            Shift2Name = req.Shift2Name.Trim(),
            Shift2StartTime = shift2Start,
            Shift3Name = req.ShiftCount == 3 ? req.Shift3Name?.Trim() : null,
            Shift3StartTime = shift3Start,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        try
        {
            await _configRepo.AddAsync(config);
            await _unitOfWork.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to save shift config for station {StationId}", request.StationId);
            return Result<ShiftConfigDto>.Failure("Failed to save shift configuration.");
        }

        return Result<ShiftConfigDto>.Success(ToDto(config));
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
