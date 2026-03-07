using MediatR;
using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.ShiftAssignment;
using FuelFlow.Application.Features.ShiftAssignment.Commands;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Application.Interfaces.Services;
namespace FuelFlow.Infrastructure.Features.ShiftAssignment.Commands;

public class CreateShiftAssignmentCommandHandler : IRequestHandler<CreateShiftAssignmentCommand, Result<ShiftAssignmentDto>>
{
    private readonly ICurrentUserService _currentUser;
    private readonly IStationRepository _stationRepo;
    private readonly IStationShiftRepository _shiftRepo;
    private readonly IFuelNozzleRepository _fuelNozzleRepo;
    private readonly IShiftAssignmentRepository _assignmentRepo;
    private readonly IUnitOfWork _unitOfWork;

    public CreateShiftAssignmentCommandHandler(
        ICurrentUserService currentUser,
        IStationRepository stationRepo,
        IStationShiftRepository shiftRepo,
        IFuelNozzleRepository fuelNozzleRepo,
        IShiftAssignmentRepository assignmentRepo,
        IUnitOfWork unitOfWork)
    {
        _currentUser = currentUser;
        _stationRepo = stationRepo;
        _shiftRepo = shiftRepo;
        _fuelNozzleRepo = fuelNozzleRepo;
        _assignmentRepo = assignmentRepo;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<ShiftAssignmentDto>> Handle(CreateShiftAssignmentCommand request, CancellationToken cancellationToken)
    {
        var orgId = _currentUser.OrganizationId;
        if (orgId == null)
            return Result<ShiftAssignmentDto>.Failure("You must belong to an organization.");

        var station = await _stationRepo.GetByIdAsync(request.StationId, cancellationToken);
        if (station == null)
            return Result<ShiftAssignmentDto>.Failure("Station not found.");
        if (station.OrganizationId != orgId)
            return Result<ShiftAssignmentDto>.Failure("You do not have access to this station.");

        var shift = await _shiftRepo.GetByIdAsync(request.ShiftId, cancellationToken);
        if (shift == null)
            return Result<ShiftAssignmentDto>.Failure("Shift not found.");
        if (shift.StationId != request.StationId)
            return Result<ShiftAssignmentDto>.Failure("Shift does not belong to this station.");

        var nozzle = await _fuelNozzleRepo.GetByIdAsync(request.Request.FuelNozzleId, cancellationToken);
        if (nozzle == null)
            return Result<ShiftAssignmentDto>.Failure("Fuel nozzle not found.");
        if (nozzle.StationId != request.StationId)
            return Result<ShiftAssignmentDto>.Failure("Nozzle does not belong to this station.");

        var now = DateTime.UtcNow;
        var assignment = new Domain.Entities.ShiftAssignment
        {
            StationShiftId = request.ShiftId,
            FuelNozzleId = request.Request.FuelNozzleId,
            UserId = request.Request.UserId,
            CreatedAt = now,
            UpdatedAt = now,
        };
        await _assignmentRepo.AddAsync(assignment);
        await _unitOfWork.SaveChangesAsync();

        return Result<ShiftAssignmentDto>.Success(new ShiftAssignmentDto
        {
            Id = assignment.Id,
            StationShiftId = assignment.StationShiftId,
            FuelNozzleId = assignment.FuelNozzleId,
            NozzleNumber = nozzle.NozzleNumber,
            UserId = assignment.UserId,
        });
    }
}
