using MediatR;
using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.Auth;

namespace FuelFlow.Application.Features.Auth.Commands;

/// <summary>
/// CQRS Command: activate an invited sub-user — verify the signup OTP and set the
/// first password in one step ([M01-F05-R02], [M01-F09-R07]).
/// </summary>
public record ActivateAccountCommand(ActivateAccountRequest Request) : IRequest<Result<VerifyPhoneResponse>>;
