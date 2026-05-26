using FuelFlow.Domain.Common;

namespace FuelFlow.Domain.Entities;

/// <summary>
/// Bank account linked to an Organization. First implementation for M12-F01 onboarding
/// (optional step 7); full feature target is M05-F04.
/// IsPrimary uniqueness is enforced at the application layer.
/// </summary>
public class BankAccount : BaseEntity
{
    public Guid OrganizationId { get; set; }
    public string BankName { get; set; } = string.Empty;
    public string AccountNumber { get; set; } = string.Empty;
    public string AccountTitle { get; set; } = string.Empty;
    public bool IsPrimary { get; set; } = false;

    public Organization Organization { get; set; } = null!;
}
