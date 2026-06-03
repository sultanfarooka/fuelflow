using FuelFlow.Application.Interfaces.Services;
using FuelFlow.Domain.Entities;
using FuelFlow.Domain.Enums;
using FuelFlow.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace FuelFlow.Infrastructure.Services;

/// <summary>
/// Seeds account heads for an organization (M05-F09).
/// Default expense heads are seeded on org creation; fuel-type income heads are
/// seeded per active fuel type during onboarding. Both methods are idempotent —
/// they skip any name that already exists for the organization, so re-running is safe.
/// Each method saves its own changes; callers invoke it after their own transaction commits.
/// </summary>
public class AccountHeadSeeder : IAccountHeadSeeder
{
    private readonly AppDbContext _db;

    public AccountHeadSeeder(AppDbContext db) => _db = db;

    /// <summary>The 7 default expense heads every new organization starts with.</summary>
    private static readonly string[] DefaultExpenseHeadNames =
    [
        "Generator Fuel",
        "Electricity",
        "Repairs & Maintenance",
        "Staff Food/Tea",
        "Stationery",
        "Transport",
        "Miscellaneous",
    ];

    public async Task SeedDefaultExpenseHeadsAsync(Guid organizationId, CancellationToken ct = default)
    {
        var existingNames = await _db.AccountHeads
            .Where(a => a.OrganizationId == organizationId)
            .Select(a => a.Name)
            .ToListAsync(ct);

        var toAdd = DefaultExpenseHeadNames
            .Where(name => !existingNames.Contains(name))
            .Select(name => BuildHead(organizationId, name, AccountHeadType.Expense, isSystemManaged: false))
            .ToList();

        if (toAdd.Count == 0)
            return;

        await _db.AccountHeads.AddRangeAsync(toAdd, ct);
        await _db.SaveChangesAsync(ct);
    }

    public async Task SeedFuelTypeIncomeHeadsAsync(Guid organizationId, string fuelTypeName, CancellationToken ct = default)
    {
        var trimmed = (fuelTypeName ?? string.Empty).Trim();
        if (string.IsNullOrEmpty(trimmed))
            return;

        // Guard against the 100-char AccountHead.Name limit for very long custom fuel-type names.
        // " (Cash/Card)" is the longest suffix (12 chars) and "Fuel Sales " is the longest prefix (11 chars).
        const int maxFuelNameLength = 100 - 23;
        if (trimmed.Length > maxFuelNameLength)
            trimmed = trimmed[..maxFuelNameLength];

        var candidateNames = new[]
        {
            $"Fuel Sales {trimmed} (Cash/Card)",
            $"Credit Sales {trimmed}",
        };

        var existingNames = await _db.AccountHeads
            .Where(a => a.OrganizationId == organizationId && candidateNames.Contains(a.Name))
            .Select(a => a.Name)
            .ToListAsync(ct);

        var toAdd = candidateNames
            .Where(name => !existingNames.Contains(name))
            .Select(name => BuildHead(organizationId, name, AccountHeadType.Income, isSystemManaged: true))
            .ToList();

        if (toAdd.Count == 0)
            return;

        await _db.AccountHeads.AddRangeAsync(toAdd, ct);
        await _db.SaveChangesAsync(ct);
    }

    private static AccountHead BuildHead(Guid organizationId, string name, AccountHeadType type, bool isSystemManaged)
        => new()
        {
            Id = Guid.NewGuid(),
            Name = name,
            Type = type,
            IsActive = true,
            IsSystemManaged = isSystemManaged,
            OrganizationId = organizationId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
}
