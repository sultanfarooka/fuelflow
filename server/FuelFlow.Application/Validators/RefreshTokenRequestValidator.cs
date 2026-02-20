using FluentValidation;
using FuelFlow.Application.DTOs.Auth;

namespace FuelFlow.Application.Validators;

/// <summary>
/// Validates refresh token request — ensures the token string is provided.
/// </summary>
public class RefreshTokenRequestValidator : AbstractValidator<RefreshTokenRequest>
{
    public RefreshTokenRequestValidator()
    {
        RuleFor(x => x.RefreshToken)
            .NotEmpty().WithMessage("Refresh token is required.");
    }
}
