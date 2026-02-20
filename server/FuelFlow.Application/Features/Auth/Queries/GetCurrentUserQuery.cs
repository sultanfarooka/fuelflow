using MediatR;
using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.Auth;

namespace FuelFlow.Application.Features.Auth.Queries;

/// <summary>
/// CQRS Query: Get the current authenticated user's profile.
/// UserId comes from JWT claim — no DTO needed.
/// </summary>
public record GetCurrentUserQuery(Guid UserId) : IRequest<Result<AuthResponse>>;
