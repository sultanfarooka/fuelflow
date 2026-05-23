using FluentValidation;
using FuelFlow.Application.DTOs.Auth;

namespace FuelFlow.Application.Validators;

/// <summary>
/// Validates the registration request before it reaches the handler.
///
/// Phone-first per [M01-F09]:
///   - Phone is required and must match the Pakistani format.
///   - Email is optional; when provided, must look like a real email.
///   - Email uniqueness is enforced in the handler (needs the DB).
/// Password rules: min 6 chars, must include at least one digit.
/// </summary>
public class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        // Owner info
        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Full name is required")
            .MaximumLength(200);

        // Email is optional; validate format only when supplied.
        RuleFor(x => x.Email!)
            .EmailAddress().WithMessage("Invalid email format")
            .When(x => !string.IsNullOrWhiteSpace(x.Email));

        RuleFor(x => x.Phone)
            .NotEmpty().WithMessage("Phone number is required")
            .Matches(@"^\+92\d{10}$").WithMessage("Phone must be in Pakistani format: +92XXXXXXXXXX");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required")
            .MinimumLength(6).WithMessage("Password must be at least 6 characters")
            .Matches(@"\d").WithMessage("Password must contain at least one number");
    }
}
