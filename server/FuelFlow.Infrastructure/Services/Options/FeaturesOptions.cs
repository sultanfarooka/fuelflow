namespace FuelFlow.Infrastructure.Services.Options;

/// <summary>
/// Strongly typed configuration for top-level feature flags ([M12-F02-R01]).
/// Bound from the <c>Features</c> section (see <c>docs/ENV-MAP.md</c>).
///
/// IMPORTANT: any flag in this class that affects security-sensitive behaviour
/// must be combined with <c>IHostEnvironment.IsDevelopment()</c> in C# code
/// before being honoured. Config-only gates are not safe; a misconfigured
/// production deploy with the env var accidentally set still flips the flag.
/// See <c>OnboardingBypassFlagProvider</c> for the canonical pattern.
/// </summary>
public sealed class FeaturesOptions
{
    public const string SectionName = "Features";

    /// <summary>
    /// When true AND the runtime environment is <c>Development</c>, the
    /// frontend is told (via <c>devBypassActive</c> on the auth response)
    /// that the dashboard route guard may be relaxed and a "Skip to
    /// Dashboard" affordance may be shown in the onboarding wizard.
    /// Production binaries ignore this value regardless of how it is set.
    /// See [M12-F02-R01].
    /// </summary>
    public bool OnboardingDevBypass { get; set; } = false;
}
