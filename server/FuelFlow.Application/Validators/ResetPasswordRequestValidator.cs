using FluentValidation;
using FuelFlow.Application.DTOs.Auth;

namespace FuelFlow.Application.Validators;

/// <summary>
/// Validates reset password request.
/// Password rules match PRD: min 6 chars, must include number.
/// </summary>
public class ResetPasswordRequestValidator : AbstractValidator<ResetPasswordRequest>
{
    public ResetPasswordRequestValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("User ID is required");

        RuleFor(x => x.Token)
            .NotEmpty().WithMessage("Token is required");

        RuleFor(x => x.NewPassword)
            .NotEmpty().WithMessage("Password is required")
            .MinimumLength(6).WithMessage("Password must be at least 6 characters")
            .Matches(@"\d").WithMessage("Password must contain at least one number");
    }
}
