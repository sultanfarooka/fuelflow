using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.StationShift;
using MediatR;

namespace FuelFlow.Application.Features.StationShift.Commands;

public record CloseShiftCommand(Guid StationId, Guid ShiftId, CloseShiftRequest Request) : IRequest<Result<StationShiftDto>>;
