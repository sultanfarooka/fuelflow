using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.FuelNozzle;
using MediatR;

namespace FuelFlow.Application.Features.FuelNozzle.Commands;

/// <summary>
/// M08-F03: Updates a nozzle's number and/or tank assignment. Does NOT
/// touch IsActive — that's the dedicated SetFuelNozzleActiveCommand.
/// </summary>
public record UpdateFuelNozzleCommand(Guid StationId, Guid NozzleId, UpdateFuelNozzleRequest Request) : IRequest<Result<FuelNozzleDto>>;
