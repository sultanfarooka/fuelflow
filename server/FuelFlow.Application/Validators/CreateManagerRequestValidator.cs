using FluentValidation;
using FuelFlow.Application.DTOs.Users;

namespace FuelFlow.Application.Validators;

/// <summary>
/// Validates CreateManagerRequest ([M01-F05-R02]) — structure/format only.
/// Business rules (phone/email uniqueness, station-belongs-to-org, plan limit)
/// are enforced in the handler.
/// </summary>
public class CreateManagerRequestValidator : AbstractValidator<CreateManagerRequest>
{
    public CreateManagerRequestValidator()
    {
        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Full name is required.")
            .MaximumLength(200).WithMessage("Full name must not exceed 200 characters.");

        RuleFor(x => x.Phone)
            .NotEmpty().WithMessage("Phone number is required.")
            .Matches(@"^\+92\d{10}$").WithMessage("Phone must be in Pakistani format: +92XXXXXXXXXX.");

        RuleFor(x => x.Email)
            .EmailAddress().WithMessage("Invalid email format.")
            .When(x => !string.IsNullOrWhiteSpace(x.Email));

        RuleFor(x => x.StationIds)
            .NotEmpty().WithMessage("Assign at least one station.");

        RuleForEach(x => x.StationIds)
            .NotEqual(Guid.Empty).WithMessage("Station id is invalid.");

        RuleFor(x => x.StationIds)
            .Must(ids => ids.Distinct().Count() == ids.Count)
            .WithMessage("Duplicate station assignments are not allowed.")
            .When(x => x.StationIds is { Count: > 0 });
    }
}
