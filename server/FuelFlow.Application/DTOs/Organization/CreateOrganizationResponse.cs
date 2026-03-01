namespace FuelFlow.Application.DTOs.Organization;

public class CreateOrganizationResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
}