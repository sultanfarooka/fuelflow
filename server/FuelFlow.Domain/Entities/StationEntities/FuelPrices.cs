using FuelFlow.Domain.Common;

namespace FuelFlow.Domain.Entities;

/// <summary>
/// A price for a fuel type at a station.
/// The price is effective from a given date to a given date.
/// </summary>
public class FuelPrices : BaseEntity
{
    // Cross-context FK — references control-plane FuelType by plain Guid (M14-F02).
    // Nav property dropped; handlers use IFuelTypeRepository for lookups.
    public Guid FuelTypeId { get; set; }

    public Guid StationId { get; set; }
    public Station Station { get; set; } = null!;

    public decimal Price { get; set; }
    public DateTime EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
}
