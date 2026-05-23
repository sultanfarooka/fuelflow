using FluentValidation;
using FuelFlow.Application.DTOs.Auth;

namespace FuelFlow.Application.Validators;

/// <summary>
/// Validates a resend-OTP request ([M01-F09-R04]).
/// </summary>
public class ResendOtpRequestValidator : AbstractValidator<ResendOtpRequest>
{
    public ResendOtpRequestValidator()
    {
        RuleFor(x => x.Phone)
            .NotEmpty().WithMessage("Phone number is required")
            .Matches(@"^\+92\d{10}$").WithMessage("Phone must be in Pakistani format: +92XXXXXXXXXX");
    }
}
