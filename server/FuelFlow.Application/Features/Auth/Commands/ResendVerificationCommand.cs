using MediatR;
using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.Auth;

namespace FuelFlow.Application.Features.Auth.Commands;

/// <summary>
/// CQRS Command: Resend verification email.
/// Returns generic message for security (don't reveal if email exists).
/// </summary>
public record ResendVerificationCommand(ResendVerificationRequest Request) : IRequest<Result<ResendVerificationResponse>>;
