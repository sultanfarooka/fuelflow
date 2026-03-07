using MediatR;
using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.OMCFuelType;
using FuelFlow.Application.Features.OMCFuelType.Queries;
using FuelFlow.Application.Interfaces.Repositories;

namespace FuelFlow.Infrastructure.Features.OMCFuelType.Queries;

/// <summary>
/// Returns OMC fuel types, optionally filtered by OMC.
/// </summary>
public class GetOMCFuelTypesQueryHandler : IRequestHandler<GetOMCFuelTypesQuery, Result<IReadOnlyList<OMCFuelTypeDto>>>
{
    private readonly IOMCFuelTypeRepository _repo;

    public GetOMCFuelTypesQueryHandler(IOMCFuelTypeRepository repo)
    {
        _repo = repo;
    }

    public async Task<Result<IReadOnlyList<OMCFuelTypeDto>>> Handle(
        GetOMCFuelTypesQuery request,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<OMCFuelTypes> list = request.OMCId.HasValue
            ? await _repo.GetByOMCIdAsync(request.OMCId.Value, cancellationToken)
            : await _repo.GetAllAsync(cancellationToken);

        var dtos = list.Select(ft => new OMCFuelTypeDto
        {
            Id = ft.Id,
            OMCId = ft.OMCId,
            OMCName = ft.OMC?.Name ?? string.Empty,
            Name = ft.Name,
            Unit = ft.Unit,
        }).ToList();

        return Result<IReadOnlyList<OMCFuelTypeDto>>.Success(dtos);
    }
}
