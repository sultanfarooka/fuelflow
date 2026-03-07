using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.FuelTank;
using MediatR;

namespace FuelFlow.Application.Features.FuelTank.Queries;

/// <summary>
/// CQRS Query: Get all fuel tanks for a station. Caller must have access to the station (org).
/// </summary>
public record GetFuelTanksByStationQuery(Guid StationId) : IRequest<Result<List<FuelTankDto>>>;
