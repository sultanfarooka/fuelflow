using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Application.Interfaces.Services;
using FuelFlow.Infrastructure.Data;
using Microsoft.Extensions.Hosting;
using FuelFlow.Infrastructure.Features.Auth.Commands;
using FuelFlow.Infrastructure.Identity;
using FuelFlow.Infrastructure.Repositories;
using FuelFlow.Infrastructure.Services;
using FuelFlow.Infrastructure.Services.Options;
using FuelFlow.Infrastructure.Services.Otp;

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
        IConfiguration configuration,
        IHostEnvironment environment)
    {
        // 1. Register PostgreSQL + EF Core (M14: two DbContexts, per-tenant physical DBs live)
        //
        // ControlPlaneDbContext always connects to the shared control-plane DB (DefaultConnection).
        // AppDbContext is registered as a factory; TenantDbContextAccessor creates instances with
        // per-tenant connection strings resolved from the JWT org_id claim at request time (M14-F02).
        // Separate MigrationsHistoryTable names keep each context's migration history independent.
        var connStr = configuration.GetConnectionString("DefaultConnection");

        services.AddDbContext<ControlPlaneDbContext>(options =>
            options.UseNpgsql(
                connStr,
                npgsql => npgsql.MigrationsHistoryTable("__EFMigrationsHistory_ControlPlane")));

        // M14-F02: replaced AddDbContext with AddDbContextFactory. TenantDbContextAccessor
        // creates AppDbContext instances with per-tenant connection strings at runtime.
        // The scoped AppDbContext registration is removed; repos inject TenantDbContextAccessor.
        services.AddDbContextFactory<AppDbContext>(options =>
            options.UseNpgsql(
                connStr,
                npgsql => npgsql.MigrationsHistoryTable("__EFMigrationsHistory_AppDb")));

        // 2. Register ASP.NET Identity — backed by the CONTROL-PLANE context
        //    (M14-F01: AspNetUsers, AspNetRoles, RefreshTokens etc. moved there).
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
            // RequireUniqueEmail flipped to false for [M01-F09]: phone is the primary identifier,
            // email is optional. Email uniqueness is enforced in RegisterCommandHandler when an
            // email is actually provided.
            options.User.RequireUniqueEmail = false;
        })
        .AddEntityFrameworkStores<ControlPlaneDbContext>()
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
        services.AddScoped<IPhoneVerificationRepository, PhoneVerificationRepository>();
        services.AddScoped<IStationShiftConfigRepository, StationShiftConfigRepository>();
        services.AddScoped<IBankAccountRepository, BankAccountRepository>();
        services.AddScoped<IAccountHeadRepository, AccountHeadRepository>();
        services.AddScoped<IFinancialEntryRepository, FinancialEntryRepository>();
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        // 4. Register services
        services.AddScoped<IEmailSender, SmtpEmailSender>();

        // M05-F09 account heads: seeder (called from onboarding) + real usage checker
        // (queries FinancialEntries table — M05-F11).
        services.AddScoped<IAccountHeadSeeder, AccountHeadSeeder>();
        services.AddScoped<IAccountHeadUsageChecker, AccountHeadUsageChecker>();

        // 4a. SMS sender — Sms:Provider picks between the self-hosted capcom6/sms-gateway
        // (production / staging) and a dev-only log-to-console sender. Defaults to
        // "console" in Development when unset; "capcom" otherwise. See server/sms-gateway/README.md
        // for the gateway docker-compose stack + FCM setup, and docs/ENV-MAP.md for the keys.
        services.Configure<SmsGatewayOptions>(configuration.GetSection(SmsGatewayOptions.SectionName));

        var configuredProvider = configuration["Sms:Provider"];
        var effectiveProvider = !string.IsNullOrWhiteSpace(configuredProvider)
            ? configuredProvider.Trim().ToLowerInvariant()
            : (environment.IsDevelopment() ? "console" : "capcom");

        if (effectiveProvider == "console")
        {
            // Singleton — stateless logger; the constructor emits a one-time Warning
            // if console is selected outside Development.
            services.AddSingleton<ISmsSender, LogOnlySmsSender>();
        }
        else
        {
            services.AddHttpClient<ISmsSender, CapcomSmsSender>((sp, client) =>
            {
                var opts = sp.GetRequiredService<IOptions<SmsGatewayOptions>>().Value;
                if (!string.IsNullOrWhiteSpace(opts.BaseUrl))
                {
                    // HttpClient relative-URI resolution requires a trailing slash on BaseAddress.
                    var baseUrl = opts.BaseUrl.EndsWith('/') ? opts.BaseUrl : opts.BaseUrl + "/";
                    client.BaseAddress = new Uri(baseUrl);
                    client.DefaultRequestHeaders.Authorization =
                        CapcomSmsSender.BuildBasicAuthHeader(opts.Username, opts.Password);
                }
                client.Timeout = TimeSpan.FromSeconds(10);
            });
        }

        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<JwtTokenService>();

        // 4b. OTP subsystem ([M01-F09]) — options + HMAC-SHA256 hasher.
        services.Configure<OtpOptions>(configuration.GetSection(OtpOptions.SectionName));
        services.AddSingleton<IOtpHasher, OtpHasher>();

        // 4c. Top-level feature flags ([M12-F02]). The OnboardingDevBypass flag
        // here is combined with IHostEnvironment.IsDevelopment() inside
        // OnboardingBypassFlagProvider — a production deploy with the env var
        // set still reports the bypass as inactive.
        services.Configure<FeaturesOptions>(configuration.GetSection(FeaturesOptions.SectionName));
        services.AddScoped<IOnboardingBypassFlagProvider, OnboardingBypassFlagProvider>();

        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddScoped<IRequestContextService, RequestContextService>();

        // M14-F02: tenant connection resolution + per-request AppDbContext accessor.
        services.AddScoped<ITenantConnectionResolver, TenantConnectionResolver>();
        services.AddScoped<TenantDbContextAccessor>();

        // M14-F03: tenant provisioning (CREATE DATABASE + MigrateAsync + seed Org row).
        services.AddScoped<ITenantProvisioningService, TenantProvisioningService>();

        // 5. Register MediatR (CQRS handlers from Infrastructure)
        services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(RegisterCommandHandler).Assembly));

        // 6. Data seeder (runs on startup, idempotent — seeds OMCs, OMCFuelTypes, SubscriptionPlans if not present)
        services.AddHostedService<DataSeeder>();

        // 7. Tenant migration (runs after DataSeeder — applies pending AppDbContext migrations
        //    to every Active tenant DB on boot; per-tenant failures are logged and skipped) [M14-F06-R01]
        services.AddHostedService<TenantMigrationHostedService>();

        return services;
    }
}
