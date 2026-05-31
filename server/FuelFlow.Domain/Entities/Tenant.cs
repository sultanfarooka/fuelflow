using FuelFlow.Domain.Common;
using FuelFlow.Domain.Enums;

namespace FuelFlow.Domain.Entities;

/// <summary>
/// Control-plane registry entry for one Organization in the multi-tenant system.
///
/// WHY: After M14-F03 each Organization is provisioned its own physical Postgres
/// database. The control plane needs a row per tenant so per-request connection
/// resolution can map an <see cref="OrganizationId"/> claim to a connection
/// string, and so platform admin can see lifecycle state without inspecting
/// every tenant DB.
///
/// CONVENTION: <see cref="BaseEntity.Id"/> equals <c>Organization.Id</c> by
/// application convention. There is no FK between the two — they live in
/// different DbContexts (Tenant in the control plane, Organization in the
/// tenant DB) and from M14-F03 onward in different physical databases.
/// Handlers that create a tenant must insert both rows with the same Guid.
///
/// In M14-F01 (this feature) the Tenant table is added but no provisioning
/// happens yet; both contexts still target the same physical DB. F02 begins
/// reading <see cref="DatabaseName"/> per request; F03 begins writing it
/// during onboarding step 1.
/// </summary>
public class Tenant : BaseEntity
{
    /// <summary>
    /// Name of the Postgres database that holds this tenant's operational data.
    /// Convention: <c>tenant_{Id:N}</c> (lowercase hex, no hyphens). Set by the
    /// provisioning service in M14-F03.
    /// </summary>
    public string DatabaseName { get; set; } = string.Empty;

    public TenantStatus Status { get; set; }

    /// <summary>
    /// When the tenant's database was successfully provisioned and migrated.
    /// Null during the brief <see cref="TenantStatus.Provisioning"/> window.
    /// </summary>
    public DateTime? ProvisionedAt { get; set; }

    /// <summary>
    /// Set when <see cref="Status"/> transitions to <see cref="TenantStatus.Deleted"/>.
    /// Soft-delete marker — the actual <c>DROP DATABASE</c> happens out-of-band
    /// after an export window.
    /// </summary>
    public DateTime? DeletedAt { get; set; }
}
