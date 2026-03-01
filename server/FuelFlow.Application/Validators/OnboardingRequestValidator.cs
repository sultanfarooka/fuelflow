using FluentValidation;
using FuelFlow.Application.DTOs.Onboarding;

namespace FuelFlow.Application.Validators;

/// <summary>
/// Validates OnboardingRequest. OrganizationName and StationName required; Address, Phone, LogoUrl optional (same rules as station fields).
/// </summary>
public class OnboardingRequestValidator : AbstractValidator<OnboardingRequest>
{
    public OnboardingRequestValidator()
    {
        RuleFor(x => x.OrganizationName)
            .NotEmpty().WithMessage("Organization name is required.")
            .MaximumLength(200).WithMessage("Organization name must not exceed 200 characters.");

        RuleFor(x => x.StationName)
            .NotEmpty().WithMessage("Station name is required.")
            .MaximumLength(200).WithMessage("Station name must not exceed 200 characters.");

        RuleFor(x => x.Address)
            .MaximumLength(500).WithMessage("Address must not exceed 500 characters.")
            .When(x => !string.IsNullOrWhiteSpace(x.Address));

        RuleFor(x => x.Phone)
            .Matches(@"^\+92\d{10}$").WithMessage("Phone must be in Pakistani format: +92XXXXXXXXXX.")
            .When(x => !string.IsNullOrWhiteSpace(x.Phone));

        RuleFor(x => x.LogoUrl)
            .MaximumLength(2048).WithMessage("Logo URL must not exceed 2048 characters.")
            .Must(BeAValidUriOrNull).WithMessage("Logo URL must be a valid URL.")
            .When(x => !string.IsNullOrWhiteSpace(x.LogoUrl));
    }

    private static bool BeAValidUriOrNull(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return true;
        return Uri.TryCreate(value, UriKind.Absolute, out var uri) && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);
    }
}
