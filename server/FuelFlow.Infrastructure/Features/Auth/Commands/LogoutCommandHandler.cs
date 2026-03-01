using MediatR;
using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.Auth;
using FuelFlow.Application.Features.Auth.Commands;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Infrastructure.Services;

namespace FuelFlow.Infrastructure.Features.Auth.Commands;

/// <summary>
/// CQRS Handler: Revokes the refresh token (logout). If token is provided and found, marks it revoked.
/// Always returns success so client can clear cookies regardless of server state.
/// </summary>
public class LogoutCommandHandler : IRequestHandler<LogoutCommand, Result<LogoutResponse>>
{
    // Dependencies: refresh token repo to revoke, unit of work to save, JWT to hash incoming token
    private readonly IRefreshTokenRepository _refreshTokenRepo;
    private readonly IUnitOfWork _unitOfWork;
    private readonly JwtTokenService _jwtTokenService;

    public LogoutCommandHandler(
        IRefreshTokenRepository refreshTokenRepo,
        IUnitOfWork unitOfWork,
        JwtTokenService jwtTokenService)
    {
        _refreshTokenRepo = refreshTokenRepo;
        _unitOfWork = unitOfWork;
        _jwtTokenService = jwtTokenService;
    }

    public async Task<Result<LogoutResponse>> Handle(
        LogoutCommand request,
        CancellationToken cancellationToken)
    {
        // 1. No token provided: idempotent success (client clears cookies anyway)
        var refreshToken = request.Request.RefreshToken?.Trim();
        if (string.IsNullOrEmpty(refreshToken))
            return Result<LogoutResponse>.Success(new LogoutResponse());

        // 2. Look up token by hash; if found and not already revoked, revoke it
        var tokenHash = _jwtTokenService.HashRefreshToken(refreshToken);
        var existingToken = await _refreshTokenRepo.GetByTokenHashAsync(tokenHash);

        if (existingToken != null && existingToken.RevokedAt == null)
        {
            existingToken.RevokedAt = DateTime.UtcNow;
            existingToken.UpdatedAt = DateTime.UtcNow;
            await _unitOfWork.SaveChangesAsync();
        }

        return Result<LogoutResponse>.Success(new LogoutResponse());
    }
}
