using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.AccountHead;
using FuelFlow.Application.Features.AccountHead.Commands;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Application.Interfaces.Services;
using FuelFlow.Infrastructure.Features.AccountHead.Queries;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FuelFlow.Infrastructure.Features.AccountHead.Commands;

public class UpdateAccountHeadCommandHandler : IRequestHandler<UpdateAccountHeadCommand, Result<AccountHeadDto>>
{
    private readonly IAccountHeadRepository _repo;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;
    private readonly ILogger<UpdateAccountHeadCommandHandler> _logger;

    public UpdateAccountHeadCommandHandler(
        IAccountHeadRepository repo,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUser,
        ILogger<UpdateAccountHeadCommandHandler> logger)
    {
        _repo = repo;
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _logger = logger;
    }

    public async Task<Result<AccountHeadDto>> Handle(UpdateAccountHeadCommand request, CancellationToken ct)
    {
        var orgId = _currentUser.OrganizationId;
        if (orgId == null)
            return Result<AccountHeadDto>.Failure("You must belong to an organization.");

        var head = await _repo.GetByIdAsync(request.Id, orgId.Value, ct);
        if (head == null)
            return Result<AccountHeadDto>.Failure("Account head not found.");

        var newName = request.Request.Name.Trim();

        if (!string.Equals(head.Name, newName, StringComparison.OrdinalIgnoreCase)
            && await _repo.ExistsByNameAsync(orgId.Value, newName, ct))
            return Result<AccountHeadDto>.Failure($"An account head named '{newName}' already exists.");

        head.Name = newName;
        head.Description = request.Request.Description?.Trim();
        head.UpdatedAt = DateTime.UtcNow;

        try
        {
            await _unitOfWork.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update account head {Id}", request.Id);
            return Result<AccountHeadDto>.Failure("Failed to update account head.");
        }

        return Result<AccountHeadDto>.Success(GetAccountHeadsQueryHandler.ToDto(head));
    }
}
