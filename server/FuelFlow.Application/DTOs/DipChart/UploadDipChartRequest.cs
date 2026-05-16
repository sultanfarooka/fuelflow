namespace FuelFlow.Application.DTOs.DipChart;

public class UploadDipChartRequest
{
    public List<DipChartEntryItem> Entries { get; set; } = new();
}

public class DipChartEntryItem
{
    public decimal DepthCm { get; set; }
    public decimal VolumeLiters { get; set; }
}
