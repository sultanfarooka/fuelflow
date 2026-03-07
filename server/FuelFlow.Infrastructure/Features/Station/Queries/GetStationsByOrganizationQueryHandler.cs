using MediatR;
using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.Station;
using FuelFlow.Application.Features.Station.Queries;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Application.Interfaces.Services;

namespace FuelFlow.Infrastructure.Features.Station.Queries;

/// <summary>
/// Returns all active stations for an organization. Validates that the current user belongs to that organization (Owner or Manager).
/// </summary>
public class GetStationsByOrganizationQueryHandler : IRequestHandler<GetStationsByOrganizationQuery, Result<IReadOnlyList<StationDto>>>
{
    private readonly ICurrentUserService _currentUser;
    private readonly IStationRepository _stationRepo;

    public GetStationsByOrganizationQueryHandler(
        ICurrentUserService currentUser,
        IStationRepository stationRepo)
    {
        _currentUser = currentUser;
        _stationRepo = stationRepo;
    }

    /// <summary>
    /// Returns all active stations for the given organization. Fails if the current user does not belong to that organization.
    /// </summary>
    public async Task<Result<IReadOnlyList<StationDto>>> Handle(
        GetStationsByOrganizationQuery request,
        CancellationToken cancellationToken)
    {
        // --- Step 1: Require current user to belong to an organization ---
        var orgId = _currentUser.OrganizationId;
        if (orgId == null)
            return Result<IReadOnlyList<StationDto>>.Failure("You must belong to an organization to view stations.");

        // --- Step 2: Ensure requested organization is the user's organization (no cross-org access) ---
        if (request.OrganizationId != orgId)
            return Result<IReadOnlyList<StationDto>>.Failure("You do not have access to this organization.");

        // --- Step 3: Load active stations and map to DTOs ---
        var stations = await _stationRepo.GetByOrganizationIdAsync(request.OrganizationId);
        var dtos = stations.Select(s => new StationDto
        {
            Id = s.Id,
            Name = s.Name,
            Address = s.Address,
            Phone = s.Phone,
            LogoUrl = s.LogoUrl,
            IsActive = s.IsActive,
            OMCId = s.OMCId,
        }).ToList();

        return Result<IReadOnlyList<StationDto>>.Success(dtos);
    }
}
