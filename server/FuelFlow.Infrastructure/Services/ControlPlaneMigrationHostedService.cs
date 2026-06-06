using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using FuelFlow.Infrastructure.Data;

namespace FuelFlow.Infrastructure.Services;

/// <summary>
/// On app boot, applies any pending ControlPlaneDbContext migrations to the shared
/// control-plane database (Identity, Tenants, Subscriptions, reference data).
///
/// WHY: control-plane migrations are normally applied via the `dotnet ef` tooling in
/// local dev. In a containerized deploy there is no SDK / EF tooling at runtime, so a
/// fresh database would have no Identity/Tenants/Subscriptions tables and DataSeeder
/// would fail. This service self-applies them on startup.
///
/// Registered ONLY when `Database:MigrateOnStartup == true` (set by the root
/// docker-compose), and registered BEFORE DataSeeder and TenantMigrationHostedService
/// so the control-plane schema exists before seeding and the tenant scan run
/// (IHostedService instances start in registration order).
/// </summary>
public class ControlPlaneMigrationHostedService : IHostedService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<ControlPlaneMigrationHostedService> _logger;

    public ControlPlaneMigrationHostedService(
        IServiceScopeFactory scopeFactory,
        ILogger<ControlPlaneMigrationHostedService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public async Task StartAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var controlPlane = scope.ServiceProvider.GetRequiredService<ControlPlaneDbContext>();

        _logger.LogInformation("ControlPlaneMigrationHostedService: applying pending control-plane migrations.");
        await controlPlane.Database.MigrateAsync(ct);
        _logger.LogInformation("ControlPlaneMigrationHostedService: control-plane migrations applied.");
    }

    public Task StopAsync(CancellationToken ct) => Task.CompletedTask;
}
