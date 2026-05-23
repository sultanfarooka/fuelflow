using FluentValidation;
using FuelFlow.Application.DTOs.Auth;

namespace FuelFlow.Application.Validators;

/// <summary>
/// Validates a phone-OTP verification submission ([M01-F09-R04]).
/// Structural checks only — business rules (TTL, attempts, daily cap) live in the handler.
/// </summary>
public class VerifyPhoneRequestValidator : AbstractValidator<VerifyPhoneRequest>
{
    public VerifyPhoneRequestValidator()
    {
        RuleFor(x => x.Phone)
            .NotEmpty().WithMessage("Phone number is required")
            .Matches(@"^\+92\d{10}$").WithMessage("Phone must be in Pakistani format: +92XXXXXXXXXX");

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Verification code is required")
            .Matches(@"^\d{4,8}$").WithMessage("Verification code must be numeric");
    }
}
