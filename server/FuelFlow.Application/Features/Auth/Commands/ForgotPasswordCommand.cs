using MediatR;
using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.Auth;

namespace FuelFlow.Application.Features.Auth.Commands;

/// <summary>
/// CQRS Command: Request password reset email.
/// Always returns generic success for security (don't reveal if email exists).
/// </summary>
public record ForgotPasswordCommand(ForgotPasswordRequest Request) : IRequest<Result<ForgotPasswordResponse>>;
