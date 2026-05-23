using FluentValidation;
using FuelFlow.Application.DTOs.Auth;

namespace FuelFlow.Application.Validators;

/// <summary>
/// Validates the request-phone-change step ([M01-F09-R11]).
/// </summary>
public class RequestPhoneChangeRequestValidator : AbstractValidator<RequestPhoneChangeRequest>
{
    public RequestPhoneChangeRequestValidator()
    {
        RuleFor(x => x.NewPhone)
            .NotEmpty().WithMessage("New phone number is required")
            .Matches(@"^\+92\d{10}$").WithMessage("Phone must be in Pakistani format: +92XXXXXXXXXX");
    }
}
