using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.Auth;
using FuelFlow.Application.DTOs.Onboarding;
using MediatR;

namespace FuelFlow.Application.Features.Onboarding.Commands;

public record OnboardingCommand(OnboardingRequest Request) : IRequest<Result<AuthResponse>>;
