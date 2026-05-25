using MediatR;
using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.Auth;

namespace FuelFlow.Application.Features.Auth.Commands;

/// <summary>
/// CQRS Command: request a phone-number change ([M01-F09-R11]).
/// Issues an OTP to the new phone but does NOT swap the user record yet.
/// </summary>
public record RequestPhoneChangeCommand(RequestPhoneChangeRequest Request) : IRequest<Result<VerifyPhoneResponse>>;
