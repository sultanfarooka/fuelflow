namespace FuelFlow.Application.DTOs.BankAccount;

public class CreateBankAccountRequest
{
    public string BankName { get; set; } = string.Empty;
    public string AccountNumber { get; set; } = string.Empty;
    public string AccountTitle { get; set; } = string.Empty;
    public bool IsPrimary { get; set; } = false;
}
