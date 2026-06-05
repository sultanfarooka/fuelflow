namespace FuelFlow.Application.Common.Exceptions;

/// <summary>
/// Thrown by <see cref="FuelFlow.Application.Interfaces.Services.ITenantConnectionResolver"/>
/// when the JWT carries an <c>org_id</c> claim but no matching row exists in the
/// control-plane <c>Tenants</c> table. Maps to HTTP 503 Service Unavailable.
/// </summary>
public sealed class TenantNotFoundException : Exception
{
    public Guid OrganizationId { get; }

    public TenantNotFoundException(Guid organizationId)
        : base($"Tenant database unavailable for organization {organizationId}.")
    {
        OrganizationId = organizationId;
    }
}
