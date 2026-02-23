using FluentValidation;
using FuelFlow.Application.DTOs.Auth;

namespace FuelFlow.Application.Validators;

/// <summary>
/// Validates refresh token request. RefreshToken is optional when using HTTP-only cookies
/// (controller reads from cookie when body is empty). Handler enforces presence.
/// </summary>
public class RefreshTokenRequestValidator : AbstractValidator<RefreshTokenRequest>
{
    public RefreshTokenRequestValidator()
    {
        // RefreshToken can be empty when using cookie auth — handler validates
    }
}
