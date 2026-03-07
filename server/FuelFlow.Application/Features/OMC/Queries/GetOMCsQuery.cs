using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.OMC;
using MediatR;

namespace FuelFlow.Application.Features.OMC.Queries;

/// <summary>
/// Query to get all OMCs.
/// </summary>
public record GetOMCsQuery : IRequest<Result<IReadOnlyList<OMCDto>>>;
