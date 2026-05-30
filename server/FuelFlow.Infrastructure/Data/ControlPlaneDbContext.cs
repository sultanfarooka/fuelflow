using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using FuelFlow.Domain.Entities;
using FuelFlow.Infrastructure.Identity;

namespace FuelFlow.Infrastructure.Data;

/// <summary>
/// The control-plane database context (M14-F01).
///
/// HOLDS: ASP.NET Identity tables (<c>AspNetUsers</c>, <c>AspNetRoles</c>, etc.)
/// and the platform-wide tables that must be reachable BEFORE a tenant context
/// exists — <see cref="Tenant"/> registry, <see cref="Subscription"/>,
/// <see cref="SubscriptionPlans"/>, <see cref="OMC"/>, <see cref="OMCFuelTypes"/>,
/// <see cref="FuelType"/>, <see cref="PhoneVerification"/>, <see cref="RefreshToken"/>.
///
/// WHY a separate context: login must work before we know which tenant DB to
/// route to. Identity lookups (phone → user → org) hit this context only. Once
/// the JWT carries an <c>org_id</c> claim, subsequent operational queries hit
/// <see cref="AppDbContext"/> via the per-request tenant resolver (M14-F02).
///
/// SHARED PHYSICAL DB IN M14-F01: both this context and <see cref="AppDbContext"/>
/// target the same Postgres database in this PR. F02 splits the connection
/// strings; F03 provisions a separate physical DB per tenant.
/// </summary>
public class ControlPlaneDbContext : IdentityDbContext<AppUser, AppRole, Guid>
{
    public ControlPlaneDbContext(DbContextOptions<ControlPlaneDbContext> options) : base(options)
    {
    }

    // Control-plane business tables (Identity tables AspNetUsers/Roles/etc.
    // are added automatically by the IdentityDbContext base class.)
    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<PhoneVerification> PhoneVerifications => Set<PhoneVerification>();
    public DbSet<Subscription> Subscriptions => Set<Subscription>();
    public DbSet<SubscriptionPlans> SubscriptionPlans => Set<SubscriptionPlans>();
    public DbSet<OMC> OMCs => Set<OMC>();
    public DbSet<OMCFuelTypes> OMCFuelTypes => Set<OMCFuelTypes>();
    public DbSet<FuelType> FuelTypes => Set<FuelType>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // IMPORTANT: Call base first — this configures all Identity tables.
        base.OnModelCreating(modelBuilder);

        // Apply only the configurations under Data/Configurations/ControlPlane/.
        // The matching AppDbContext applies only Data/Configurations/Tenant/.
        // In M14-F01 some control-plane configs (RefreshToken, OMC, FuelType,
        // PhoneVerification, Subscription, SubscriptionPlan, AppUser) still live
        // in the flat Configurations/ folder; they get moved into the
        // ControlPlane subfolder as part of this feature. The namespace filter
        // is intentionally broad until that move completes within Phase 1.
        modelBuilder.ApplyConfigurationsFromAssembly(
            typeof(ControlPlaneDbContext).Assembly,
            t => t.Namespace == "FuelFlow.Infrastructure.Data.Configurations.ControlPlane");
    }
}
