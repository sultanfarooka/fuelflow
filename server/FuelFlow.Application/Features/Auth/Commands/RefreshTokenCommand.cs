using MediatR;
using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.Auth;

namespace FuelFlow.Application.Features.Auth.Commands;

/// <summary>
/// CQRS Command: Exchange a valid refresh token for new access + refresh tokens.
/// Implements token rotation — the old refresh token is revoked and replaced.
/// </summary>
public record RefreshTokenCommand(RefreshTokenRequest Request) : IRequest<Result<AuthResponse>>;
