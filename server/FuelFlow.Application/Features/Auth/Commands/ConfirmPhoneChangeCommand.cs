using MediatR;
using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.Auth;

namespace FuelFlow.Application.Features.Auth.Commands;

/// <summary>
/// CQRS Command: confirm a phone-number change ([M01-F09-R11]).
/// On valid OTP: swaps <c>user.PhoneNumber</c> to the requested new number.
/// </summary>
public record ConfirmPhoneChangeCommand(ConfirmPhoneChangeRequest Request) : IRequest<Result<VerifyPhoneResponse>>;
