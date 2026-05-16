using FuelFlow.Application.Common;
using MediatR;

namespace FuelFlow.Application.Features.FuelTank.Commands;

public record DeleteFuelTankCommand(Guid StationId, Guid TankId) : IRequest<Result<bool>>;
