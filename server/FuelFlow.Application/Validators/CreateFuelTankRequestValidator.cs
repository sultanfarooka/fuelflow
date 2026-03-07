using FluentValidation;
using FuelFlow.Application.DTOs.FuelTank;

namespace FuelFlow.Application.Validators;

/// <summary>
/// Validates CreateFuelTankRequest. Capacity and FuelTypeId required; Name optional.
/// </summary>
public class CreateFuelTankRequestValidator : AbstractValidator<CreateFuelTankRequest>
{
    public CreateFuelTankRequestValidator()
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
