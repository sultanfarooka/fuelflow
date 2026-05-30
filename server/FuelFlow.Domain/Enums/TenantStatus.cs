namespace FuelFlow.Domain.Enums;

/// <summary>
/// Lifecycle status of a Tenant (== Organization) in the control-plane registry.
///
/// WHY: After M14-F03, each Organization is provisioned its own physical
/// Postgres database. The control-plane <c>Tenant</c> row tracks where that
/// provisioning sits in its lifecycle so connection resolution, billing, and
/// platform admin can make decisions without inspecting the tenant DB itself.
///
/// In M14-F01 (this feature) the field is introduced for forward-compatibility:
/// every newly-created Tenant row defaults to <c>Active</c> because there is
/// still only one physical DB. F02/F03 begin using <c>Provisioning</c> while a
/// new database is being created + migrated.
///
/// Transitions:
///   Provisioning → Active     (provisioning completed)
///   Provisioning → Deleted    (provisioning failed, compensating drop)
///   Active       → Suspended  (non-payment or platform-admin action)
///   Suspended    → Active     (re-activated)
///   Active       → Deleted    (tenant export + DROP DATABASE)
/// </summary>
public enum TenantStatus
{
    Provisioning,
    Active,
    Suspended,
    Deleted
}
