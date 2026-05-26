namespace FuelFlow.Application.DTOs.BankAccount;

public class BankAccountDto
{
    public Guid Id { get; set; }
    public Guid OrganizationId { get; set; }
    public string BankName { get; set; } = string.Empty;
    public string AccountNumber { get; set; } = string.Empty;
    public string AccountTitle { get; set; } = string.Empty;
    public bool IsPrimary { get; set; }
}
