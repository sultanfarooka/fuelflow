using FuelFlow.Application.Interfaces.Services;
using FuelFlow.Domain.Entities;
using FuelFlow.Domain.Enums;
using FuelFlow.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Npgsql;

namespace FuelFlow.Infrastructure.Services;

/// <summary>
/// Provisions a physical Postgres database for a new tenant during onboarding step 1 (M14-F03).
///
/// Sequence (synchronous, blocks the onboarding request):
///   1. Insert Tenant row (Status=Provisioning) in control plane — if this fails no DB work has started.
///   2. CREATE DATABASE via a raw NpgsqlConnection (DDL must run outside a transaction).
///   3. Run all AppDbContext migrations against the new DB.
///   4. Insert Organization row in tenant DB.
///   5. Flip Tenant.Status → Active in control plane.
///
/// Compensating actions on failure:
///   - If step 2 or later fails → DROP DATABASE IF EXISTS on a fresh connection.
///   - In all failure cases → delete the Tenant row from the control plane.
/// </summary>
public class TenantProvisioningService : ITenantProvisioningService
{
    private readonly ControlPlaneDbContext _controlPlane;
    private readonly IConfiguration _configuration;
    private readonly ILogger<TenantProvisioningService> _logger;

    public TenantProvisioningService(
        ControlPlaneDbContext controlPlane,
        IConfiguration configuration,
        ILogger<TenantProvisioningService> logger)
    {
        _controlPlane = controlPlane;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task ProvisionAsync(
        Guid organizationId,
        string organizationName,
        Guid ownerId,
        CancellationToken ct = default)
    {
        var dbName = $"tenant_{organizationId:N}";
        var now = DateTime.UtcNow;

        // Step 1 — insert Tenant row in Provisioning state.
        var tenant = new Tenant
        {
            Id = organizationId,
            DatabaseName = dbName,
            Status = TenantStatus.Provisioning,
            CreatedAt = now,
            UpdatedAt = now,
        };
        _controlPlane.Tenants.Add(tenant);
        await _controlPlane.SaveChangesAsync(ct);

        var dbCreated = false;
        try
        {
            // Step 2 — CREATE DATABASE (auto-commit; DDL cannot run inside a transaction).
            var baseConnStr = _configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("DefaultConnection is not configured.");

            await using (var adminConn = new NpgsqlConnection(baseConnStr))
            {
                await adminConn.OpenAsync(ct);
                // Use a fresh command — no transaction wrapper.
                await using var cmd = adminConn.CreateCommand();
                cmd.CommandText = $"CREATE DATABASE \"{dbName}\"";
                await cmd.ExecuteNonQueryAsync(ct);
            }

            dbCreated = true;
            _logger.LogInformation("Created tenant database {DbName} for org {OrgId}", dbName, organizationId);

            // Step 3 — migrate the new database.
            var tenantConnStr = BuildTenantConnectionString(baseConnStr, dbName);
            var tenantOptions = new DbContextOptionsBuilder<AppDbContext>()
                .UseNpgsql(tenantConnStr,
                    npgsql => npgsql.MigrationsHistoryTable("__EFMigrationsHistory_AppDb"))
                .Options;

            await using var tenantCtx = new AppDbContext(tenantOptions);
            await tenantCtx.Database.MigrateAsync(ct);
            _logger.LogInformation("Applied migrations to {DbName}", dbName);

            // Step 4 — insert Organization row in tenant DB.
            tenantCtx.Organizations.Add(new Organization
            {
                Id = organizationId,
                Name = organizationName,
                OwnerId = ownerId,
                CreatedAt = now,
                UpdatedAt = now,
            });
            await tenantCtx.SaveChangesAsync(ct);

            // Step 5 — flip Tenant status to Active.
            tenant.Status = TenantStatus.Active;
            tenant.ProvisionedAt = DateTime.UtcNow;
            tenant.UpdatedAt = DateTime.UtcNow;
            await _controlPlane.SaveChangesAsync(ct);

            _logger.LogInformation("Tenant {OrgId} provisioned successfully ({DbName})", organizationId, dbName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Provisioning failed for org {OrgId}; compensating", organizationId);

            await CompensateAsync(dbName, dbCreated, tenant);
            throw;
        }
    }

    private async Task CompensateAsync(string dbName, bool dbCreated, Tenant tenant)
    {
        if (dbCreated)
        {
            try
            {
                var baseConnStr = _configuration.GetConnectionString("DefaultConnection");
                if (baseConnStr is not null)
                {
                    await using var conn = new NpgsqlConnection(baseConnStr);
                    await conn.OpenAsync();
                    await using var cmd = conn.CreateCommand();
                    // Force-disconnect existing sessions before dropping.
                    cmd.CommandText = $"""
                        SELECT pg_terminate_backend(pid)
                        FROM pg_stat_activity
                        WHERE datname = '{dbName}' AND pid <> pg_backend_pid();
                        DROP DATABASE IF EXISTS "{dbName}";
                        """;
                    await cmd.ExecuteNonQueryAsync();
                    _logger.LogInformation("Compensation: dropped database {DbName}", dbName);
                }
            }
            catch (Exception dropEx)
            {
                _logger.LogError(dropEx, "Compensation DROP DATABASE failed for {DbName} — manual cleanup required", dbName);
            }
        }

        try
        {
            _controlPlane.Tenants.Remove(tenant);
            await _controlPlane.SaveChangesAsync();
            _logger.LogInformation("Compensation: removed Tenant row for {TenantId}", tenant.Id);
        }
        catch (Exception removeEx)
        {
            _logger.LogError(removeEx, "Compensation Tenant row removal failed for {TenantId} — manual cleanup required", tenant.Id);
        }
    }

    private static string BuildTenantConnectionString(string baseConnStr, string dbName)
    {
        var builder = new NpgsqlConnectionStringBuilder(baseConnStr) { Database = dbName };
        return builder.ToString();
    }
}
