using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.OMC;
using MediatR;

namespace FuelFlow.Application.Features.OMC.Commands;

/// <summary>
/// Command to create a new OMC.
/// </summary>
public record CreateOMCCommand(CreateOMCRequest Request) : IRequest<Result<CreateOMCResponse>>;
