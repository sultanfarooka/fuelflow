using MediatR;
using Microsoft.AspNetCore.Identity;
using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.Auth;
using FuelFlow.Application.Features.Auth.Commands;
using FuelFlow.Infrastructure.Identity;

namespace FuelFlow.Infrastructure.Features.Auth.Commands;

/// <summary>
/// CQRS Handler: Resets password using token from reset link.
/// </summary>
public class ResetPasswordCommandHandler : IRequestHandler<ResetPasswordCommand, Result<ResetPasswordResponse>>
{
    private readonly UserManager<AppUser> _userManager;

    public ResetPasswordCommandHandler(UserManager<AppUser> userManager)
    {
        _userManager = userManager;
    }

    public async Task<Result<ResetPasswordResponse>> Handle(
        ResetPasswordCommand request,
        CancellationToken cancellationToken)
    {
        var req = request.Request;

        var user = await _userManager.FindByIdAsync(req.UserId.ToString());
        if (user == null)
            return Result<ResetPasswordResponse>.Failure("Invalid or expired reset link.");

        var result = await _userManager.ResetPasswordAsync(user, req.Token, req.NewPassword);
        if (!result.Succeeded)
        {
            var errors = string.Join(" ", result.Errors.Select(e => e.Description));
            return Result<ResetPasswordResponse>.Failure($"Reset failed. {errors}".Trim());
        }

        return Result<ResetPasswordResponse>.Success(new ResetPasswordResponse());
    }
}
