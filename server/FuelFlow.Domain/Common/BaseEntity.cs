namespace FuelFlow.Domain.Common;

/// <summary>
/// Base class for all domain entities.
/// 
/// WHY: Every table in our database needs an Id, CreatedAt, and UpdatedAt.
/// Instead of repeating these in every entity, we define them once here.
/// All entities inherit from this class.
/// 
/// HOW: Uses Guid for IDs (UUID in PostgreSQL) — globally unique,
/// no auto-increment collisions across stations or databases.
/// </summary>
public abstract class BaseEntity
{
    public Guid Id { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
