using MediatR;
using Microsoft.AspNetCore.Identity;
using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.Auth;
using FuelFlow.Application.Features.Auth.Commands;
using FuelFlow.Application.Interfaces.Services;
using FuelFlow.Infrastructure.Identity;

namespace FuelFlow.Infrastructure.Features.Auth.Commands;

/// <summary>
/// CQRS Handler: Resends verification email for the given email address.
/// Always returns success with generic message (do not reveal whether email exists or is already verified).
/// </summary>
public class ResendVerificationCommandHandler : IRequestHandler<ResendVerificationCommand, Result<ResendVerificationResponse>>
{
    private readonly IAuthService _authService;
    private readonly UserManager<AppUser> _userManager;

    public ResendVerificationCommandHandler(
        IAuthService authService,
        UserManager<AppUser> userManager)
    {
        _authService = authService;
        _userManager = userManager;
    }

    public async Task<Result<ResendVerificationResponse>> Handle(
        ResendVerificationCommand request,
        CancellationToken cancellationToken)
    {
        var req = request.Request;

        // 1. Find user by email; if not found or already verified, return same success (security: no info leak)
        var user = await _userManager.FindByEmailAsync(req.Email);
        if (user == null)
            return Result<ResendVerificationResponse>.Success(new ResendVerificationResponse());

        if (user.EmailConfirmed)
            return Result<ResendVerificationResponse>.Success(new ResendVerificationResponse());

        // 2. Send verification email
        _ = await _authService.SendVerificationEmailAsync(user.Id, cancellationToken);

        return Result<ResendVerificationResponse>.Success(new ResendVerificationResponse());
    }
}
