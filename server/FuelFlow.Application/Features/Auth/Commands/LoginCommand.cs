using MediatR;
using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.Auth;

namespace FuelFlow.Application.Features.Auth.Commands;

/// <summary>
/// CQRS Command: Authenticate user with email/password.
/// Wraps LoginRequest DTO to avoid property duplication and reuse existing validators.
/// </summary>
public record LoginCommand(LoginRequest Request) : IRequest<Result<AuthResponse>>;
