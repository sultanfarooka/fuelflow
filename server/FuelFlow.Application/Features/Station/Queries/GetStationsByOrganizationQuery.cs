using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.Station;
using MediatR;

namespace FuelFlow.Application.Features.Station.Queries;

/// <summary>
/// Query to get all stations for an organization.
/// </summary>
public record GetStationsByOrganizationQuery(Guid OrganizationId) : IRequest<Result<IReadOnlyList<StationDto>>>;
