namespace FuelFlow.Application.Interfaces.Services;

/// <summary>
/// Resolves the effective onboarding-dev-bypass flag that the backend exposes
/// to the frontend on every auth response ([M12-F02-R01]).
///
/// The implementation MUST combine the <c>Features:OnboardingDevBypass</c>
/// config value with <c>IHostEnvironment.IsDevelopment()</c> in C# code —
/// not via config alone. A misconfigured production deploy with the env var
/// set still reports <c>false</c> here, because the <c>IsDevelopment()</c>
/// check fails at runtime regardless of how the flag is configured.
///
/// Consumers: auth handlers (Login, Refresh, GetCurrentUser) — sets
/// <c>AuthResponse.DevBypassActive</c>. The frontend then decides whether
/// to relax the dashboard route guard and show the wizard skip affordance.
/// </summary>
public interface IOnboardingBypassFlagProvider
{
    /// <summary>
    /// <c>true</c> if and only if both (a) the runtime environment is
    /// Development and (b) <c>Features:OnboardingDevBypass</c> is enabled.
    /// </summary>
    bool IsActive { get; }
}
