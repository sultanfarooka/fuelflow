using MediatR;
using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.Auth;
using FuelFlow.Application.Features.Auth.Commands;
using FuelFlow.Application.Interfaces.Services;

namespace FuelFlow.Infrastructure.Features.Auth.Commands;

/// <summary>
/// CQRS Handler: Sends password reset email.
/// Always returns generic success for security (don't reveal if email exists).
/// </summary>
public class ForgotPasswordCommandHandler : IRequestHandler<ForgotPasswordCommand, Result<ForgotPasswordResponse>>
{
    private readonly IAuthService _authService;

    public ForgotPasswordCommandHandler(IAuthService authService)
    {
        _authService = authService;
    }

    public async Task<Result<ForgotPasswordResponse>> Handle(
        ForgotPasswordCommand request,
        CancellationToken cancellationToken)
    {
        _ = await _authService.SendPasswordResetEmailAsync(request.Request.Email, cancellationToken);
        return Result<ForgotPasswordResponse>.Success(new ForgotPasswordResponse());
    }
}
