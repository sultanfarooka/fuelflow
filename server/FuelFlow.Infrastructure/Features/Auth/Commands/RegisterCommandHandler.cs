using MediatR;
using Microsoft.AspNetCore.Identity;
using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.Auth;
using FuelFlow.Application.Features.Auth.Commands;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Application.Interfaces.Services;
using FuelFlow.Domain.Entities;
using FuelFlow.Domain.Enums;
using FuelFlow.Infrastructure.Identity;

namespace FuelFlow.Infrastructure.Features.Auth.Commands;

/// <summary>
/// CQRS Handler: Registers a new owner with organization only.
/// First station is added during onboarding on first login.
/// Sends verification email; user must verify before login (REG-005).
/// </summary>
public class RegisterCommandHandler : IRequestHandler<RegisterCommand, Result<RegisterResponse>>
{
    private readonly UserManager<AppUser> _userManager;
    private readonly IOrganizationRepository _organizationRepo;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuthService _authService;

    public RegisterCommandHandler(
        UserManager<AppUser> userManager,
        IOrganizationRepository organizationRepo,
        IUnitOfWork unitOfWork,
        IAuthService authService)
    {
        _userManager = userManager;
        _organizationRepo = organizationRepo;
        _unitOfWork = unitOfWork;
        _authService = authService;
    }

    public async Task<Result<RegisterResponse>> Handle(
        RegisterCommand request,
        CancellationToken cancellationToken)
    {
        var req = request.Request;

        // Step 1: Check if email already exists (REG-001)
        var existingUser = await _userManager.FindByEmailAsync(req.Email);
        if (existingUser != null)
            return Result<RegisterResponse>.Failure("An account with this email already exists.");

        // Step 2: Begin transaction — all or nothing (REG-002)
        await _unitOfWork.BeginTransactionAsync();

        try
        {
            // Step 3: Create Organization
            var organization = new Organization
            {
                Name = req.OrganizationName,
                Email = req.Email,
                Phone = req.Phone,
                SubscriptionStatus = SubscriptionStatus.Trial,
                TrialEndsAt = DateTime.UtcNow.AddDays(14),
                RegisteredAt = DateTime.UtcNow,
            };
            await _organizationRepo.AddAsync(organization);
            await _unitOfWork.SaveChangesAsync();

            // Step 4: Create Owner user via Identity
            var user = new AppUser
            {
                UserName = req.Email,
                Email = req.Email,
                PhoneNumber = req.Phone,
                FullName = req.FullName,
                Role = UserRole.Owner,
                OrganizationId = organization.Id,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };

            var createUserResult = await _userManager.CreateAsync(user, req.Password);
            if (!createUserResult.Succeeded)
            {
                await _unitOfWork.RollbackAsync();
                var errors = string.Join(", ", createUserResult.Errors.Select(e => e.Description));
                return Result<RegisterResponse>.Failure($"Failed to create user: {errors}");
            }

            // Step 5: Commit — everything succeeded (first station added on first login)
            await _unitOfWork.CommitAsync();

            // Step 6: Send verification email (outside transaction — user can resend if this fails)
            _ = await _authService.SendVerificationEmailAsync(user.Id, cancellationToken);

            return Result<RegisterResponse>.Success(new RegisterResponse());
        }
        catch (Exception)
        {
            await _unitOfWork.RollbackAsync();
            return Result<RegisterResponse>.Failure("Registration failed. Please try again.");
        }
    }
}
