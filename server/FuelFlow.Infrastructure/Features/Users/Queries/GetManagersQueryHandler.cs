using MediatR;
using Microsoft.AspNetCore.Identity;
using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.Users;
using FuelFlow.Application.Features.Users.Queries;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Application.Interfaces.Services;
using FuelFlow.Domain.Enums;
using FuelFlow.Infrastructure.Identity;

namespace FuelFlow.Infrastructure.Features.Users.Queries;

/// <summary>
/// CQRS Handler: list Manager users in the current Owner's organization ([M01-F05-R02]).
/// Managers live in the control plane (Identity); their station assignments live in the
/// tenant DB. The organization is taken from the authenticated caller, never the client.
/// </summary>
public class GetManagersQueryHandler : IRequestHandler<GetManagersQuery, Result<List<ManagerListItemDto>>>
{
    private readonly UserManager<AppUser> _userManager;
    private readonly ICurrentUserService _currentUser;
    private readonly IStationRepository _stationRepo;
    private readonly IUserStationRepository _userStationRepo;

    public GetManagersQueryHandler(
        UserManager<AppUser> userManager,
        ICurrentUserService currentUser,
        IStationRepository stationRepo,
        IUserStationRepository userStationRepo)
    {
        _userManager = userManager;
        _currentUser = currentUser;
        _stationRepo = stationRepo;
        _userStationRepo = userStationRepo;
    }

    public async Task<Result<List<ManagerListItemDto>>> Handle(GetManagersQuery request, CancellationToken cancellationToken)
    {
        var orgId = _currentUser.OrganizationId;
        if (orgId is null)
            return Result<List<ManagerListItemDto>>.Failure("You must belong to an organization.");

        // Managers across the control plane, scoped to this organization.
        var managers = (await _userManager.GetUsersInRoleAsync(UserRole.Manager.ToString()))
            .Where(u => u.OrganizationId == orgId.Value)
            .OrderBy(u => u.FullName)
            .ToList();

        // Resolve station names once for the org (id -> name).
        var stations = await _stationRepo.GetByOrganizationIdAsync(orgId.Value);
        var stationNameById = stations.ToDictionary(s => s.Id, s => s.Name);

        var items = new List<ManagerListItemDto>(managers.Count);
        foreach (var m in managers)
        {
            var stationIds = await _userStationRepo.GetStationIdsByUserIdAsync(m.Id, cancellationToken);
            items.Add(new ManagerListItemDto
            {
                Id = m.Id,
                FullName = m.FullName,
                Phone = m.PhoneNumber,
                Email = m.Email,
                IsActive = m.IsActive,
                PhoneConfirmed = m.PhoneNumberConfirmed,
                Stations = stationIds
                    .Where(stationNameById.ContainsKey)
                    .Select(id => new StationRefDto { Id = id, Name = stationNameById[id] })
                    .ToList(),
            });
        }

        return Result<List<ManagerListItemDto>>.Success(items);
    }
}
