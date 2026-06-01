using FluentValidation;
using FuelFlow.Application.DTOs.AccountHead;

namespace FuelFlow.Application.Validators;

public class CreateAccountHeadRequestValidator : AbstractValidator<CreateAccountHeadRequest>
{
    public CreateAccountHeadRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required.")
            .MaximumLength(100).WithMessage("Name must not exceed 100 characters.");

        RuleFor(x => x.Type)
            .Must(t => t == 1 || t == 2)
            .WithMessage("Type must be 1 (Income) or 2 (Expense).");

        RuleFor(x => x.Description)
            .MaximumLength(255).When(x => x.Description != null)
            .WithMessage("Description must not exceed 255 characters.");
    }
}
