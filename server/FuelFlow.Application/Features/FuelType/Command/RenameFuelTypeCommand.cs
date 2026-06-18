using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.FuelType;
using MediatR;

namespace FuelFlow.Application.Features.FuelType.Command;

/// <summary>
/// [M08-F08-R03] CQRS Command: rename a fuel type's display name for a station.
/// Station + fuel type identified by URL; request body carries the new Name.
/// </summary>
public record RenameFuelTypeCommand(Guid StationId, Guid FuelTypeId, RenameFuelTypeRequest Request)
    : IRequest<Result<bool>>;
