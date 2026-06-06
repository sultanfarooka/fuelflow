using FuelFlow.Application.Common;
using FuelFlow.Application.Features.AccountHead.Commands;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Application.Interfaces.Services;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FuelFlow.Infrastructure.Features.AccountHead.Commands;

public class DeactivateAccountHeadCommandHandler : IRequestHandler<DeactivateAccountHeadCommand, Result<bool>>
{
    private readonly IAccountHeadRepository _repo;
    private readonly IAccountHeadUsageChecker _usageChecker;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;
    private readonly ILogger<DeactivateAccountHeadCommandHandler> _logger;

    public DeactivateAccountHeadCommandHandler(
        IAccountHeadRepository repo,
        IAccountHeadUsageChecker usageChecker,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUser,
        ILogger<DeactivateAccountHeadCommandHandler> logger)
    {
        _repo = repo;
        _usageChecker = usageChecker;
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _logger = logger;
    }

    public async Task<Result<bool>> Handle(DeactivateAccountHeadCommand request, CancellationToken ct)
    {
        var orgId = _currentUser.OrganizationId;
        if (orgId == null)
            return Result<bool>.Failure("You must belong to an organization.");

        var head = await _repo.GetByIdAsync(request.Id, orgId.Value, ct);
        if (head == null)
            return Result<bool>.Failure("Account head not found.");

        if (head.IsSystemManaged)
            return Result<bool>.Failure("System-managed account heads cannot be deactivated.");

        if (await _usageChecker.HasTransactionsAsync(request.Id, ct))
            return Result<bool>.Failure("Account head has existing transactions and cannot be deactivated.");

        head.IsActive = false;
        head.UpdatedAt = DateTime.UtcNow;

        try
        {
            await _unitOfWork.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to deactivate account head {Id}", request.Id);
            return Result<bool>.Failure("Failed to deactivate account head.");
        }

        return Result<bool>.Success(true);
    }
}
