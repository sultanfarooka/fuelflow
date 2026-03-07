using FuelFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace FuelFlow.Infrastructure.Data;

/// <summary>
/// Seeds reference data on app startup if not already present.
/// Uses predefined GUIDs from <see cref="SeedData"/>.
/// Idempotent: safe to delete data and restart — it will re-seed.
/// </summary>
public class DataSeeder : IHostedService
{
    private readonly IServiceProvider _services;
    private readonly ILogger<DataSeeder> _logger;

    public DataSeeder(IServiceProvider services, ILogger<DataSeeder> logger)
    {
        _services = services;
        _logger = logger;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        using var scope = _services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        try
        {
            await SeedOmcsAsync(db, cancellationToken);
            await SeedSubscriptionPlansAsync(db, cancellationToken);
            await SeedOmcFuelTypesAsync(db, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Data seeding failed");
            throw;
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    private static async Task SeedOmcsAsync(AppDbContext db, CancellationToken ct)
    {
        var existing = await db.OMCs
            .Where(o => o.Id == SeedData.PsoId || o.Id == SeedData.ShellId || o.Id == SeedData.TotalId)
            .Select(o => o.Id)
            .ToListAsync(ct);

        var toAdd = new List<OMC>();
        if (!existing.Contains(SeedData.PsoId))
            toAdd.Add(new OMC { Id = SeedData.PsoId, Name = "PSO", Address = "PSO House, 3-K, Block 6, PECHS, Karachi 75400", Phone = "+92-21-111-774-774", Email = "info@pso.com.pk", Website = "https://www.pso.com.pk", LogoUrl = "", ContactPerson = "Customer Service", ContactPersonEmail = "customerservice@pso.com.pk", ContactPersonPhone = "+92-21-111-774-774", CreatedAt = SeedData.SeedTimestamp, UpdatedAt = SeedData.SeedTimestamp });
        if (!existing.Contains(SeedData.ShellId))
            toAdd.Add(new OMC { Id = SeedData.ShellId, Name = "Shell", Address = "Shell House, 6, Ch. Khaliquzzaman Road, Karachi 75530", Phone = "+92-21-111-743-553", Email = "info@shell.com.pk", Website = "https://www.shell.com.pk", LogoUrl = "", ContactPerson = "Customer Care", ContactPersonEmail = "customercare@shell.com.pk", ContactPersonPhone = "+92-21-111-743-553", CreatedAt = SeedData.SeedTimestamp, UpdatedAt = SeedData.SeedTimestamp });
        if (!existing.Contains(SeedData.TotalId))
            toAdd.Add(new OMC { Id = SeedData.TotalId, Name = "Total", Address = "Total Parco House, 1-A, Kohistan Road, F-8 Markaz, Islamabad 44000", Phone = "+92-51-111-868-255", Email = "info@total-parco.com.pk", Website = "https://www.total-parco.com.pk", LogoUrl = "", ContactPerson = "Support Team", ContactPersonEmail = "support@total-parco.com.pk", ContactPersonPhone = "+92-51-111-868-255", CreatedAt = SeedData.SeedTimestamp, UpdatedAt = SeedData.SeedTimestamp });

        if (toAdd.Count > 0)
        {
            db.OMCs.AddRange(toAdd);
            await db.SaveChangesAsync(ct);
            // Using generic logger to avoid direct Serilog dependency in Infrastructure
            // Logging is still routed to Serilog via Program.cs configuration.
            // Note: static method, so use console logging here if DI logger isn't available.
        }
    }

    private static async Task SeedSubscriptionPlansAsync(AppDbContext db, CancellationToken ct)
    {
        var existing = await db.SubscriptionPlans
            .Where(s => s.Id == SeedData.StarterPlanId || s.Id == SeedData.ProfessionalPlanId || s.Id == SeedData.EnterprisePlanId)
            .Select(s => s.Id)
            .ToListAsync(ct);

        var toAdd = new List<SubscriptionPlans>();
        if (!existing.Contains(SeedData.StarterPlanId))
            toAdd.Add(new SubscriptionPlans { Id = SeedData.StarterPlanId, Name = "Starter", MaxStations = 1, MaxUsers = 5, CreatedAt = SeedData.SeedTimestamp, UpdatedAt = SeedData.SeedTimestamp });
        if (!existing.Contains(SeedData.ProfessionalPlanId))
            toAdd.Add(new SubscriptionPlans { Id = SeedData.ProfessionalPlanId, Name = "Professional", MaxStations = 3, MaxUsers = 10, CreatedAt = SeedData.SeedTimestamp, UpdatedAt = SeedData.SeedTimestamp });
        if (!existing.Contains(SeedData.EnterprisePlanId))
            toAdd.Add(new SubscriptionPlans { Id = SeedData.EnterprisePlanId, Name = "Enterprise", MaxStations = -1, MaxUsers = -1, CreatedAt = SeedData.SeedTimestamp, UpdatedAt = SeedData.SeedTimestamp });

        if (toAdd.Count > 0)
        {
            db.SubscriptionPlans.AddRange(toAdd);
            await db.SaveChangesAsync(ct);
        }
    }

    private static async Task SeedOmcFuelTypesAsync(AppDbContext db, CancellationToken ct)
    {
        var allIds = new[]
        {
            SeedData.PsoMs, SeedData.PsoHsd, SeedData.PsoCng, SeedData.PsoPremier, SeedData.PsoOctane, SeedData.PsoHiCetane,
            SeedData.ShellPetrol, SeedData.ShellDiesel, SeedData.ShellCng,
            SeedData.TotalMs, SeedData.TotalHsd, SeedData.TotalCng, SeedData.TotalExcelliumPetrol, SeedData.TotalExcelliumDiesel
        };

        var existing = await db.OMCFuelTypes
            .Where(f => allIds.Contains(f.Id))
            .Select(f => f.Id)
            .ToListAsync(ct);

        var toAdd = new List<OMCFuelTypes>();
        void AddIfMissing(Guid id, Guid omcId, string name, string unit)
        {
            if (!existing.Contains(id))
                toAdd.Add(new OMCFuelTypes { Id = id, OMCId = omcId, Name = name, Unit = unit, CreatedAt = SeedData.SeedTimestamp, UpdatedAt = SeedData.SeedTimestamp });
        }

        AddIfMissing(SeedData.PsoMs, SeedData.PsoId, "MS (Motor Spirit / Petrol)", "L");
        AddIfMissing(SeedData.PsoHsd, SeedData.PsoId, "HSD (High Speed Diesel)", "L");
        AddIfMissing(SeedData.PsoCng, SeedData.PsoId, "CNG", "kg");
        AddIfMissing(SeedData.PsoPremier, SeedData.PsoId, "Premier Euro 5 (Petrol)", "L");
        AddIfMissing(SeedData.PsoOctane, SeedData.PsoId, "Octane+ Euro 5 (Petrol)", "L");
        AddIfMissing(SeedData.PsoHiCetane, SeedData.PsoId, "Hi-Cetane Diesel Euro 5", "L");
        AddIfMissing(SeedData.ShellPetrol, SeedData.ShellId, "Petrol", "L");
        AddIfMissing(SeedData.ShellDiesel, SeedData.ShellId, "Diesel", "L");
        AddIfMissing(SeedData.ShellCng, SeedData.ShellId, "CNG", "kg");
        AddIfMissing(SeedData.TotalMs, SeedData.TotalId, "MS (Motor Spirit / Petrol)", "L");
        AddIfMissing(SeedData.TotalHsd, SeedData.TotalId, "HSD (High Speed Diesel)", "L");
        AddIfMissing(SeedData.TotalCng, SeedData.TotalId, "CNG", "kg");
        AddIfMissing(SeedData.TotalExcelliumPetrol, SeedData.TotalId, "Excellium Petrol", "L");
        AddIfMissing(SeedData.TotalExcelliumDiesel, SeedData.TotalId, "Excellium Diesel", "L");

        if (toAdd.Count > 0)
        {
            db.OMCFuelTypes.AddRange(toAdd);
            await db.SaveChangesAsync(ct);
        }
    }
}
