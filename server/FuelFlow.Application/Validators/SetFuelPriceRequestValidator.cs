using FluentValidation;
using FuelFlow.Application.DTOs.FuelPrices;

namespace FuelFlow.Application.Validators;

/// <summary>
/// Validates <see cref="SetFuelPriceRequest"/>. Rules per M06-F01:
/// fuel type id required; price strictly positive and capped at a sane
/// upper bound; price quoted to at most 2 decimal places (Pakistani fuel
/// pricing convention); effective-from cannot be more than 5 minutes in
/// the past (the slop window absorbs client clock skew while still
/// preventing backdated rewrites of historical sales math).
/// </summary>
public class SetFuelPriceRequestValidator : AbstractValidator<SetFuelPriceRequest>
{
    // Absurd-upper-bound guard. Pakistani fuel ~Rs 280/L in 2026; ten thousand
    // per litre is a safe sanity cap that still allows future inflation.
    private const decimal MaxPrice = 10_000m;

    // 5-minute slop absorbs client clock skew. Symmetric with M04-F03 shift-open.
    private static readonly TimeSpan PastSlop = TimeSpan.FromMinutes(5);

    public SetFuelPriceRequestValidator()
    {
        RuleFor(x => x.FuelTypeId)
            .NotEmpty().WithMessage("Fuel type is required.");

        RuleFor(x => x.Price)
            .GreaterThan(0m).WithMessage("Price must be greater than zero.")
            .LessThanOrEqualTo(MaxPrice).WithMessage($"Price must not exceed {MaxPrice:N2}.")
            .Must(BeAtMostTwoDecimals).WithMessage("Price may have at most two decimal places.");

        RuleFor(x => x.EffectiveFrom)
            .Must(BeNotMoreThanFiveMinutesPast).WithMessage("Effective date cannot be in the past.");
    }

    private static bool BeAtMostTwoDecimals(decimal price)
    {
        // decimal.GetBits returns the scale in the high word of the 4th element.
        // A scale of 0, 1 or 2 means the value has at most two decimal places.
        var scale = (decimal.GetBits(price)[3] >> 16) & 0x7F;
        return scale <= 2;
    }

    private static bool BeNotMoreThanFiveMinutesPast(DateTime effectiveFrom)
    {
        var earliest = DateTime.UtcNow - PastSlop;
        // Accept anything from (now - 5 min) and into the future.
        return effectiveFrom >= earliest;
    }
}
