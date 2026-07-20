using FluentValidation;
using FuelFlow.Application.DTOs.FinancialEntry;

namespace FuelFlow.Application.Validators;

public class AdjustFinancialEntryRequestValidator : AbstractValidator<AdjustFinancialEntryRequest>
{
    public AdjustFinancialEntryRequestValidator()
    {
        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Reason is required.")
            .MaximumLength(500).WithMessage("Reason must not exceed 500 characters.");

        RuleFor(x => x.CorrectedAmount)
            .NotEqual(0).WithMessage("Corrected amount must not be zero.");
    }
}
