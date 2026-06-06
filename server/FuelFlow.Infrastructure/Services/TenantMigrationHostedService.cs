using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Npgsql;
using FuelFlow.Domain.Enums;
using FuelFlow.Infrastructure.Data;

namespace FuelFlow.Infrastructure.Services;

/// <summary>
/// On app boot, applies any pending AppDbContext migrations to every active tenant DB.
/// Runs after DataSeeder (both are IHostedService; registration order matters).
/// M14 contract: per-tenant failure is logged and skipped — the app starts regardless [M14-F06-R01].
/// </summary>
public class TenantMigrationHostedService : IHostedService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<TenantMigrationHostedService> _logger;
    private readonly IConfiguration _configuration;

    public TenantMigrationHostedService(
        IServiceScopeFactory scopeFactory,
        ILogger<TenantMigrationHostedService> logger,
        IConfiguration configuration)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
        _configuration = configuration;
    }

    public async Task StartAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var controlPlane = scope.ServiceProvider.GetRequiredService<ControlPlaneDbContext>();

        var tenants = await controlPlane.Tenants
            .Where(t => t.Status == TenantStatus.Active)
            .AsNoTracking()
            .ToListAsync(ct);

        if (tenants.Count == 0)
        {
            _logger.LogDebug("TenantMigrationHostedService: no active tenants found, nothing to migrate.");
            return;
        }

        _logger.LogInformation("TenantMigrationHostedService: applying migrations to {Count} tenant DB(s).", tenants.Count);

        var baseConnStr = _configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("DefaultConnection is not configured.");

        foreach (var tenant in tenants)
        {
            try
            {
                var tenantConnStr = new NpgsqlConnectionStringBuilder(baseConnStr)
                {
                    Database = tenant.DatabaseName
                }.ToString();

                var options = new DbContextOptionsBuilder<AppDbContext>()
                    .UseNpgsql(tenantConnStr,
                        npgsql => npgsql.MigrationsHistoryTable("__EFMigrationsHistory_AppDb"))
                    .Options;

                await using var db = new AppDbContext(options);
                await db.Database.MigrateAsync(ct);

                _logger.LogInformation("Migrations applied: tenant {TenantId} ({Database})",
                    tenant.Id, tenant.DatabaseName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Migration failed for tenant {TenantId} ({Database}); app will continue serving other tenants.",
                    tenant.Id, tenant.DatabaseName);
            }
        }
    }

    public Task StopAsync(CancellationToken ct) => Task.CompletedTask;
}
