using MediatR;
using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.StationShift;
using FuelFlow.Application.Features.StationShift.Commands;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Application.Interfaces.Services;
using FuelFlow.Domain.Enums;

namespace FuelFlow.Infrastructure.Features.StationShift.Commands;

public class CloseShiftCommandHandler : IRequestHandler<CloseShiftCommand, Result<StationShiftDto>>
{
    private readonly ICurrentUserService _currentUser;
    private readonly IStationRepository _stationRepo;
    private readonly IStationShiftRepository _shiftRepo;
    private readonly IUnitOfWork _unitOfWork;

    public CloseShiftCommandHandler(
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

    public async Task<Result<StationShiftDto>> Handle(CloseShiftCommand request, CancellationToken cancellationToken)
    {
        var orgId = _currentUser.OrganizationId;
        var userId = _currentUser.UserId;
        if (orgId == null || userId == null)
            return Result<StationShiftDto>.Failure("You must be signed in and belong to an organization.");

        var station = await _stationRepo.GetByIdAsync(request.StationId, cancellationToken);
        if (station == null)
            return Result<StationShiftDto>.Failure("Station not found.");
        if (station.OrganizationId != orgId)
            return Result<StationShiftDto>.Failure("You do not have access to this station.");

        var shift = await _shiftRepo.GetByIdAsync(request.ShiftId, cancellationToken);
        if (shift == null)
            return Result<StationShiftDto>.Failure("Shift not found.");
        if (shift.StationId != request.StationId)
            return Result<StationShiftDto>.Failure("Shift does not belong to this station.");
        if (shift.Status == ShiftStatus.Closed)
            return Result<StationShiftDto>.Failure("Shift is already closed.");

        var now = DateTime.UtcNow;
        shift.Status = ShiftStatus.Closed;
        shift.ClosedAt = now;
        shift.ClosingCash = request.Request.ClosingCash;
        shift.ClosedByUserId = userId;
        shift.UpdatedAt = now;

        _shiftRepo.Update(shift);
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
