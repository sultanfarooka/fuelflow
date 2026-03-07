using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.ShiftAssignment;
using MediatR;

namespace FuelFlow.Application.Features.ShiftAssignment.Queries;

public record GetShiftAssignmentsByShiftQuery(Guid StationId, Guid ShiftId) : IRequest<Result<List<ShiftAssignmentDto>>>;
