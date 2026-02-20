using MediatR;
using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.Auth;
using FuelFlow.Application.Features.Auth.Commands;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Infrastructure.Services;

namespace FuelFlow.Infrastructure.Features.Auth.Commands;

/// <summary>
/// CQRS Handler: Revokes the refresh token (logout).
/// Always returns success — client clears tokens regardless.
/// </summary>
public class LogoutCommandHandler : IRequestHandler<LogoutCommand, Result<LogoutResponse>>
{
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
        var refreshToken = request.Request.RefreshToken?.Trim();
        if (string.IsNullOrEmpty(refreshToken))
            return Result<LogoutResponse>.Success(new LogoutResponse()); // Idempotent — no token to revoke

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
