using FuelFlow.Application.Common;
using MediatR;

namespace FuelFlow.Application.Features.FuelType.Command;

/// <summary>
/// CQRS Command: Delete a fuel type from a station.
/// Only fuel types that belong to this station can be deleted.
/// </summary>
public record DeleteFuelTypeCommand(Guid StationId, Guid FuelTypeId) : IRequest<Result<bool>>;
