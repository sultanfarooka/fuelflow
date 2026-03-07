using FuelFlow.Domain.Common;

public class OMCFuelTypes : BaseEntity
{
    public Guid OMCId { get; set; }
    public OMC OMC { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public string Unit { get; set; } = "L";
}