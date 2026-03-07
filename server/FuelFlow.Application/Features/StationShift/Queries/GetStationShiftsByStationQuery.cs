using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.StationShift;
using MediatR;

namespace FuelFlow.Application.Features.StationShift.Queries;

public record GetStationShiftsByStationQuery(Guid StationId, int Limit = 50) : IRequest<Result<List<StationShiftDto>>>;
