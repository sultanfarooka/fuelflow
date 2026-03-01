using MediatR;
using Microsoft.AspNetCore.Identity;
using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.Auth;
using FuelFlow.Application.Features.Auth.Commands;
using FuelFlow.Infrastructure.Identity;

namespace FuelFlow.Infrastructure.Features.Auth.Commands;

/// <summary>
/// CQRS Handler: Verifies email using token from verification link (userId + token from email).
/// Marks EmailConfirmed true so user can log in.
/// </summary>
public class VerifyEmailCommandHandler : IRequestHandler<VerifyEmailCommand, Result<VerifyEmailResponse>>
{
    private readonly UserManager<AppUser> _userManager;

    public VerifyEmailCommandHandler(UserManager<AppUser> userManager)
    {
        _userManager = userManager;
    }

    public async Task<Result<VerifyEmailResponse>> Handle(
        VerifyEmailCommand request,
        CancellationToken cancellationToken)
    {
        var req = request.Request;

        // 1. Load user; reject if not found (invalid or expired link)
        var user = await _userManager.FindByIdAsync(req.UserId.ToString());
        if (user == null)
            return Result<VerifyEmailResponse>.Failure("Invalid verification link.");

        // 2. Already verified: idempotent success
        if (user.EmailConfirmed)
            return Result<VerifyEmailResponse>.Success(new VerifyEmailResponse { Message = "Email is already verified. You can log in." });

        // 3. Confirm email with Identity (validates token); return errors if failed
        var result = await _userManager.ConfirmEmailAsync(user, req.Token);
        if (!result.Succeeded)
        {
            var errors = string.Join(" ", result.Errors.Select(e => e.Description));
            return Result<VerifyEmailResponse>.Failure($"Verification failed. {errors}".Trim());
        }

        return Result<VerifyEmailResponse>.Success(new VerifyEmailResponse());
    }
}
