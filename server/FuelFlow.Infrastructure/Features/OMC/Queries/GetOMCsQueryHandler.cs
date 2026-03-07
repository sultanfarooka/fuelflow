using MediatR;
using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.OMC;
using FuelFlow.Application.Features.OMC.Queries;
using FuelFlow.Application.Interfaces.Repositories;

namespace FuelFlow.Infrastructure.Features.OMC.Queries;

/// <summary>
/// Returns all OMCs.
/// </summary>
public class GetOMCsQueryHandler : IRequestHandler<GetOMCsQuery, Result<IReadOnlyList<OMCDto>>>
{
    private readonly IOMCRepository _omcRepo;

    public GetOMCsQueryHandler(IOMCRepository omcRepo)
    {
        _omcRepo = omcRepo;
    }

    public async Task<Result<IReadOnlyList<OMCDto>>> Handle(
        GetOMCsQuery request,
        CancellationToken cancellationToken)
    {
        var list = await _omcRepo.GetAllAsync(cancellationToken);
        var dtos = list.Select(o => new OMCDto
        {
            Id = o.Id,
            Name = o.Name,
            Email = o.Email,
            Address = string.IsNullOrEmpty(o.Address) ? null : o.Address,
            Phone = string.IsNullOrEmpty(o.Phone) ? null : o.Phone,
        }).ToList();

        return Result<IReadOnlyList<OMCDto>>.Success(dtos);
    }
}
