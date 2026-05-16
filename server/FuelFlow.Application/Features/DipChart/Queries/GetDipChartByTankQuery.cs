using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.DipChart;
using MediatR;

namespace FuelFlow.Application.Features.DipChart.Queries;

public record GetDipChartByTankQuery(Guid StationId, Guid TankId) : IRequest<Result<DipChartDto?>>;
