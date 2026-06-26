using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.FuelNozzle;
using MediatR;

namespace FuelFlow.Application.Features.FuelNozzle.Commands;

/// <summary>
/// M08-F03: Toggles a nozzle's IsActive flag. Soft-deactivate is intentionally
/// not blocked by shift assignments — the toggle exists so a nozzle under
/// maintenance can be hidden from new shifts.
/// </summary>
public record SetFuelNozzleActiveCommand(Guid StationId, Guid NozzleId, SetFuelNozzleActiveRequest Request) : IRequest<Result<SetFuelNozzleActiveResponse>>;
