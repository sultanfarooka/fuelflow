using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.Station;
using MediatR;

namespace FuelFlow.Application.Features.Station.Commands;

public record UpdatePaymentMethodsCommand(Guid StationId, UpdatePaymentMethodsRequest Request)
    : IRequest<Result<StationDto>>;
