using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.FuelPrices;
using MediatR;

namespace FuelFlow.Application.Features.FuelPrices.Queries;

public record GetFuelPricesByStationQuery(Guid StationId) : IRequest<Result<List<FuelPricesDto>>>;
