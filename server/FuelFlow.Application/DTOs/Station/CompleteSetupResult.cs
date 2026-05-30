namespace FuelFlow.Application.DTOs.Station;

public class CompleteSetupResult
{
    public bool Success { get; set; }
    public List<string> UnmetConditions { get; set; } = new();
}
