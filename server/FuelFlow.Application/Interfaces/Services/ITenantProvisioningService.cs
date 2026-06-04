namespace FuelFlow.Application.Interfaces.Services;

/// <summary>
/// Provisions a new per-tenant Postgres database during onboarding step 1 (M14-F03).
/// Creates the database, runs tenant migrations, inserts the root Organization row,
/// and flips the control-plane Tenant status to Active.
/// </summary>
public interface ITenantProvisioningService
{
    /// <summary>
    /// Provisions a tenant database for the given organization.
    /// Blocks until provisioning is complete (~5–30 s on first run).
    /// Compensates (drops DB + deletes Tenant row) on any failure.
    /// </summary>
    Task ProvisionAsync(Guid organizationId, string organizationName, Guid ownerId, CancellationToken ct = default);
}
