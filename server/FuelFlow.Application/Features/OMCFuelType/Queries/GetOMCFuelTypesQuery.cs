using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.OMCFuelType;
using MediatR;

namespace FuelFlow.Application.Features.OMCFuelType.Queries;

/// <summary>
/// Query to get OMC fuel types, optionally filtered by OMC.
/// </summary>
public record GetOMCFuelTypesQuery(Guid? OMCId = null) : IRequest<Result<IReadOnlyList<OMCFuelTypeDto>>>;
