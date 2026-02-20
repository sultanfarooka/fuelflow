namespace FuelFlow.Domain.Enums;

/// <summary>
/// Defines the roles a user can have in the system.
/// 
/// WHY: Using an enum instead of a string ("owner", "manager") prevents typos
/// and gives us compile-time safety. If you type UserRole.Ownr, the compiler
/// catches it immediately.
/// 
/// From PRD: Owner > Manager > Custom (nozzleman, accountant, etc.)
/// </summary>
public enum UserRole
{
    Owner,
    Manager,
    Nozzleman,
    Accountant,
    Custom
}
