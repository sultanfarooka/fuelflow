using FluentValidation;
using FuelFlow.Application.DTOs.FuelType;

namespace FuelFlow.Application.Validators;

/// <summary>
/// [M08-F08-R03] Validates RenameFuelTypeRequest. Name required, max 100 chars.
/// Per-station uniqueness is enforced in the handler (needs data access).
/// </summary>
public class RenameFuelTypeRequestValidator : AbstractValidator<RenameFuelTypeRequest>
{
    public RenameFuelTypeRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Fuel type name is required.")
            .MaximumLength(100).WithMessage("Fuel type name must not exceed 100 characters.");
    }
}
