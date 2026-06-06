namespace FuelFlow.Application.DTOs.AccountHead;

public class AccountHeadDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public bool IsSystemManaged { get; set; }
}
