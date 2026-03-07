namespace FuelFlow.Infrastructure.Data;

/// <summary>
/// Predefined GUIDs for reference/seed data. Use these so lookups and migrations are deterministic.
/// You can delete or change seed data and re-run the app — the seeder will re-insert if missing.
/// </summary>
public static class SeedData
{
    // OMCs (Oil Marketing Companies)
    public static readonly Guid PsoId = Guid.Parse("e0e54749-bb85-4f0d-bb4c-1b3b8654b8b1");
    public static readonly Guid ShellId = Guid.Parse("85b2756b-113d-417e-bffc-a6b4b063b4d8");
    public static readonly Guid TotalId = Guid.Parse("b804916f-33ab-4fb6-9837-9a9024eabcbe");

    // Subscription plans
    public static readonly Guid StarterPlanId = Guid.Parse("11111111-1111-1111-1111-111111111101");
    public static readonly Guid ProfessionalPlanId = Guid.Parse("11111111-1111-1111-1111-111111111102");
    public static readonly Guid EnterprisePlanId = Guid.Parse("11111111-1111-1111-1111-111111111103");

    // OMCFuelTypes — PSO (a1000001-*)
    public static readonly Guid PsoMs = Guid.Parse("a1000001-0000-0000-0000-000000000001");
    public static readonly Guid PsoHsd = Guid.Parse("a1000001-0000-0000-0000-000000000002");
    public static readonly Guid PsoCng = Guid.Parse("a1000001-0000-0000-0000-000000000003");
    public static readonly Guid PsoPremier = Guid.Parse("a1000001-0000-0000-0000-000000000004");
    public static readonly Guid PsoOctane = Guid.Parse("a1000001-0000-0000-0000-000000000005");
    public static readonly Guid PsoHiCetane = Guid.Parse("a1000001-0000-0000-0000-000000000006");

    // OMCFuelTypes — Shell (a1000002-*)
    public static readonly Guid ShellPetrol = Guid.Parse("a1000002-0000-0000-0000-000000000001");
    public static readonly Guid ShellDiesel = Guid.Parse("a1000002-0000-0000-0000-000000000002");
    public static readonly Guid ShellCng = Guid.Parse("a1000002-0000-0000-0000-000000000003");

    // OMCFuelTypes — Total (a1000003-*)
    public static readonly Guid TotalMs = Guid.Parse("a1000003-0000-0000-0000-000000000001");
    public static readonly Guid TotalHsd = Guid.Parse("a1000003-0000-0000-0000-000000000002");
    public static readonly Guid TotalCng = Guid.Parse("a1000003-0000-0000-0000-000000000003");
    public static readonly Guid TotalExcelliumPetrol = Guid.Parse("a1000003-0000-0000-0000-000000000004");
    public static readonly Guid TotalExcelliumDiesel = Guid.Parse("a1000003-0000-0000-0000-000000000005");

    public static readonly DateTime SeedTimestamp = new(2000, 1, 1, 0, 0, 0, DateTimeKind.Utc);
}
