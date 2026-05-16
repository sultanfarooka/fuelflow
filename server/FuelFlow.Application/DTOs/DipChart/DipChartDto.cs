namespace FuelFlow.Application.DTOs.DipChart;

public class DipChartDto
{
    public Guid Id { get; set; }
    public Guid TankId { get; set; }
    public int EntryCount { get; set; }
    public List<DipChartEntryDto> Entries { get; set; } = new();
}
