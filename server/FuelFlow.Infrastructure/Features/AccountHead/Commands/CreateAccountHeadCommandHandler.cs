using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.AccountHead;
using FuelFlow.Application.Features.AccountHead.Commands;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Application.Interfaces.Services;
using FuelFlow.Domain.Enums;
using FuelFlow.Infrastructure.Features.AccountHead.Queries;
using MediatR;
using Microsoft.Extensions.Logging;
using AccountHeadEntity = FuelFlow.Domain.Entities.AccountHead;

namespace FuelFlow.Infrastructure.Features.AccountHead.Commands;

public class CreateAccountHeadCommandHandler : IRequestHandler<CreateAccountHeadCommand, Result<AccountHeadDto>>
{
    private readonly IAccountHeadRepository _repo;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;
    private readonly ILogger<CreateAccountHeadCommandHandler> _logger;

    public CreateAccountHeadCommandHandler(
        IAccountHeadRepository repo,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUser,
        ILogger<CreateAccountHeadCommandHandler> logger)
    {
        _repo = repo;
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _logger = logger;
    }

    public async Task<Result<AccountHeadDto>> Handle(CreateAccountHeadCommand request, CancellationToken ct)
    {
        var orgId = _currentUser.OrganizationId;
        if (orgId == null)
            return Result<AccountHeadDto>.Failure("You must belong to an organization.");

        var req = request.Request;

        if (await _repo.ExistsByNameAsync(orgId.Value, req.Name.Trim(), ct))
            return Result<AccountHeadDto>.Failure($"An account head named '{req.Name}' already exists.");

        var head = new AccountHeadEntity
        {
            Id = Guid.NewGuid(),
            Name = req.Name.Trim(),
            Type = (AccountHeadType)req.Type,
            Description = req.Description?.Trim(),
            IsActive = true,
            IsSystemManaged = false,
            OrganizationId = orgId.Value,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        try
        {
            await _repo.AddAsync(head, ct);
            await _unitOfWork.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create account head {Name} for org {OrgId}", req.Name, orgId);
            return Result<AccountHeadDto>.Failure("Failed to save account head.");
        }

        return Result<AccountHeadDto>.Success(GetAccountHeadsQueryHandler.ToDto(head));
    }
}
