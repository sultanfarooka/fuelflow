using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.FuelNozzle;
using MediatR;

namespace FuelFlow.Application.Features.FuelNozzle.Commands;

public record CreateFuelNozzleCommand(Guid StationId, CreateFuelNozzleRequest Request) : IRequest<Result<FuelNozzleDto>>;
