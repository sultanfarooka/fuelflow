using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.FuelPrices;
using MediatR;

namespace FuelFlow.Application.Features.FuelPrices.Commands;

public record SetFuelPriceCommand(Guid StationId, SetFuelPriceRequest Request) : IRequest<Result<FuelPricesDto>>;
