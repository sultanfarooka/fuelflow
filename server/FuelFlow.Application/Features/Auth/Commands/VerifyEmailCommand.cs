using MediatR;
using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.Auth;

namespace FuelFlow.Application.Features.Auth.Commands;

/// <summary>
/// CQRS Command: Verify email using token from verification link.
/// </summary>
public record VerifyEmailCommand(VerifyEmailRequest Request) : IRequest<Result<VerifyEmailResponse>>;
