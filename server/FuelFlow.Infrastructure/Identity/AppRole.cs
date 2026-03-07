using Microsoft.AspNetCore.Identity;

namespace FuelFlow.Infrastructure.Identity;

/// <summary>
/// Custom role class for ASP.NET Identity. Uses Guid for Id to match AppUser.
/// </summary>
public class AppRole : IdentityRole<Guid>
{
}
