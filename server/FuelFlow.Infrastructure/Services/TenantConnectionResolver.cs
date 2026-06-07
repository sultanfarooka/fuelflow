using FuelFlow.Application.Common.Exceptions;
using FuelFlow.Application.Interfaces.Services;
using FuelFlow.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Npgsql;

namespace FuelFlow.Infrastructure.Services;

/// <summary>
/// Resolves the per-tenant Postgres connection string for the current HTTP request
/// by reading the JWT <c>org_id</c> claim, looking up the matching <c>Tenants</c>
/// row in the control plane, and substituting <c>DatabaseName</c> into the base
/// connection string (M14-F02-R01).
/// </summary>
public class TenantConnectionResolver : ITenantConnectionResolver
{
    private readonly ICurrentUserService _currentUser;
    private readonly ControlPlaneDbContext _controlPlane;
    private readonly IConfiguration _configuration;

    public TenantConnectionResolver(
        ICurrentUserService currentUser,
        ControlPlaneDbContext controlPlane,
        IConfiguration configuration)
    {
        _currentUser = currentUser;
        _controlPlane = controlPlane;
        _configuration = configuration;
    }

    public async Task<string?> ResolveAsync(CancellationToken ct = default)
    {
        var orgId = _currentUser.OrganizationId;
        if (orgId is null)
            return null;

        return await ResolveForOrgAsync(orgId.Value, ct);
    }

    public async Task<string> ResolveForOrgAsync(Guid orgId, CancellationToken ct = default)
    {
        var tenant = await _controlPlane.Tenants
            .AsNoTracking()
            .SingleOrDefaultAsync(t => t.Id == orgId, ct);

        if (tenant is null)
            throw new TenantNotFoundException(orgId);

        var baseConnStr = _configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("DefaultConnection is not configured.");

        var builder = new NpgsqlConnectionStringBuilder(baseConnStr)
        {
            Database = tenant.DatabaseName
        };

        return builder.ToString();
    }
}
