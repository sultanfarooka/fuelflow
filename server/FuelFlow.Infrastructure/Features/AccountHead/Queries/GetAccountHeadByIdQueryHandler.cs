using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.AccountHead;
using FuelFlow.Application.Features.AccountHead.Queries;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Application.Interfaces.Services;
using MediatR;

namespace FuelFlow.Infrastructure.Features.AccountHead.Queries;

public class GetAccountHeadByIdQueryHandler : IRequestHandler<GetAccountHeadByIdQuery, Result<AccountHeadDto>>
{
    private readonly IAccountHeadRepository _repo;
    private readonly ICurrentUserService _currentUser;

    public GetAccountHeadByIdQueryHandler(IAccountHeadRepository repo, ICurrentUserService currentUser)
    {
        _repo = repo;
        _currentUser = currentUser;
    }

    public async Task<Result<AccountHeadDto>> Handle(GetAccountHeadByIdQuery request, CancellationToken ct)
    {
        var orgId = _currentUser.OrganizationId;
        if (orgId == null)
            return Result<AccountHeadDto>.Failure("You must belong to an organization.");

        var head = await _repo.GetByIdAsync(request.Id, orgId.Value, ct);
        if (head == null)
            return Result<AccountHeadDto>.Failure("Account head not found.");

        return Result<AccountHeadDto>.Success(GetAccountHeadsQueryHandler.ToDto(head));
    }
}
