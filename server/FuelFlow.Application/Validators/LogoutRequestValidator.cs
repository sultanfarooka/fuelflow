using FluentValidation;
using FuelFlow.Application.DTOs.Auth;

namespace FuelFlow.Application.Validators;

/// <summary>
/// Validates logout request. RefreshToken is optional when using HTTP-only cookies
/// (controller reads from cookie when body is empty). Logout is idempotent.
/// </summary>
public class LogoutRequestValidator : AbstractValidator<LogoutRequest>
{
    public LogoutRequestValidator()
    {
        // RefreshToken can be empty when using cookie auth — handler is idempotent
    }
}
