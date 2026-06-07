using MediatR;
using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.Users;

namespace FuelFlow.Application.Features.Users.Queries;

/// <summary>
/// CQRS Query: list the Manager users in the current Owner's organization ([M01-F05-R02]).
/// The organization is resolved from the authenticated caller — never a client param.
/// </summary>
public record GetManagersQuery() : IRequest<Result<List<ManagerListItemDto>>>;
