using MediatR;
using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.StationShift;
using FuelFlow.Application.Features.StationShift.Commands;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Application.Interfaces.Services;
using FuelFlow.Domain.Enums;

namespace FuelFlow.Infrastructure.Features.StationShift.Commands;

public class OpenShiftCommandHandler : IRequestHandler<OpenShiftCommand, Result<StationShiftDto>>
{
    private readonly ICurrentUserService _currentUser;
    private readonly IStationRepository _stationRepo;
    private readonly IStationShiftRepository _shiftRepo;
    private readonly IUnitOfWork _unitOfWork;

    public OpenShiftCommandHandler(
        ICurrentUserService currentUser,
        IStationRepository stationRepo,
        IStationShiftRepository shiftRepo,
        IUnitOfWork unitOfWork)
    {
        _currentUser = currentUser;
        _stationRepo = stationRepo;
        _shiftRepo = shiftRepo;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<StationShiftDto>> Handle(OpenShiftCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId;
        var orgId = _currentUser.OrganizationId;

        if (orgId == null)
            return Result<StationShiftDto>.Failure("You must be signed in and belong to an organization.");

        var station = await _stationRepo.GetByIdAsync(request.StationId, cancellationToken);
        if (station == null)
            return Result<StationShiftDto>.Failure("Station not found.");
        if (station.OrganizationId != orgId)
            return Result<StationShiftDto>.Failure("You do not have access to this station.");

        var existingOpen = await _shiftRepo.GetOpenShiftByStationIdAsync(request.StationId, cancellationToken);
        if (existingOpen != null)
            return Result<StationShiftDto>.Failure("A shift is already open for this station. Close it first.");

        var now = DateTime.UtcNow;
        var shift = new Domain.Entities.StationShift
        {
            StationId = request.StationId,
            Status = ShiftStatus.Open,
            OpenedAt = now,
            ClosedAt = null,
            OpeningCash = request.Request.OpeningCash,
            ClosingCash = null,
            ShiftName = string.IsNullOrWhiteSpace(request.Request.ShiftName) ? null : request.Request.ShiftName.Trim(),
            OpenedByUserId = userId.Value,
            ClosedByUserId = null,
            TotalCash = 0,
            TotalSales = 0,
            TotalCreditSales = 0,
            TotalCardSales = 0,
            TotalDigitalSales = 0,
            TotalExpenses = 0,
            CreatedAt = now,
            UpdatedAt = now,
        };
        await _shiftRepo.AddAsync(shift);
        await _unitOfWork.SaveChangesAsync();

        return Result<StationShiftDto>.Success(new StationShiftDto
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
        });
    }
}
