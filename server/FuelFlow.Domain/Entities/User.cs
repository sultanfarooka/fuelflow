using FuelFlow.Domain.Common;
using FuelFlow.Domain.Enums;

namespace FuelFlow.Domain.Entities;

/// <summary>
/// A person who can log into the system. 
/// 
/// IMPORTANT — Clean Architecture decision:
/// This is our DOMAIN User entity, separate from ASP.NET Identity's IdentityUser.
/// In Infrastructure, we'll create an AppUser class that extends IdentityUser
/// and maps to this domain concept. This keeps Domain free from Identity dependencies.
/// 
/// WHY separate from Identity?
/// - Domain should not know about password hashing algorithms or security tokens
/// - Identity is an implementation detail (we could swap it for another auth system)
/// - Domain only cares about: who is this person, what's their role, which org do they belong to
/// 
/// From PRD: Users have roles (Owner, Manager, Nozzleman, Custom) and can be
/// assigned to multiple stations via a junction table.
/// </summary>
public class User : BaseEntity
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public UserRole Role { get; set; }
    public bool IsActive { get; set; } = true;
    public int SessionTimeoutMins { get; set; } = 30;

    // Every user belongs to an Organization
    public Guid OrganizationId { get; set; }
    public Organization Organization { get; set; } = null!;
}
