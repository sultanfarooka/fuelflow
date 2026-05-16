using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Application.Interfaces.Services;
using FuelFlow.Infrastructure.Data;
using Microsoft.Extensions.Hosting;
using FuelFlow.Infrastructure.Features.Auth.Commands;
using FuelFlow.Infrastructure.Identity;
using FuelFlow.Infrastructure.Repositories;
using FuelFlow.Infrastructure.Services;

namespace FuelFlow.Infrastructure;

/// <summary>
/// Extension method to register all Infrastructure services in one call.
/// 
/// WHY an extension method?
/// - Keeps Program.cs clean (one line: builder.Services.AddInfrastructure(config))
/// - All Infrastructure DI registration lives here, not scattered in Program.cs
/// - Each layer is responsible for registering its own services
/// 
/// HOW it's used in Program.cs:
///   builder.Services.AddInfrastructure(builder.Configuration);
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // 1. Register PostgreSQL + EF Core
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(
                configuration.GetConnectionString("DefaultConnection")));

        // 2. Register ASP.NET Identity
        services.AddIdentity<AppUser, AppRole>(options =>
        {
            // Password rules (from PRD: min 6 chars, must include number)
            options.Password.RequiredLength = 6;
            options.Password.RequireDigit = true;
            options.Password.RequireUppercase = false;   // Not in PRD requirements
            options.Password.RequireLowercase = false;   // Not in PRD requirements
            options.Password.RequireNonAlphanumeric = false; // Not in PRD requirements

            // Lockout settings
            options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
            options.Lockout.MaxFailedAccessAttempts = 5;

            // User settings
            options.User.RequireUniqueEmail = true;
        })
        .AddEntityFrameworkStores<AppDbContext>()
        .AddDefaultTokenProviders();

        // 2b. Password reset token expiry (default 1 day; explicit for clarity)
        services.Configure<DataProtectionTokenProviderOptions>(options =>
        {
            options.TokenLifespan = TimeSpan.FromHours(24);
        });

        // 3. Register repositories
        services.AddScoped<IOrganizationRepository, OrganizationRepository>();
        services.AddScoped<IStationRepository, StationRepository>();
        services.AddScoped<IFuelTankRepository, FuelTankRepository>();
        services.AddScoped<IDipChartRepository, DipChartRepository>();
        services.AddScoped<IFuelTypeRepository, FuelTypeRepository>();
        services.AddScoped<IFuelPricesRepository, FuelPricesRepository>();
        services.AddScoped<IFuelNozzleRepository, FuelNozzleRepository>();
        services.AddScoped<IStationShiftRepository, StationShiftRepository>();
        services.AddScoped<IShiftAssignmentRepository, ShiftAssignmentRepository>();
        services.AddScoped<IOMCRepository, OMCRepository>();
        services.AddScoped<IOMCFuelTypeRepository, OMCFuelTypeRepository>();
        services.AddScoped<IUserStationRepository, UserStationRepository>();
        services.AddScoped<ISubscriptionRepository, SubscriptionRepository>();
        services.AddScoped<ISubscriptionPlanRepository, SubscriptionPlanRepository>();
        services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        // 4. Register services
        services.AddScoped<IEmailSender, SmtpEmailSender>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<JwtTokenService>();
        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddScoped<IRequestContextService, RequestContextService>();

        // 5. Register MediatR (CQRS handlers from Infrastructure)
        services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(RegisterCommandHandler).Assembly));

        // 6. Data seeder (runs on startup, idempotent — seeds OMCs, OMCFuelTypes, SubscriptionPlans if not present)
        services.AddHostedService<DataSeeder>();

        return services;
    }
}
