using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.FuelTank;
using MediatR;

namespace FuelFlow.Application.Features.FuelTank.Commands;

/// <summary>
/// CQRS Command: Create a fuel tank for a station. Caller must have access to the station (org).
/// </summary>
public record CreateFuelTankCommand(Guid StationId, CreateFuelTankRequest Request) : IRequest<Result<CreateFuelTankResponse>>;
