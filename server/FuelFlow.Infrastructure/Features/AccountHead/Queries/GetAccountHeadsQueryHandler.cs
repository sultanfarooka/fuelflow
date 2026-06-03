using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.AccountHead;
using FuelFlow.Application.Features.AccountHead.Queries;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Application.Interfaces.Services;
using FuelFlow.Domain.Enums;
using MediatR;

namespace FuelFlow.Infrastructure.Features.AccountHead.Queries;

public class GetAccountHeadsQueryHandler : IRequestHandler<GetAccountHeadsQuery, Result<List<AccountHeadDto>>>
{
    private readonly IAccountHeadRepository _repo;
    private readonly ICurrentUserService _currentUser;

    public GetAccountHeadsQueryHandler(IAccountHeadRepository repo, ICurrentUserService currentUser)
    {
        _repo = repo;
        _currentUser = currentUser;
    }

    public async Task<Result<List<AccountHeadDto>>> Handle(GetAccountHeadsQuery request, CancellationToken ct)
    {
        var orgId = _currentUser.OrganizationId;
        if (orgId == null)
            return Result<List<AccountHeadDto>>.Failure("You must belong to an organization.");

        var heads = await _repo.GetAllAsync(orgId.Value, request.Type, ct);
        return Result<List<AccountHeadDto>>.Success(heads.Select(ToDto).ToList());
    }

    internal static AccountHeadDto ToDto(Domain.Entities.AccountHead h) => new()
    {
        Id = h.Id,
        Name = h.Name,
        Type = h.Type == AccountHeadType.Income ? "Income" : "Expense",
        Description = h.Description,
        IsActive = h.IsActive,
        IsSystemManaged = h.IsSystemManaged,
    };
}
