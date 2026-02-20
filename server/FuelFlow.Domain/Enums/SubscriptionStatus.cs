namespace FuelFlow.Domain.Enums;

/// <summary>
/// Tracks the lifecycle of an organization's subscription.
/// 
/// WHY: An organization moves through these states:
///   Trial → Active → Expired/Cancelled
/// 
/// From PRD (SUB-001 to SUB-010):
/// - Trial: 14-day free period with Professional features
/// - Active: Paid subscription, fully functional
/// - Expired: Grace period passed, read-only mode
/// - Cancelled: Manually cancelled by owner
/// </summary>
public enum SubscriptionStatus
{
    Trial,
    Active,
    Expired,
    Cancelled
}
