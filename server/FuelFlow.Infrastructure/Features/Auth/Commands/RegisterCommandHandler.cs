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
/// CQRS Handler: Registers a new user as Owner (email, password, full name, optional phone).
/// Does not create an organization or station; those are created during onboarding.
/// Sends a verification email; the user must verify before they can log in (REG-005).
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

    /// <summary>
    /// Creates the user in Identity (hashed password), assigns Owner role, and sends verification email.
    /// Returns success with an empty response; the client should redirect to "check your email" / login.
    /// </summary>
    public async Task<Result<RegisterResponse>> Handle(
        RegisterCommand request,
        CancellationToken cancellationToken)
    {
        var req = request.Request;

        // --- Step 1: Reject if email is already registered ---
        var existingUser = await _userManager.FindByEmailAsync(req.Email);
        if (existingUser != null)
            return Result<RegisterResponse>.Failure("An account with this email already exists.");

        try
        {
            // --- Step 2: Create user entity (OrganizationId null until onboarding) ---
            var user = new AppUser
            {
                UserName = req.Email,
                Email = req.Email,
                PhoneNumber = req.Phone,
                FullName = req.FullName,
                OrganizationId = null,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };

            // --- Step 3: Persist user with Identity (password is hashed); return any validation errors ---
            var createUserResult = await _userManager.CreateAsync(user, req.Password);
            if (!createUserResult.Succeeded)
            {
                var errors = string.Join(", ", createUserResult.Errors.Select(e => e.Description));
                return Result<RegisterResponse>.Failure($"Failed to create user: {errors}");
            }

            // --- Step 4: Assign Owner role (from AspNetRoles) ---
            var addRoleResult = await _userManager.AddToRoleAsync(user, UserRole.Owner.ToString());
            if (!addRoleResult.Succeeded)
            {
                var errors = string.Join(", ", addRoleResult.Errors.Select(e => e.Description));
                _logger.LogWarning("Failed to assign Owner role to user {UserId}: {Errors}", user.Id, errors);
            }

            // --- Step 5: Send verification email; user must verify before login ---
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
