using FluentValidation;
using FuelFlow.Application.DTOs.ShiftConfig;

namespace FuelFlow.Application.Validators;

public class CreateShiftConfigRequestValidator : AbstractValidator<CreateShiftConfigRequest>
{
    public CreateShiftConfigRequestValidator()
    {
        RuleFor(x => x.ShiftCount)
            .InclusiveBetween(2, 3).WithMessage("Shift count must be 2 or 3.");

        RuleFor(x => x.Shift1Name).NotEmpty().WithMessage("Shift 1 name is required.");
        RuleFor(x => x.Shift1StartTime).NotEmpty().WithMessage("Shift 1 start time is required.");

        RuleFor(x => x.Shift2Name).NotEmpty().WithMessage("Shift 2 name is required.");
        RuleFor(x => x.Shift2StartTime).NotEmpty().WithMessage("Shift 2 start time is required.");

        When(x => x.ShiftCount == 3, () =>
        {
            RuleFor(x => x.Shift3Name).NotEmpty().WithMessage("Shift 3 name is required when shift count is 3.");
            RuleFor(x => x.Shift3StartTime).NotEmpty().WithMessage("Shift 3 start time is required when shift count is 3.");
        });
    }
}
