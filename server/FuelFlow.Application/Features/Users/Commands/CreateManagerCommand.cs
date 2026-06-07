using MediatR;
using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.Users;

namespace FuelFlow.Application.Features.Users.Commands;

/// <summary>
/// CQRS Command: Owner creates a Manager user for their organization ([M01-F05-R02]).
/// </summary>
public record CreateManagerCommand(CreateManagerRequest Request) : IRequest<Result<CreateManagerResponse>>;
