using FluentValidation;
using FuelFlow.Application.DTOs.Auth;

namespace FuelFlow.Application.Validators;

/// <summary>
/// Validates forgot password request.
/// </summary>
public class ForgotPasswordRequestValidator : AbstractValidator<ForgotPasswordRequest>
{
    public ForgotPasswordRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required")
            .EmailAddress().WithMessage("Invalid email format");
    }
}
