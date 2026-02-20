using FluentValidation;
using FuelFlow.Application.DTOs.Auth;

namespace FuelFlow.Application.Validators;

/// <summary>
/// Validates logout request.
/// </summary>
public class LogoutRequestValidator : AbstractValidator<LogoutRequest>
{
    public LogoutRequestValidator()
    {
        RuleFor(x => x.RefreshToken)
            .NotEmpty().WithMessage("Refresh token is required");
    }
}
