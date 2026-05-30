using FluentValidation;
using FuelFlow.Application.DTOs.Station;

namespace FuelFlow.Application.Validators;

public class UpdatePaymentMethodsRequestValidator : AbstractValidator<UpdatePaymentMethodsRequest>
{
    private static readonly HashSet<string> AllowedMethods = new(StringComparer.OrdinalIgnoreCase)
    {
        "Cash", "JazzCash", "Easypaisa", "Card/POS", "Bank Transfer"
    };

    public UpdatePaymentMethodsRequestValidator()
    {
        RuleFor(x => x.Methods)
            .NotEmpty().WithMessage("At least one payment method is required.")
            .Must(m => m.Contains("Cash", StringComparer.OrdinalIgnoreCase))
                .WithMessage("Cash must always be included as a payment method.")
            .Must(m => m.All(v => AllowedMethods.Contains(v)))
                .WithMessage("One or more payment methods are not recognized.");
    }
}
