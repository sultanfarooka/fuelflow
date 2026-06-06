using FuelFlow.Domain.Common;
using FuelFlow.Domain.Enums;

namespace FuelFlow.Domain.Entities;

public class AccountHead : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public AccountHeadType Type { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsSystemManaged { get; set; }
    public Guid OrganizationId { get; set; }

    public Organization Organization { get; set; } = null!;
}
