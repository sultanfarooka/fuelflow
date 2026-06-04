using System.Text.Json;
using FuelFlow.Application.Common.Exceptions;

namespace FuelFlow.Api.Middleware;

/// <summary>
/// Maps <see cref="TenantNotFoundException"/> to HTTP 503 Service Unavailable.
/// Registered before <c>UseAuthentication</c> so the middleware runs even when
/// an authenticated request fires before the tenant database is ready (M14-F03-R03).
/// </summary>
public class TenantExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<TenantExceptionMiddleware> _logger;

    public TenantExceptionMiddleware(RequestDelegate next, ILogger<TenantExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (TenantNotFoundException ex)
        {
            _logger.LogWarning("Tenant database unavailable for org {OrgId}", ex.OrganizationId);

            context.Response.StatusCode = StatusCodes.Status503ServiceUnavailable;
            context.Response.ContentType = "application/json";

            var body = JsonSerializer.Serialize(new { error = "Tenant database unavailable." });
            await context.Response.WriteAsync(body);
        }
    }
}
