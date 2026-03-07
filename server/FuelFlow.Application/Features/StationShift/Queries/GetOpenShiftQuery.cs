using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.StationShift;
using MediatR;

namespace FuelFlow.Application.Features.StationShift.Queries;

public record GetOpenShiftQuery(Guid StationId) : IRequest<Result<StationShiftDto?>>;
