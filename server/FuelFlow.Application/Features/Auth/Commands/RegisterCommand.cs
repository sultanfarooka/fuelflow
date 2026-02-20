using MediatR;
using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.Auth;

namespace FuelFlow.Application.Features.Auth.Commands;

/// <summary>
/// CQRS Command: Register a new owner with organization and first station.
/// Wraps RegisterRequest DTO to avoid property duplication and reuse existing validators.
/// </summary>
public record RegisterCommand(RegisterRequest Request) : IRequest<Result<RegisterResponse>>;
