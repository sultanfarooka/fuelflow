using System.Text;
using System.Threading.RateLimiting;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using FuelFlow.Infrastructure;
using FuelFlow.Api.Options;

// ──────────────────────────────────────────────────────────────────
// Program.cs — The Composition Root
//
// WHAT: This is where ALL layers come together. It's the only file
//       that knows about every project (Application, Infrastructure).
//
// WHY here and not somewhere else?
//   In Clean Architecture, the outermost layer (Api) is responsible
//   for wiring up dependency injection. No other layer should do DI.
//
// HOW: We register services in this order:
//   1. Infrastructure (DB, Identity, repositories, services)
//   2. JWT authentication
//   3. FluentValidation
//   4. CORS (so the React frontend can call us)
//   5. Swagger (API docs for development)
//   6. Serilog (logging)
//   7. Controllers
// ──────────────────────────────────────────────────────────────────

var builder = WebApplication.CreateBuilder(args);

// Ensure dev URLs are used even when launched via debugger (which bypasses launchSettings.json)
if (builder.Environment.IsDevelopment())
{
    builder.WebHost.UseUrls("http://localhost:5035");
}

// ── 1. Serilog ───────────────────────────────────────────────────
// Replaces the default .NET logger with structured logging.
// Structured = logs are key-value pairs, not just strings.
// Makes it easy to search/filter logs later (e.g., "show all errors for org X").
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .WriteTo.Console()
    .CreateLogger();

builder.Host.UseSerilog();

// ── 2. Infrastructure (DB, Identity, repos, services) ────────────
// One line registers EVERYTHING from the Infrastructure layer.
// This calls the extension method we created in DependencyInjection.cs.
// IHostEnvironment is needed so DI can pick the dev-only LogOnlySmsSender
// when Sms:Provider is unset (see [M01-F09-R10] / [M10-F03-R04]).
builder.Services.AddInfrastructure(builder.Configuration, builder.Environment);

// Cookie configuration for auth tokens (HTTP-only, Secure in prod)
builder.Services.AddScoped<AuthCookieOptions>();

// ── 3. JWT Authentication ────────────────────────────────────────
// Reads token from cookie only (no Authorization header). Cookie-only is more secure.
var jwtSettings = builder.Configuration.GetSection("Jwt");
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(jwtSettings["Secret"]!)),
    };
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            // Cookie only — ignore Authorization header
            var token = context.Request.Cookies[CookieConstants.AccessToken];
            if (!string.IsNullOrEmpty(token))
                context.Token = token;
            return Task.CompletedTask;
        }
    };
});

// ── 4. FluentValidation ──────────────────────────────────────────
// Auto-discovers all validators in the Application assembly.
// When a request comes in, validators run BEFORE the controller action.
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<FuelFlow.Application.Validators.RegisterRequestValidator>();

// ── 4b. Rate limiting ([M01-F09-R12]) ────────────────────────────
// Per-IP sliding window on auth endpoints (defense in depth on top of the
// handler-level per-phone daily cap enforced in OTP-issuing handlers via
// IPhoneVerificationRepository.CountIssuedSinceAsync).
//
// AuthController actions opt into this via [EnableRateLimiting("auth-ip")].
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("auth-ip", httpContext =>
    {
        var ip = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return RateLimitPartition.GetSlidingWindowLimiter(ip, _ => new SlidingWindowRateLimiterOptions
        {
            PermitLimit = 30,
            Window = TimeSpan.FromMinutes(1),
            SegmentsPerWindow = 6,
            QueueLimit = 0,
            QueueProcessingOrder = QueueProcessingOrder.OldestFirst
        });
    });
});

// ── 5. CORS ──────────────────────────────────────────────────────
// Cross-Origin Resource Sharing: allows the React frontend (different port)
// to call our API. Without this, browsers block the requests.
//
// Development: any origin is allowed so the SPA reaches the API over
// localhost, LAN IPs, Tailscale, and mobile devices on `vite --host` without
// per-IP allowlist edits. Credentials are kept on, so we must use
// `SetIsOriginAllowed` (the CORS spec forbids `AllowAnyOrigin` together with
// `AllowCredentials`). Production keeps the strict explicit-origin list.
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        if (builder.Environment.IsDevelopment())
        {
            policy.SetIsOriginAllowed(_ => true)
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        }
        else
        {
            policy.WithOrigins("http://localhost:5173") // Vite dev server
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        }
    });
});

// ── 6. Controllers + JSON config ─────────────────────────────────
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // camelCase in JSON responses (C# uses PascalCase, JS uses camelCase)
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

// ── 7. Swagger (API docs) ────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new() { Title = "Fuel Flow API", Version = "v1" });
});

// We'll add JWT "Authorize" button to Swagger after we verify the correct
// Microsoft.OpenApi v2 types. For now, test protected endpoints via curl/Postman
// by adding the Authorization header manually.

// ══════════════════════════════════════════════════════════════════
// Build the app and configure the HTTP pipeline
// ══════════════════════════════════════════════════════════════════
var app = builder.Build();

// Swagger UI (development only)
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "Fuel Flow API v1");
    });
}

// Pipeline order matters!
// 1. CORS must be before auth
// 2. Authentication must be before Authorization
// 3. Authorization must be before Controllers
app.UseCors("AllowFrontend");
app.UseRateLimiter();     // Applies named policies declared via [EnableRateLimiting] ([M01-F09-R12])
app.UseMiddleware<FuelFlow.Api.Middleware.TenantExceptionMiddleware>(); // M14-F03: 503 for missing tenant DB
app.UseAuthentication();  // Validates JWT token
app.UseAuthorization();   // Checks [Authorize] attributes
app.MapControllers();

// Liveness probe — anonymous, no DB hit. Used by the docker-compose healthcheck so
// dependent services (nginx) wait until the API is actually serving.
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

Log.Information("Fuel Flow API starting on {Urls}", app.Urls);
app.Run();
