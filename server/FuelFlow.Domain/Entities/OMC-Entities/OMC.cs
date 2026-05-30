using FuelFlow.Domain.Common;
using FuelFlow.Domain.Entities;

public class OMC : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Website { get; set; } = string.Empty;
    public string LogoUrl { get; set; } = string.Empty;
    public string ContactPerson { get; set; } = string.Empty;
    public string ContactPersonEmail { get; set; } = string.Empty;
    public string ContactPersonPhone { get; set; } = string.Empty;

    // Intra-control-plane: OMCFuelTypes lives alongside OMC in ControlPlaneDbContext.
    public ICollection<OMCFuelTypes> FuelTypes { get; set; } = new List<OMCFuelTypes>();

    // M14-F01: dropped the `ICollection<Station> Stations` reverse navigation.
    // Station lives in the per-tenant AppDbContext; including the inverse here
    // would force EF Core to pull Station into the control-plane model via
    // OMCConfiguration. Code that needs "all stations of this OMC" must now
    // query AppDbContext explicitly. The forward navigation (Station.OMC) is
    // retained as an F01 cross-context shim until M14-F03 removes it.
}