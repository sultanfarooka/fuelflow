using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.Station;
using MediatR;

namespace FuelFlow.Application.Features.Station.Commands;

/// <summary>
/// CQRS Command: Create a new station for the current user's organization.
/// Owner only; enforces subscription plan max_stations limit.
/// </summary>
public record CreateStationCommand(CreateStationRequest Request) : IRequest<Result<CreateStationResponse>>;
