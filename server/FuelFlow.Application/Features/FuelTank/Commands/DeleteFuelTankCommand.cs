using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.FuelTank;
using MediatR;

namespace FuelFlow.Application.Features.FuelTank.Commands;

public record DeleteFuelTankCommand(Guid StationId, Guid TankId) : IRequest<Result<DeleteFuelTankResponse>>;
