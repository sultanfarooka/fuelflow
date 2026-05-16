using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.FuelTank;
using MediatR;

namespace FuelFlow.Application.Features.FuelTank.Commands;

public record UpdateFuelTankCommand(Guid StationId, Guid TankId, UpdateFuelTankRequest Request) : IRequest<Result<FuelTankDto>>;
