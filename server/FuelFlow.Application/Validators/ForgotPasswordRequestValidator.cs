using FluentValidation;
using FuelFlow.Application.DTOs.Auth;

namespace FuelFlow.Application.Validators;

/// <summary>
/// Validates the forgot-password submission. Identifier non-empty; channel
/// (when supplied) must be <c>sms</c> or <c>email</c>. Phone/email format is
/// resolved in the handler.
/// </summary>
public class ForgotPasswordRequestValidator : AbstractValidator<ForgotPasswordRequest>
{
    public ForgotPasswordRequestValidator()
    {
        RuleFor(x => x.Identifier)
            .NotEmpty().WithMessage("Phone or email is required");

        RuleFor(x => x.Channel!)
            .Must(c => c == "sms" || c == "email")
            .WithMessage("Channel must be 'sms' or 'email'")
            .When(x => !string.IsNullOrEmpty(x.Channel));
    }
}
