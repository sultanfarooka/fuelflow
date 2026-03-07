using FuelFlow.Domain.Entities;

namespace FuelFlow.Application.Interfaces.Repositories;

/// <summary>
/// Repository interface for OMCFuelTypes entity.
/// </summary>
public interface IOMCFuelTypeRepository
{
    Task<IReadOnlyList<OMCFuelTypes>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<OMCFuelTypes>> GetByOMCIdAsync(Guid omcId, CancellationToken cancellationToken = default);
    Task<OMCFuelTypes?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task AddAsync(OMCFuelTypes omcFuelType);
}