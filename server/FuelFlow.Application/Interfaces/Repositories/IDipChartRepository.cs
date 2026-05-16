using FuelFlow.Domain.Entities;

namespace FuelFlow.Application.Interfaces.Repositories;

public interface IDipChartRepository
{
    Task<DipChart?> GetByTankIdAsync(Guid tankId, CancellationToken cancellationToken = default);
    Task AddAsync(DipChart dipChart);
    Task DeleteByTankIdAsync(Guid tankId, CancellationToken cancellationToken = default);
}
