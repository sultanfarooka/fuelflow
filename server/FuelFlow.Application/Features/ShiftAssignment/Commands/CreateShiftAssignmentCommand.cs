using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.ShiftAssignment;
using MediatR;

namespace FuelFlow.Application.Features.ShiftAssignment.Commands;

public record CreateShiftAssignmentCommand(Guid StationId, Guid ShiftId, CreateShiftAssignmentRequest Request) : IRequest<Result<ShiftAssignmentDto>>;
