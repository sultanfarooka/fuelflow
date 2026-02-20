using Microsoft.AspNetCore.Identity;

namespace FuelFlow.Infrastructure.Identity;

/// <summary>
/// Custom role class for Identity.
/// 
/// WHY Guid instead of default string?
/// - Consistency — all our IDs are Guid (UUID in PostgreSQL)
/// - Better for distributed systems (no auto-increment collisions)
/// 
/// For now this is empty (just sets the key type to Guid).
/// Later we can add custom properties like Description, IsSystemRole, etc.
/// </summary>
public class AppRole : IdentityRole<Guid>
{
}
