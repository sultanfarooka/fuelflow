using FluentValidation;
using FuelFlow.Application.DTOs.Auth;

namespace FuelFlow.Application.Validators;

/// <summary>
/// Validates login request. Simple — just ensure both fields are provided.
/// The actual password verification happens in Identity (Infrastructure layer).
/// </summary>
public class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required")
            .EmailAddress().WithMessage("Invalid email format");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required");
    }
}
