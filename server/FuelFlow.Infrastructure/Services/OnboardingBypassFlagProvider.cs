using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using FuelFlow.Application.Interfaces.Services;
using FuelFlow.Infrastructure.Services.Options;

namespace FuelFlow.Infrastructure.Services;

/// <summary>
/// Production-safe implementation of <see cref="IOnboardingBypassFlagProvider"/>.
///
/// The <c>IsDevelopment()</c> short-circuit is enforced **in C# code, not in
/// config**. A misconfigured production deploy with
/// <c>Features:OnboardingDevBypass=true</c> set in env vars or
/// <c>appsettings.json</c> still resolves to <c>IsActive == false</c>, because
/// <see cref="IHostEnvironment.IsDevelopment"/> returns <c>false</c> on
/// production binaries regardless of how the flag is wired. See [M12-F02-R01].
/// </summary>
public sealed class OnboardingBypassFlagProvider : IOnboardingBypassFlagProvider
{
    private readonly IHostEnvironment _environment;
    private readonly FeaturesOptions _options;

    public OnboardingBypassFlagProvider(
        IHostEnvironment environment,
        IOptions<FeaturesOptions> options)
    {
        _environment = environment;
        _options = options.Value;
    }

    public bool IsActive => _environment.IsDevelopment() && _options.OnboardingDevBypass;
}
