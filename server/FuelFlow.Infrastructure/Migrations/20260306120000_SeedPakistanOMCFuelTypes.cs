using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FuelFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    [Migration("20260306120000_SeedPakistanOMCFuelTypes")]
    public partial class SeedPakistanOMCFuelTypes : Migration
    {
        private static readonly DateTime SeedTime = new(1, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        private static readonly Guid PsoId = new("e0e54749-bb85-4f0d-bb4c-1b3b8654b8b1");
        private static readonly Guid ShellId = new("85b2756b-113d-417e-bffc-a6b4b063b4d8");
        private static readonly Guid TotalId = new("b804916f-33ab-4fb6-9837-9a9024eabcbe");

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Update existing PSO fuel types to Pakistan standard names and units
            migrationBuilder.UpdateData(
                table: "omc_fuel_types",
                keyColumn: "id",
                keyValue: new Guid("a1000001-0000-0000-0000-000000000001"),
                columns: new[] { "name", "unit" },
                values: new object[] { "MS (Motor Spirit / Petrol)", "L" });
            migrationBuilder.UpdateData(
                table: "omc_fuel_types",
                keyColumn: "id",
                keyValue: new Guid("a1000001-0000-0000-0000-000000000002"),
                columns: new[] { "name", "unit" },
                values: new object[] { "HSD (High Speed Diesel)", "L" });
            migrationBuilder.UpdateData(
                table: "omc_fuel_types",
                keyColumn: "id",
                keyValue: new Guid("a1000001-0000-0000-0000-000000000003"),
                columns: new[] { "name", "unit" },
                values: new object[] { "CNG", "kg" });

            // Shell: update CNG unit only
            migrationBuilder.UpdateData(
                table: "omc_fuel_types",
                keyColumn: "id",
                keyValue: new Guid("a1000002-0000-0000-0000-000000000003"),
                columns: new[] { "name", "unit" },
                values: new object[] { "CNG", "kg" });

            // Update Total PARCO fuel types to Pakistan standard names and units
            migrationBuilder.UpdateData(
                table: "omc_fuel_types",
                keyColumn: "id",
                keyValue: new Guid("a1000003-0000-0000-0000-000000000001"),
                columns: new[] { "name", "unit" },
                values: new object[] { "MS (Motor Spirit / Petrol)", "L" });
            migrationBuilder.UpdateData(
                table: "omc_fuel_types",
                keyColumn: "id",
                keyValue: new Guid("a1000003-0000-0000-0000-000000000002"),
                columns: new[] { "name", "unit" },
                values: new object[] { "HSD (High Speed Diesel)", "L" });
            migrationBuilder.UpdateData(
                table: "omc_fuel_types",
                keyColumn: "id",
                keyValue: new Guid("a1000003-0000-0000-0000-000000000003"),
                columns: new[] { "name", "unit" },
                values: new object[] { "CNG", "kg" });

            // Insert new PSO Euro 5 fuel types
            migrationBuilder.InsertData(
                table: "omc_fuel_types",
                columns: new[] { "id", "created_at", "name", "omc_id", "unit", "updated_at" },
                values: new object[,]
                {
                    { new Guid("a1000001-0000-0000-0000-000000000004"), SeedTime, "Premier Euro 5 (Petrol)", PsoId, "L", SeedTime },
                    { new Guid("a1000001-0000-0000-0000-000000000005"), SeedTime, "Octane+ Euro 5 (Petrol)", PsoId, "L", SeedTime },
                    { new Guid("a1000001-0000-0000-0000-000000000006"), SeedTime, "Hi-Cetane Diesel Euro 5", PsoId, "L", SeedTime }
                });

            // Insert new Total PARCO Excellium fuel types
            migrationBuilder.InsertData(
                table: "omc_fuel_types",
                columns: new[] { "id", "created_at", "name", "omc_id", "unit", "updated_at" },
                values: new object[,]
                {
                    { new Guid("a1000003-0000-0000-0000-000000000004"), SeedTime, "Excellium Petrol", TotalId, "L", SeedTime },
                    { new Guid("a1000003-0000-0000-0000-000000000005"), SeedTime, "Excellium Diesel", TotalId, "L", SeedTime }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Remove new rows
            migrationBuilder.DeleteData(table: "omc_fuel_types", keyColumn: "id", keyValue: new Guid("a1000001-0000-0000-0000-000000000004"));
            migrationBuilder.DeleteData(table: "omc_fuel_types", keyColumn: "id", keyValue: new Guid("a1000001-0000-0000-0000-000000000005"));
            migrationBuilder.DeleteData(table: "omc_fuel_types", keyColumn: "id", keyValue: new Guid("a1000001-0000-0000-0000-000000000006"));
            migrationBuilder.DeleteData(table: "omc_fuel_types", keyColumn: "id", keyValue: new Guid("a1000003-0000-0000-0000-000000000004"));
            migrationBuilder.DeleteData(table: "omc_fuel_types", keyColumn: "id", keyValue: new Guid("a1000003-0000-0000-0000-000000000005"));

            // Restore original names and units
            migrationBuilder.UpdateData(table: "omc_fuel_types", keyColumn: "id", keyValue: new Guid("a1000001-0000-0000-0000-000000000001"), columns: new[] { "name", "unit" }, values: new object[] { "Petrol", "L" });
            migrationBuilder.UpdateData(table: "omc_fuel_types", keyColumn: "id", keyValue: new Guid("a1000001-0000-0000-0000-000000000002"), columns: new[] { "name", "unit" }, values: new object[] { "Diesel", "L" });
            migrationBuilder.UpdateData(table: "omc_fuel_types", keyColumn: "id", keyValue: new Guid("a1000001-0000-0000-0000-000000000003"), columns: new[] { "name", "unit" }, values: new object[] { "CNG", "L" });
            migrationBuilder.UpdateData(table: "omc_fuel_types", keyColumn: "id", keyValue: new Guid("a1000002-0000-0000-0000-000000000003"), columns: new[] { "name", "unit" }, values: new object[] { "CNG", "L" });
            migrationBuilder.UpdateData(table: "omc_fuel_types", keyColumn: "id", keyValue: new Guid("a1000003-0000-0000-0000-000000000001"), columns: new[] { "name", "unit" }, values: new object[] { "Petrol", "L" });
            migrationBuilder.UpdateData(table: "omc_fuel_types", keyColumn: "id", keyValue: new Guid("a1000003-0000-0000-0000-000000000002"), columns: new[] { "name", "unit" }, values: new object[] { "Diesel", "L" });
            migrationBuilder.UpdateData(table: "omc_fuel_types", keyColumn: "id", keyValue: new Guid("a1000003-0000-0000-0000-000000000003"), columns: new[] { "name", "unit" }, values: new object[] { "CNG", "L" });
        }
    }
}
