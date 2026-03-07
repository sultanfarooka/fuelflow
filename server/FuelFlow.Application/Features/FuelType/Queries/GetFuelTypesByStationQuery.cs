using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.FuelType;
using MediatR;

namespace FuelFlow.Application.Features.FuelType.Queries;

/// <summary>
/// CQRS Query: Get fuel types available for a station — from the station's OMC (OMCFuelTypes) and custom types (FuelType with StationId).
/// Caller must have access to the station (same organization).
/// </summary>
public record GetFuelTypesByStationQuery(Guid StationId) : IRequest<Result<List<FuelTypeDto>>>;
