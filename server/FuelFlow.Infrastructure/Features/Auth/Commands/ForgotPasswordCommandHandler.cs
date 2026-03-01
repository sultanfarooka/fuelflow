using MediatR;
using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.Auth;
using FuelFlow.Application.Features.Auth.Commands;
using FuelFlow.Application.Interfaces.Services;

namespace FuelFlow.Infrastructure.Features.Auth.Commands;

/// <summary>
/// CQRS Handler: Sends password reset email for the given email address.
/// Always returns success (generic message) so we do not reveal whether the email exists.
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
        // Delegate to auth service; it handles "email not found" internally and never leaks that info
        _ = await _authService.SendPasswordResetEmailAsync(request.Request.Email, cancellationToken);
        return Result<ForgotPasswordResponse>.Success(new ForgotPasswordResponse());
    }
}
