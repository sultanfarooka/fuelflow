using FuelFlow.Domain.Common;
using FuelFlow.Domain.Entities;

namespace FuelFlow.Domain.Entities;

/// <summary>
/// A price for a fuel type at a station.
/// This is a price per unit of fuel.
/// The price is effective from a given date to a given date.
/// The price is valid for a given fuel type at a given station.
/// The price is valid for a given date range.
/// The price is valid for a given fuel type at a given station.
/// </summary>
public class FuelPrices : BaseEntity
{
    public Guid FuelTypeId { get; set; }
    public FuelType FuelType { get; set; } = null!;

    public Guid StationId { get; set; }
    public Station Station { get; set; } = null!;

    public decimal Price { get; set; } // plan: price
    public DateTime EffectiveFrom { get; set; } // plan: effective_from (price history)

    public DateTime? EffectiveTo { get; set; } // optional end of validity
}