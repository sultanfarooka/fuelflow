using FluentValidation;
using FuelFlow.Application.DTOs.BankAccount;

namespace FuelFlow.Application.Validators;

public class CreateBankAccountRequestValidator : AbstractValidator<CreateBankAccountRequest>
{
    public CreateBankAccountRequestValidator()
    {
        RuleFor(x => x.BankName).NotEmpty().WithMessage("Bank name is required.");
        RuleFor(x => x.AccountNumber).NotEmpty().WithMessage("Account number is required.");
        RuleFor(x => x.AccountTitle).NotEmpty().WithMessage("Account title is required.");
    }
}
