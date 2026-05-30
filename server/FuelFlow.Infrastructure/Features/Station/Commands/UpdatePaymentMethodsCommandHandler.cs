using MediatR;
using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.Station;
using FuelFlow.Application.Features.Station.Commands;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Application.Interfaces.Services;

namespace FuelFlow.Infrastructure.Features.Station.Commands;

public class UpdatePaymentMethodsCommandHandler : IRequestHandler<UpdatePaymentMethodsCommand, Result<StationDto>>
{
    private readonly ICurrentUserService _currentUser;
    private readonly IStationRepository _stationRepo;
    private readonly IUnitOfWork _unitOfWork;

    public UpdatePaymentMethodsCommandHandler(
        ICurrentUserService currentUser,
        IStationRepository stationRepo,
        IUnitOfWork unitOfWork)
    {
        _currentUser = currentUser;
        _stationRepo = stationRepo;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<StationDto>> Handle(UpdatePaymentMethodsCommand request, CancellationToken ct)
    {
        var orgId = _currentUser.OrganizationId;
        if (orgId == null)
            return Result<StationDto>.Failure("You must belong to an organization.");

        var station = await _stationRepo.GetByIdAsync(request.StationId, ct);
        if (station == null || station.OrganizationId != orgId)
            return Result<StationDto>.Failure("Station not found or access denied.");

        station.AcceptedPaymentMethods = request.Request.Methods;
        station.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.SaveChangesAsync();

        return Result<StationDto>.Success(new StationDto
        {
            Id = station.Id,
            Name = station.Name,
            Address = station.Address,
            Phone = station.Phone,
            LogoUrl = station.LogoUrl,
            IsActive = station.IsActive,
            OMCId = station.OMCId,
            IsSetupComplete = station.IsSetupComplete,
            AcceptedPaymentMethods = station.AcceptedPaymentMethods,
        });
    }
}
