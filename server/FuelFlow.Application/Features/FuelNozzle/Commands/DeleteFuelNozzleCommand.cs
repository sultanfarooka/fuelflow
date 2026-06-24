using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.FuelNozzle;
using MediatR;

namespace FuelFlow.Application.Features.FuelNozzle.Commands;

public record DeleteFuelNozzleCommand(Guid StationId, Guid NozzleId) : IRequest<Result<DeleteFuelNozzleResponse>>;

