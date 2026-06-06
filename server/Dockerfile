# syntax=docker/dockerfile:1

# ───────────────────────── Build stage ─────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Restore first (this layer is cached unless a .csproj changes).
COPY FuelFlow.Domain/FuelFlow.Domain.csproj FuelFlow.Domain/
COPY FuelFlow.Application/FuelFlow.Application.csproj FuelFlow.Application/
COPY FuelFlow.Infrastructure/FuelFlow.Infrastructure.csproj FuelFlow.Infrastructure/
COPY FuelFlow.Api/FuelFlow.Api.csproj FuelFlow.Api/
RUN dotnet restore FuelFlow.Api/FuelFlow.Api.csproj

# Copy the rest of the source and publish the API (which pulls in the other projects).
COPY . .
RUN dotnet publish FuelFlow.Api/FuelFlow.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

# ──────────────────────── Runtime stage ────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

# curl is used by the docker-compose healthcheck (GET /health).
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "FuelFlow.Api.dll"]
