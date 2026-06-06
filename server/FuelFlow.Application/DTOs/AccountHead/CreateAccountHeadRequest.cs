namespace FuelFlow.Application.DTOs.AccountHead;

public class CreateAccountHeadRequest
{
    public string Name { get; set; } = string.Empty;
    /// <summary>1 = Income, 2 = Expense</summary>
    public int Type { get; set; }
    public string? Description { get; set; }
}
