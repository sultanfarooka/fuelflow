using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.FuelType;
using MediatR;

namespace FuelFlow.Application.Features.FuelType.Command;

/// <summary>
/// [M08-F08-R04/R05] CQRS Command: activate or deactivate a fuel type for a
/// station. Deactivation is blocked while the type is referenced by a tank or an
/// active price (the response carries the block + reasons; the controller maps a
/// block to HTTP 409).
/// </summary>
public record SetFuelTypeActiveCommand(Guid StationId, Guid FuelTypeId, SetFuelTypeActiveRequest Request)
    : IRequest<Result<SetFuelTypeActiveResponse>>;
