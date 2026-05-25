using MediatR;
using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.Auth;

namespace FuelFlow.Application.Features.Auth.Commands;

/// <summary>
/// CQRS Command: verify a phone OTP ([M01-F09-R03], [M01-F09-R04]).
/// On success the user's <c>PhoneNumberConfirmed</c> flips to true and login is unblocked.
/// </summary>
public record VerifyPhoneCommand(VerifyPhoneRequest Request) : IRequest<Result<VerifyPhoneResponse>>;
