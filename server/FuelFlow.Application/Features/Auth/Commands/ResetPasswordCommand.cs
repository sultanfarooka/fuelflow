using MediatR;
using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.Auth;

namespace FuelFlow.Application.Features.Auth.Commands;

/// <summary>
/// CQRS Command: Reset password using token from reset link.
/// </summary>
public record ResetPasswordCommand(ResetPasswordRequest Request) : IRequest<Result<ResetPasswordResponse>>;
