using FluentValidation;
using FuelFlow.Application.DTOs.Auth;

namespace FuelFlow.Application.Validators;

/// <summary>
/// Validates the registration request before it reaches the service layer.
/// 
/// WHY validate here (Application) and not in the Controller?
/// - Validation rules are business logic ("phone must be Pakistani format")
/// - They can be reused across different entry points (API, background job, etc.)
/// - FluentValidation gives us clear, readable rule definitions
/// 
/// From PRD:
/// - REG-001: Email must be unique (checked in service, not here — needs DB)
/// - REG-004: Phone validated for Pakistani format (+92XXXXXXXXXX)
/// - Password: minimum 6 characters, must include numbers
/// </summary>
public class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        // Owner info
        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Full name is required")
            .MaximumLength(200);

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required")
            .EmailAddress().WithMessage("Invalid email format");

        RuleFor(x => x.Phone)
            .NotEmpty().WithMessage("Phone number is required")
            .Matches(@"^\+92\d{10}$").WithMessage("Phone must be in Pakistani format: +92XXXXXXXXXX");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required")
            .MinimumLength(6).WithMessage("Password must be at least 6 characters")
            .Matches(@"\d").WithMessage("Password must contain at least one number");

        // Organization info
        RuleFor(x => x.OrganizationName)
            .NotEmpty().WithMessage("Organization name is required")
            .MaximumLength(200);
    }
}
