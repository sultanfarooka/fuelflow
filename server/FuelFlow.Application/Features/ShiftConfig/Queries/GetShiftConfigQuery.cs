using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.ShiftConfig;
using MediatR;

namespace FuelFlow.Application.Features.ShiftConfig.Queries;

public record GetShiftConfigQuery(Guid StationId) : IRequest<Result<ShiftConfigDto?>>;
