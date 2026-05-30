using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.ShiftConfig;
using MediatR;

namespace FuelFlow.Application.Features.ShiftConfig.Commands;

public record CreateShiftConfigCommand(Guid StationId, CreateShiftConfigRequest Request)
    : IRequest<Result<ShiftConfigDto>>;
