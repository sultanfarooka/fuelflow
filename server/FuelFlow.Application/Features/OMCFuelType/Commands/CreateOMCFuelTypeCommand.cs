using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.OMCFuelType;
using MediatR;

namespace FuelFlow.Application.Features.OMCFuelType.Commands;

/// <summary>
/// Command to create a new OMC fuel type.
/// </summary>
public record CreateOMCFuelTypeCommand(CreateOMCFuelTypeRequest Request) : IRequest<Result<CreateOMCFuelTypeResponse>>;
