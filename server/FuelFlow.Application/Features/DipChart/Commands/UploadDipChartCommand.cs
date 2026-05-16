using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.DipChart;
using MediatR;

namespace FuelFlow.Application.Features.DipChart.Commands;

public record UploadDipChartCommand(
    Guid StationId,
    Guid TankId,
    UploadDipChartRequest Request
) : IRequest<Result<DipChartDto>>;
