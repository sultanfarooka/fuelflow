using MediatR;
using Microsoft.Extensions.Logging;
using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.OMCFuelType;
using FuelFlow.Application.Features.OMCFuelType.Commands;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Domain.Entities;

namespace FuelFlow.Infrastructure.Features.OMCFuelType.Commands;

/// <summary>
/// Creates a new OMC fuel type.
/// </summary>
public class CreateOMCFuelTypeCommandHandler : IRequestHandler<CreateOMCFuelTypeCommand, Result<CreateOMCFuelTypeResponse>>
{
    private readonly IOMCFuelTypeRepository _omcFuelTypeRepo;
    private readonly IOMCRepository _omcRepo;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<CreateOMCFuelTypeCommandHandler> _logger;

    public CreateOMCFuelTypeCommandHandler(
        IOMCFuelTypeRepository omcFuelTypeRepo,
        IOMCRepository omcRepo,
        IUnitOfWork unitOfWork,
        ILogger<CreateOMCFuelTypeCommandHandler> logger)
    {
        _omcFuelTypeRepo = omcFuelTypeRepo;
        _omcRepo = omcRepo;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Result<CreateOMCFuelTypeResponse>> Handle(
        CreateOMCFuelTypeCommand request,
        CancellationToken cancellationToken)
    {
        var req = request.Request;

        var omc = await _omcRepo.GetByIdAsync(req.OMCId, cancellationToken);
        if (omc == null)
            return Result<CreateOMCFuelTypeResponse>.Failure("OMC not found.");

        var entity = new OMCFuelTypes
        {
            OMCId = req.OMCId,
            Name = req.Name.Trim(),
        };

        try
        {
            await _omcFuelTypeRepo.AddAsync(entity);
            await _unitOfWork.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create OMC fuel type {Name} for OMC {OMCId}", req.Name, req.OMCId);
            return Result<CreateOMCFuelTypeResponse>.Failure("Failed to create OMC fuel type.");
        }

        return Result<CreateOMCFuelTypeResponse>.Success(new CreateOMCFuelTypeResponse
        {
            Id = entity.Id,
            OMCId = entity.OMCId,
            Name = entity.Name,
        });
    }
}
