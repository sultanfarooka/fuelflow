namespace FuelFlow.Application.Interfaces.Services;

/// <summary>
/// Resolves the per-tenant Postgres connection string for the current HTTP request
/// from the JWT <c>org_id</c> claim (M14-F02).
/// </summary>
public interface ITenantConnectionResolver
{
    /// <summary>
    /// Returns the connection string for the current request's tenant, or
    /// <c>null</c> when no <c>org_id</c> claim is present (unauthenticated /
    /// pre-org flows). Throws <see cref="TenantNotFoundException"/> when
    /// <c>org_id</c> is present but no <c>Tenants</c> row exists.
    /// </summary>
    Task<string?> ResolveAsync(CancellationToken ct = default);
}
