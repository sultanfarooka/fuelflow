using MediatR;
using Microsoft.Extensions.Logging;
using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.FuelTank;
using FuelFlow.Application.Features.FuelTank.Commands;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Application.Interfaces.Services;
using FuelFlow.Domain.Entities;
using FuelTankEntity = FuelFlow.Domain.Entities.FuelTank;

namespace FuelFlow.Infrastructure.Features.FuelTank.Commands;

/// <summary>
/// Creates a fuel tank for a station. Validates station belongs to user's org and FuelType exists.
/// </summary>
public class CreateFuelTankCommandHandler : IRequestHandler<CreateFuelTankCommand, Result<CreateFuelTankResponse>>
{
    private readonly ICurrentUserService _currentUser;
    private readonly IStationRepository _stationRepo;
    private readonly IFuelTypeRepository _fuelTypeRepo;
    private readonly IFuelTankRepository _fuelTankRepo;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<CreateFuelTankCommandHandler> _logger;

    public CreateFuelTankCommandHandler(
        ICurrentUserService currentUser,
        IStationRepository stationRepo,
        IFuelTypeRepository fuelTypeRepo,
        IFuelTankRepository fuelTankRepo,
        IUnitOfWork unitOfWork,
        ILogger<CreateFuelTankCommandHandler> logger)
    {
        _currentUser = currentUser;
        _stationRepo = stationRepo;
        _fuelTypeRepo = fuelTypeRepo;
        _fuelTankRepo = fuelTankRepo;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Result<CreateFuelTankResponse>> Handle(
        CreateFuelTankCommand request,
        CancellationToken cancellationToken)
    {
        var orgId = _currentUser.OrganizationId;
        if (orgId == null)
            return Result<CreateFuelTankResponse>.Failure("You must belong to an organization to add a fuel tank.");

        var station = await _stationRepo.GetByIdAsync(request.StationId, cancellationToken);
        if (station == null)
            return Result<CreateFuelTankResponse>.Failure("Station not found.");

        if (station.OrganizationId != orgId)
            return Result<CreateFuelTankResponse>.Failure("You do not have access to this station.");

        var fuelType = await _fuelTypeRepo.GetByIdAsync(request.Request.FuelTypeId, cancellationToken);
        if (fuelType == null)
            return Result<CreateFuelTankResponse>.Failure("Fuel type not found.");

        if (fuelType.StationId != request.StationId)
            return Result<CreateFuelTankResponse>.Failure("Fuel type does not belong to this station.");

        // Ensure no other tank at this station uses the same name (case-insensitive)
        if (!string.IsNullOrWhiteSpace(request.Request.Name))
        {
            var normalizedName = request.Request.Name.Trim().ToLowerInvariant();
            var existingNamedTank = (await _fuelTankRepo.GetAllByStationIdAsync(request.StationId, cancellationToken))
                .FirstOrDefault(t =>
                    t.Name != null
                    && t.Name.ToLowerInvariant() == normalizedName);
            if (existingNamedTank != null)
                return Result<CreateFuelTankResponse>.Failure("A tank with this name already exists at this station.");
        }

        var newFuelTank = new FuelTankEntity
        {
            Name = string.IsNullOrWhiteSpace(request.Request.Name) ? null : request.Request.Name.Trim(),
            CapacityLiters = request.Request.CapacityLiters,
            FuelTypeId = request.Request.FuelTypeId,
            StationId = request.StationId,
        };

        try
        {
            await _fuelTankRepo.AddAsync(newFuelTank);
            await _unitOfWork.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to add fuel tank for station {StationId}", request.StationId);
            return Result<CreateFuelTankResponse>.Failure("Failed to save fuel tank in the database.");
        }

        return Result<CreateFuelTankResponse>.Success(new CreateFuelTankResponse
        {
            Id = newFuelTank.Id,
            Name = newFuelTank.Name,
            CapacityLiters = newFuelTank.CapacityLiters,
            FuelTypeId = newFuelTank.FuelTypeId,
            FuelTypeName = fuelType.Name,
        });
    }
}
