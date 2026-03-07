using MediatR;
using Microsoft.Extensions.Logging;
using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.OMC;
using FuelFlow.Application.Features.OMC.Commands;
using FuelFlow.Application.Interfaces.Repositories;

namespace FuelFlow.Infrastructure.Features.OMC.Commands;

/// <summary>
/// Creates a new OMC (Oil Marketing Company).
/// </summary>
public class CreateOMCCommandHandler : IRequestHandler<CreateOMCCommand, Result<CreateOMCResponse>>
{
    private readonly IOMCRepository _omcRepo;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<CreateOMCCommandHandler> _logger;

    public CreateOMCCommandHandler(
        IOMCRepository omcRepo,
        IUnitOfWork unitOfWork,
        ILogger<CreateOMCCommandHandler> logger)
    {
        _omcRepo = omcRepo;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Result<CreateOMCResponse>> Handle(
        CreateOMCCommand request,
        CancellationToken cancellationToken)
    {
        var req = request.Request;

        var omc = new global::OMC
        {
            Name = req.Name.Trim(),
            Email = req.Email.Trim(),
            Address = string.IsNullOrWhiteSpace(req.Address) ? string.Empty : req.Address.Trim(),
            Phone = string.IsNullOrWhiteSpace(req.Phone) ? string.Empty : req.Phone.Trim(),
            Website = string.IsNullOrWhiteSpace(req.Website) ? string.Empty : req.Website.Trim(),
            LogoUrl = string.IsNullOrWhiteSpace(req.LogoUrl) ? string.Empty : req.LogoUrl.Trim(),
            ContactPerson = string.IsNullOrWhiteSpace(req.ContactPerson) ? string.Empty : req.ContactPerson.Trim(),
            ContactPersonEmail = string.IsNullOrWhiteSpace(req.ContactPersonEmail) ? string.Empty : req.ContactPersonEmail.Trim(),
            ContactPersonPhone = string.IsNullOrWhiteSpace(req.ContactPersonPhone) ? string.Empty : req.ContactPersonPhone.Trim(),
        };

        try
        {
            await _omcRepo.AddAsync(omc);
            await _unitOfWork.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create OMC {Name}", req.Name);
            return Result<CreateOMCResponse>.Failure("Failed to create OMC.");
        }

        return Result<CreateOMCResponse>.Success(new CreateOMCResponse
        {
            Id = omc.Id,
            Name = omc.Name,
        });
    }
}
