namespace FuelFlow.Application.DTOs.FuelPrices;

/// <summary>
/// DTO for fuel price in list/get responses.
/// </summary>
public class FuelPricesDto
{
    public Guid Id { get; set; }
    public Guid FuelTypeId { get; set; }
    public string? FuelTypeName { get; set; }
    public Guid StationId { get; set; }
    public decimal Price { get; set; }
    public DateTime EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
}
