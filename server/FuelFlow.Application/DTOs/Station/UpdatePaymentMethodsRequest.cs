namespace FuelFlow.Application.DTOs.Station;

public class UpdatePaymentMethodsRequest
{
    public List<string> Methods { get; set; } = new();
}
