using Microsoft.AspNetCore.Identity;
using FuelFlow.Domain.Enums;

namespace FuelFlow.Infrastructure.Identity;

/// <summary>
/// Our custom user class that EXTENDS Identity's IdentityUser.
/// 
/// WHY extend instead of using IdentityUser directly?
/// - IdentityUser gives us: Id, Email, PasswordHash, PhoneNumber, LockoutEnabled, etc.
/// - We add our business fields: FullName, Role, OrganizationId, etc.
/// - We use Guid for Id (not string) for consistency with our other entities
/// 
/// WHY is this in Infrastructure (not Domain)?
/// - It depends on IdentityUser which is a Microsoft.AspNetCore.Identity class
/// - Domain must stay free of framework dependencies
/// - Our Domain User entity is the "pure" business concept
/// - AppUser is the "persistence" version that Identity needs
/// 
/// Think of it this way:
///   Domain.User = "what a user IS" (business concept)
///   Infrastructure.AppUser = "how a user is STORED" (Identity + EF Core)
/// </summary>
public class AppUser : IdentityUser<Guid>
{
    // These come FREE from IdentityUser<Guid>:
    //   Id (Guid), Email, PasswordHash, PhoneNumber,
    //   EmailConfirmed, LockoutEnabled, AccessFailedCount, etc.

    // Our custom business fields:
    public string FullName { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public bool IsActive { get; set; } = true;
    public int SessionTimeoutMins { get; set; } = 30;
    public string? PinHash { get; set; }

    // Every user belongs to an Organization
    public Guid OrganizationId { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
