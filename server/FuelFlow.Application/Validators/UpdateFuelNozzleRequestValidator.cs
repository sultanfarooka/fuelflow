using FluentValidation;
using FuelFlow.Application.DTOs.FuelNozzle;

namespace FuelFlow.Application.Validators;

/// <summary>
/// M08-F03: validates <see cref="UpdateFuelNozzleRequest"/>. Mirrors the
/// Create rules: NozzleNumber 1–20 chars, TankId required. Per-station
/// uniqueness is enforced in the handler (row-vs-row check that doesn't fit
/// a FluentValidation rule cleanly).
/// </summary>
public class UpdateFuelNozzleRequestValidator : AbstractValidator<UpdateFuelNozzleRequest>
{
    public UpdateFuelNozzleRequestValidator()
    {
        RuleFor(x => x.NozzleNumber)
            .NotEmpty().WithMessage("Nozzle number is required.")
            .MaximumLength(20).WithMessage("Nozzle number must not exceed 20 characters.");

        RuleFor(x => x.TankId)
            .NotEmpty().WithMessage("Tank is required.");
    }
}
