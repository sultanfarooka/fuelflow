using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using FuelFlow.Application.Interfaces.Services;

namespace FuelFlow.Infrastructure.Services;

/// <summary>
/// Reads the current user's information from HttpContext and exposes it via
/// the ICurrentUserService abstraction for use in handlers and services.
/// 
/// This keeps HttpContext out of the Application layer and makes it easy
/// to mock in unit tests.
/// </summary>
public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    private ClaimsPrincipal? User => _httpContextAccessor.HttpContext?.User;

    public Guid? UserId
    {
        get
        {
            var value = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.TryParse(value, out var id) ? id : null;
        }
    }

    public string? Role => User?.FindFirst(ClaimTypes.Role)?.Value;

    public Guid? OrganizationId
    {
        get
        {
            var value = User?.FindFirst("org_id")?.Value;
            return Guid.TryParse(value, out var id) ? id : null;
        }
    }
}

