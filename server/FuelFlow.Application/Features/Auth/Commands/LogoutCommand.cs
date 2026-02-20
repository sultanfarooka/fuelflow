using MediatR;
using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.Auth;

namespace FuelFlow.Application.Features.Auth.Commands;

/// <summary>
/// CQRS Command: Logout — revoke the refresh token.
/// </summary>
public record LogoutCommand(LogoutRequest Request) : IRequest<Result<LogoutResponse>>;
