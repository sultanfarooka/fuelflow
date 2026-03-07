namespace FuelFlow.Application.DTOs.FuelPrices;

/// <summary>
/// Request to set a new price for a fuel type at a station (creates a new price row, optionally ending the previous).
/// </summary>
public class SetFuelPriceRequest
{
    public Guid FuelTypeId { get; set; }
    public decimal Price { get; set; }
    public DateTime EffectiveFrom { get; set; }
}
