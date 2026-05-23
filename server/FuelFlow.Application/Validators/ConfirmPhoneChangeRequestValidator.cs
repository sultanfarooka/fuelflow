using FluentValidation;
using FuelFlow.Application.DTOs.Auth;

namespace FuelFlow.Application.Validators;

/// <summary>
/// Validates the confirm-phone-change step ([M01-F09-R11]).
/// </summary>
public class ConfirmPhoneChangeRequestValidator : AbstractValidator<ConfirmPhoneChangeRequest>
{
    public ConfirmPhoneChangeRequestValidator()
    {
        RuleFor(x => x.NewPhone)
            .NotEmpty().WithMessage("New phone number is required")
            .Matches(@"^\+92\d{10}$").WithMessage("Phone must be in Pakistani format: +92XXXXXXXXXX");

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Verification code is required")
            .Matches(@"^\d{4,8}$").WithMessage("Verification code must be numeric");
    }
}
