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

    public ICollection<OMCFuelTypes> FuelTypes { get; set; } = new List<OMCFuelTypes>();
    public ICollection<Station> Stations { get; set; } = new List<Station>();

}