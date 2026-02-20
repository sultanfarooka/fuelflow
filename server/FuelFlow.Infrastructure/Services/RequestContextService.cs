using Microsoft.AspNetCore.Http;
using FuelFlow.Application.Interfaces.Services;

namespace FuelFlow.Infrastructure.Services;

/// <summary>
/// Reads request metadata (IP, User-Agent) from HttpContext.
/// Used when creating refresh tokens for session tracking.
/// </summary>
public class RequestContextService : IRequestContextService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public RequestContextService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public string? ClientIp =>
        _httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString();

    public string? UserAgent =>
        _httpContextAccessor.HttpContext?.Request.Headers.UserAgent.ToString();
}
