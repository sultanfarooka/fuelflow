using MediatR;
using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.Auth;

namespace FuelFlow.Application.Features.Auth.Commands;

/// <summary>
/// CQRS Command: complete password reset via SMS OTP ([M01-F09-R08], [M01-F04-R04]).
/// </summary>
public record ResetPasswordWithOtpCommand(ResetPasswordWithOtpRequest Request) : IRequest<Result<VerifyPhoneResponse>>;
