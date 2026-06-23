namespace FuelFlow.Application.DTOs.FuelTank;

/// <summary>
/// DTO for fuel tank in list/get responses.
/// </summary>
public class FuelTankDto
{
    public Guid Id { get; set; }
    public string? Name { get; set; }
    public decimal CapacityLiters { get; set; }
    public Guid FuelTypeId { get; set; }
    public string? FuelTypeName { get; set; }
    public bool HasDipChart { get; set; }
    public int DipChartEntryCount { get; set; }

    /// <summary>M08-F02: number of nozzles linked to this tank — drives the
    /// delete reference-guard and the Tanks panel "Nozzles" column.</summary>
    public int NozzleCount { get; set; }
}
