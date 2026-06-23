using FluentValidation;
using FuelFlow.Application.DTOs.FuelTank;

namespace FuelFlow.Application.Validators;

/// <summary>
/// Validates <see cref="UpdateFuelTankRequest"/>. Mirrors the Create rules:
/// CapacityLiters &gt; 0, FuelTypeId required, Name optional ≤ 200 chars.
/// Per-station name uniqueness is enforced in the handler (the Create handler
/// does the same — it's a row-vs-row check that doesn't fit a FluentValidation
/// rule cleanly).
/// </summary>
public class UpdateFuelTankRequestValidator : AbstractValidator<UpdateFuelTankRequest>
{
    public UpdateFuelTankRequestValidator()
    {
        RuleFor(x => x.CapacityLiters)
            .GreaterThan(0).WithMessage("Capacity must be greater than zero.");

        RuleFor(x => x.FuelTypeId)
            .NotEmpty().WithMessage("Fuel type is required.");

        RuleFor(x => x.Name)
            .MaximumLength(200).WithMessage("Name must not exceed 200 characters.")
            .When(x => !string.IsNullOrWhiteSpace(x.Name));
    }
}
