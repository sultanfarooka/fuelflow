using System;

namespace FuelFlow.Application.Interfaces.Services;

/// <summary>
/// Provides information about the current authenticated user based on the
/// active request context (typically HttpContext in the Api layer).
///
/// WHY this abstraction?
/// - Application / Infrastructure code shouldn’t depend directly on HttpContext
/// - Handlers and services can ask for the current user via DI
/// - In tests, you can mock ICurrentUserService without needing a real HTTP request
/// </summary>
public interface ICurrentUserService
{
    /// <summary>
    /// The current user's Id (from JWT NameIdentifier claim), or null if not available.
    /// </summary>
    Guid? UserId { get; }

    /// <summary>
    /// The current user's role (e.g. "Owner", "Manager"), or null if not available.
    /// </summary>
    string? Role { get; }

    /// <summary>
    /// The current user's organization Id (from custom "org_id" claim), or null if not available.
    /// </summary>
    Guid? OrganizationId { get; }
}

