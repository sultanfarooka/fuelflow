using FluentValidation;
using FuelFlow.Application.DTOs.Auth;

namespace FuelFlow.Application.Validators;

/// <summary>
/// Validates the OTP-based password reset submission.
/// </summary>
public class ResetPasswordWithOtpRequestValidator : AbstractValidator<ResetPasswordWithOtpRequest>
{
    public ResetPasswordWithOtpRequestValidator()
    {
        RuleFor(x => x.Phone)
            .NotEmpty().WithMessage("Phone number is required")
            .Matches(@"^\+92\d{10}$").WithMessage("Phone must be in Pakistani format: +92XXXXXXXXXX");

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Verification code is required")
            .Matches(@"^\d{4,8}$").WithMessage("Verification code must be numeric");

        RuleFor(x => x.NewPassword)
            .NotEmpty().WithMessage("New password is required")
            .MinimumLength(6).WithMessage("Password must be at least 6 characters")
            .Matches(@"\d").WithMessage("Password must contain at least one number");
    }
}
