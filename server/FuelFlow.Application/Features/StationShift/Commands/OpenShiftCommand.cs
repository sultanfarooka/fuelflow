using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.StationShift;
using MediatR;

namespace FuelFlow.Application.Features.StationShift.Commands;

public record OpenShiftCommand(Guid StationId, OpenShiftRequest Request) : IRequest<Result<StationShiftDto>>;
