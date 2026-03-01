using FuelFlow.Domain.Common;
using FuelFlow.Domain.Enums;

namespace FuelFlow.Domain.Entities;

/// <summary>
/// A shift at a station. One open shift per station at a time.
/// Plan: shifts — status (Open/Closed), opened_at, closed_at, opening_cash, closing_cash (null when open),
/// opened_by_user_id, closed_by_user_id (null when open).
/// </summary>
public class StationShift : BaseEntity
{
    public Guid StationId { get; set; }
    public Station Station { get; set; } = null!;

    public ShiftStatus Status { get; set; }
    public DateTime OpenedAt { get; set; }
    public DateTime? ClosedAt { get; set; }
    public decimal OpeningCash { get; set; }
    public decimal? ClosingCash { get; set; }

    public Guid OpenedByUserId { get; set; }
    public User OpenedBy { get; set; } = null!;
    public Guid? ClosedByUserId { get; set; }
    public User? ClosedBy { get; set; }

    /// <summary>Optional label e.g. Morning, Evening, Night (ShiftNames).</summary>
    public string? ShiftName { get; set; }

    // Denormalized totals for reporting (plan does not require; optional)
    public decimal TotalCash { get; set; }
    public decimal TotalSales { get; set; }
    public decimal TotalCreditSales { get; set; }
    public decimal TotalCardSales { get; set; }
    public decimal TotalDigitalSales { get; set; }
    public decimal TotalExpenses { get; set; }

    public ICollection<FuelTankReading> OpeningFuelTankReadings { get; set; } = new List<FuelTankReading>();
    public ICollection<FuelTankReading> ClosingFuelTankReadings { get; set; } = new List<FuelTankReading>();
    public ICollection<NozzleReadings> OpeningNozzleReadings { get; set; } = new List<NozzleReadings>();
    public ICollection<NozzleReadings> ClosingNozzleReadings { get; set; } = new List<NozzleReadings>();
    public ICollection<ShiftAssignment> ShiftAssignments { get; set; } = new List<ShiftAssignment>();
}
