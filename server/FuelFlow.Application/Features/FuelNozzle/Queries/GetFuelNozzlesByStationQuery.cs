using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.FuelNozzle;
using MediatR;

namespace FuelFlow.Application.Features.FuelNozzle.Queries;

public record GetFuelNozzlesByStationQuery(Guid StationId) : IRequest<Result<List<FuelNozzleDto>>>;
