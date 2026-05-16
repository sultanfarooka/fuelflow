using MediatR;
using Microsoft.Extensions.Logging;
using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.DipChart;
using FuelFlow.Application.Features.DipChart.Commands;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Application.Interfaces.Services;
using DipChartEntity = FuelFlow.Domain.Entities.DipChart;
using FuelFlow.Domain.Entities;

namespace FuelFlow.Infrastructure.Features.DipChart.Commands;

public class UploadDipChartCommandHandler
    : IRequestHandler<UploadDipChartCommand, Result<DipChartDto>>
{
    private readonly ICurrentUserService _currentUser;
    private readonly IStationRepository _stationRepo;
    private readonly IFuelTankRepository _fuelTankRepo;
    private readonly IDipChartRepository _dipChartRepo;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<UploadDipChartCommandHandler> _logger;

    public UploadDipChartCommandHandler(
        ICurrentUserService currentUser,
        IStationRepository stationRepo,
        IFuelTankRepository fuelTankRepo,
        IDipChartRepository dipChartRepo,
        IUnitOfWork unitOfWork,
        ILogger<UploadDipChartCommandHandler> logger)
    {
        _currentUser = currentUser;
        _stationRepo = stationRepo;
        _fuelTankRepo = fuelTankRepo;
        _dipChartRepo = dipChartRepo;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Result<DipChartDto>> Handle(
        UploadDipChartCommand request,
        CancellationToken cancellationToken)
    {
        var orgId = _currentUser.OrganizationId;
        if (orgId == null)
            return Result<DipChartDto>.Failure("You must belong to an organization.");

        var station = await _stationRepo.GetByIdAsync(request.StationId, cancellationToken);
        if (station == null)
            return Result<DipChartDto>.Failure("Station not found.");
        if (station.OrganizationId != orgId)
            return Result<DipChartDto>.Failure("You do not have access to this station.");

        var tank = await _fuelTankRepo.GetByIdAsync(request.TankId, cancellationToken);
        if (tank == null || tank.StationId != request.StationId)
            return Result<DipChartDto>.Failure("Tank not found in this station.");

        if (request.Request.Entries.Count == 0)
            return Result<DipChartDto>.Failure("Dip chart must have at least one entry.");

        // Remove existing dip chart if re-uploading
        await _dipChartRepo.DeleteByTankIdAsync(request.TankId, cancellationToken);

        var now = DateTime.UtcNow;
        var chart = new DipChartEntity
        {
            TankId = request.TankId,
            CreatedAt = now,
            UpdatedAt = now,
            Entries = request.Request.Entries.Select(e => new DipChartEntry
            {
                DepthCm = e.DepthCm,
                VolumeLiters = e.VolumeLiters,
                CreatedAt = now,
                UpdatedAt = now,
            }).ToList(),
        };

        try
        {
            await _dipChartRepo.AddAsync(chart);
            await _unitOfWork.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to save dip chart for tank {TankId}", request.TankId);
            return Result<DipChartDto>.Failure("Failed to save dip chart.");
        }

        return Result<DipChartDto>.Success(new DipChartDto
        {
            Id = chart.Id,
            TankId = chart.TankId,
            EntryCount = chart.Entries.Count,
            Entries = chart.Entries.Select(e => new DipChartEntryDto
            {
                Id = e.Id,
                DepthCm = e.DepthCm,
                VolumeLiters = e.VolumeLiters,
            }).ToList(),
        });
    }
}
