using FluentValidation;
using FuelFlow.Application.DTOs.FuelType;

namespace FuelFlow.Application.Validators;

/// <summary>
/// Validates CreateFuelTypeRequest. Name required; Unit optional (default L).
/// </summary>
public class CreateFuelTypeRequestValidator : AbstractValidator<CreateFuelTypeRequest>
{
    public CreateFuelTypeRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Fuel type name is required.")
            .MaximumLength(100).WithMessage("Fuel type name must not exceed 100 characters.");

        RuleFor(x => x.Unit)
            .MaximumLength(10).WithMessage("Unit must not exceed 10 characters.")
            .When(x => !string.IsNullOrWhiteSpace(x.Unit));
    }
}
