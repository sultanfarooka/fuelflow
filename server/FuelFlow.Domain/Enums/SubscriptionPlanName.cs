namespace FuelFlow.Domain.Enums;

/// <summary>
/// Named subscription plans (reference data). Values must match seeded names in subscription_plans.
/// Used for type-safe lookups (e.g. trial plan on onboarding).
/// </summary>
public enum SubscriptionPlanName
{
    Starter,
    Professional,
    Enterprise
}
