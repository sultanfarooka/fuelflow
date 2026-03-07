namespace FuelFlow.Application.DTOs.FuelNozzle;

public class CreateFuelNozzleRequest
{
    public string NozzleNumber { get; set; } = string.Empty;
    public Guid TankId { get; set; }
}
