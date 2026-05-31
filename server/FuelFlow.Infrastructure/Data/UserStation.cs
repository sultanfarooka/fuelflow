using FuelFlow.Domain.Entities;

namespace FuelFlow.Infrastructure.Data;

/// <summary>
/// Junction entity for many-to-many between Station (per-tenant) and AppUser (control plane).
/// Domain uses Station.Employees (ignored at persistence); the row carries plain Guid FKs.
///
/// WHY: M14-F01 separated Identity into the ControlPlaneDbContext while operational
/// entities (Station + this junction) live in AppDbContext. With both contexts targeting
/// different physical databases from M14-F03 onward, a direct AppUser navigation is no
/// longer expressible as an EF Core foreign key. The previous `AppUser User` navigation
/// was removed; <see cref="UserId"/> is now a plain Guid whose existence is enforced in
/// handlers via the control-plane AppUser repository before insert/update.
/// </summary>
public class UserStation
{
    public Guid StationId { get; set; }
    public Station Station { get; set; } = null!;

    public Guid UserId { get; set; }
}
