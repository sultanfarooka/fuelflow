using MediatR;
using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.Auth;

namespace FuelFlow.Application.Features.Auth.Commands;

/// <summary>
/// CQRS Command: re-issue the phone OTP for an existing pending verification ([M01-F09-R04]).
/// Enforces 60-second cooldown and daily cap ([M01-F09-R12]).
/// </summary>
public record ResendOtpCommand(ResendOtpRequest Request) : IRequest<Result<VerifyPhoneResponse>>;
