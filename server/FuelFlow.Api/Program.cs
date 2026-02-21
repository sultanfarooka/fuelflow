using System.Text;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using FuelFlow.Infrastructure;

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
builder.Services.AddInfrastructure(builder.Configuration);

// ── 3. JWT Authentication ────────────────────────────────────────
// Tells ASP.NET: "When a request comes in with an Authorization header,
// validate the JWT token using these rules."
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
});

// ── 4. FluentValidation ──────────────────────────────────────────
// Auto-discovers all validators in the Application assembly.
// When a request comes in, validators run BEFORE the controller action.
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<FuelFlow.Application.Validators.RegisterRequestValidator>();

// ── 5. CORS ──────────────────────────────────────────────────────
// Cross-Origin Resource Sharing: allows the React frontend (different port)
// to call our API. Without this, browsers block the requests.
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173") // Vite dev server
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
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
app.UseAuthentication();  // Validates JWT token
app.UseAuthorization();   // Checks [Authorize] attributes
app.MapControllers();

Log.Information("Fuel Flow API starting on {Urls}", app.Urls);
app.Run();
