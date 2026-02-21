using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.Auth;
using FuelFlow.Application.Features.Auth.Commands;
using FuelFlow.Application.Interfaces.Services;
using FuelFlow.Domain.Enums;
using FuelFlow.Infrastructure.Identity;

namespace FuelFlow.Infrastructure.Features.Auth.Commands;

/// <summary>
/// CQRS Handler: Registers a new owner user.
/// Organization and first station are added during onboarding after first login.
/// Sends verification email; user must verify before login (REG-005).
/// </summary>
public class RegisterCommandHandler : IRequestHandler<RegisterCommand, Result<RegisterResponse>>
{
    private readonly UserManager<AppUser> _userManager;
    private readonly IAuthService _authService;
    private readonly ILogger<RegisterCommandHandler> _logger;

    public RegisterCommandHandler(
        UserManager<AppUser> userManager,
        IAuthService authService,
        ILogger<RegisterCommandHandler> logger)
    {
        _userManager = userManager;
        _authService = authService;
        _logger = logger;
    }

    public async Task<Result<RegisterResponse>> Handle(
        RegisterCommand request,
        CancellationToken cancellationToken)
    {
        var req = request.Request;

        var existingUser = await _userManager.FindByEmailAsync(req.Email);
        if (existingUser != null)
            return Result<RegisterResponse>.Failure("An account with this email already exists.");

        var user = new AppUser
        {
            UserName = req.Email,
            Email = req.Email,
            PhoneNumber = req.Phone,
            FullName = req.FullName,
            Role = UserRole.Owner,
            OrganizationId = null,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        try
        {
            var createUserResult = await _userManager.CreateAsync(user, req.Password);
            if (!createUserResult.Succeeded)
            {
                var errors = string.Join(", ", createUserResult.Errors.Select(e => e.Description));
                return Result<RegisterResponse>.Failure($"Failed to create user: {errors}");
            }

            _ = await _authService.SendVerificationEmailAsync(user.Id, cancellationToken);

            return Result<RegisterResponse>.Success(new RegisterResponse());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Registration failed for email {Email}", req.Email);
            return Result<RegisterResponse>.Failure("An error occurred while creating your account. Please try again later.");
        }
    }
}
