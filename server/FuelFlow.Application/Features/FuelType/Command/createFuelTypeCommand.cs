using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.FuelType;
using MediatR;

namespace FuelFlow.Application.Features.FuelType.Command;

/// <summary>
/// CQRS Command: Create a custom fuel type for the given station (FuelType with StationId set). Station is identified by URL; request body has Name and Unit.
/// </summary>
public record CreateFuelTypeCommand(Guid StationId, CreateFuelTypeRequest Request) : IRequest<Result<CreateFuelTypeResponse>>;
