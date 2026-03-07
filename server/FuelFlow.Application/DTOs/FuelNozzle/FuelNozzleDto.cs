namespace FuelFlow.Application.DTOs.FuelNozzle;

public class FuelNozzleDto
{
    public Guid Id { get; set; }
    public string NozzleNumber { get; set; } = string.Empty;
    public Guid TankId { get; set; }
    public string? TankName { get; set; }
    public Guid StationId { get; set; }
    public bool IsActive { get; set; }
}
