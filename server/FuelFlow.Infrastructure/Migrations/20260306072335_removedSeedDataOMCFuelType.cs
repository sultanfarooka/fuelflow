using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace FuelFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class removedSeedDataOMCFuelType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "omc_fuel_types",
                keyColumn: "id",
                keyValue: new Guid("a1000001-0000-0000-0000-000000000001"));

            migrationBuilder.DeleteData(
                table: "omc_fuel_types",
                keyColumn: "id",
                keyValue: new Guid("a1000001-0000-0000-0000-000000000002"));

            migrationBuilder.DeleteData(
                table: "omc_fuel_types",
                keyColumn: "id",
                keyValue: new Guid("a1000001-0000-0000-0000-000000000003"));

            migrationBuilder.DeleteData(
                table: "omc_fuel_types",
                keyColumn: "id",
                keyValue: new Guid("a1000001-0000-0000-0000-000000000004"));

            migrationBuilder.DeleteData(
                table: "omc_fuel_types",
                keyColumn: "id",
                keyValue: new Guid("a1000001-0000-0000-0000-000000000005"));

            migrationBuilder.DeleteData(
                table: "omc_fuel_types",
                keyColumn: "id",
                keyValue: new Guid("a1000001-0000-0000-0000-000000000006"));

            migrationBuilder.DeleteData(
                table: "omc_fuel_types",
                keyColumn: "id",
                keyValue: new Guid("a1000002-0000-0000-0000-000000000001"));

            migrationBuilder.DeleteData(
                table: "omc_fuel_types",
                keyColumn: "id",
                keyValue: new Guid("a1000002-0000-0000-0000-000000000002"));

            migrationBuilder.DeleteData(
                table: "omc_fuel_types",
                keyColumn: "id",
                keyValue: new Guid("a1000002-0000-0000-0000-000000000003"));

            migrationBuilder.DeleteData(
                table: "omc_fuel_types",
                keyColumn: "id",
                keyValue: new Guid("a1000003-0000-0000-0000-000000000001"));

            migrationBuilder.DeleteData(
                table: "omc_fuel_types",
                keyColumn: "id",
                keyValue: new Guid("a1000003-0000-0000-0000-000000000002"));

            migrationBuilder.DeleteData(
                table: "omc_fuel_types",
                keyColumn: "id",
                keyValue: new Guid("a1000003-0000-0000-0000-000000000003"));

            migrationBuilder.DeleteData(
                table: "omc_fuel_types",
                keyColumn: "id",
                keyValue: new Guid("a1000003-0000-0000-0000-000000000004"));

            migrationBuilder.DeleteData(
                table: "omc_fuel_types",
                keyColumn: "id",
                keyValue: new Guid("a1000003-0000-0000-0000-000000000005"));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "omc_fuel_types",
                columns: new[] { "id", "name", "omc_id", "unit" },
                values: new object[,]
                {
                    { new Guid("a1000001-0000-0000-0000-000000000001"), "MS (Motor Spirit / Petrol)", new Guid("e0e54749-bb85-4f0d-bb4c-1b3b8654b8b1"), "L" },
                    { new Guid("a1000001-0000-0000-0000-000000000002"), "HSD (High Speed Diesel)", new Guid("e0e54749-bb85-4f0d-bb4c-1b3b8654b8b1"), "L" },
                    { new Guid("a1000001-0000-0000-0000-000000000003"), "CNG", new Guid("e0e54749-bb85-4f0d-bb4c-1b3b8654b8b1"), "kg" },
                    { new Guid("a1000001-0000-0000-0000-000000000004"), "Premier Euro 5 (Petrol)", new Guid("e0e54749-bb85-4f0d-bb4c-1b3b8654b8b1"), "L" },
                    { new Guid("a1000001-0000-0000-0000-000000000005"), "Octane+ Euro 5 (Petrol)", new Guid("e0e54749-bb85-4f0d-bb4c-1b3b8654b8b1"), "L" },
                    { new Guid("a1000001-0000-0000-0000-000000000006"), "Hi-Cetane Diesel Euro 5", new Guid("e0e54749-bb85-4f0d-bb4c-1b3b8654b8b1"), "L" },
                    { new Guid("a1000002-0000-0000-0000-000000000001"), "Petrol", new Guid("85b2756b-113d-417e-bffc-a6b4b063b4d8"), "L" },
                    { new Guid("a1000002-0000-0000-0000-000000000002"), "Diesel", new Guid("85b2756b-113d-417e-bffc-a6b4b063b4d8"), "L" },
                    { new Guid("a1000002-0000-0000-0000-000000000003"), "CNG", new Guid("85b2756b-113d-417e-bffc-a6b4b063b4d8"), "kg" },
                    { new Guid("a1000003-0000-0000-0000-000000000001"), "MS (Motor Spirit / Petrol)", new Guid("b804916f-33ab-4fb6-9837-9a9024eabcbe"), "L" },
                    { new Guid("a1000003-0000-0000-0000-000000000002"), "HSD (High Speed Diesel)", new Guid("b804916f-33ab-4fb6-9837-9a9024eabcbe"), "L" },
                    { new Guid("a1000003-0000-0000-0000-000000000003"), "CNG", new Guid("b804916f-33ab-4fb6-9837-9a9024eabcbe"), "kg" },
                    { new Guid("a1000003-0000-0000-0000-000000000004"), "Excellium Petrol", new Guid("b804916f-33ab-4fb6-9837-9a9024eabcbe"), "L" },
                    { new Guid("a1000003-0000-0000-0000-000000000005"), "Excellium Diesel", new Guid("b804916f-33ab-4fb6-9837-9a9024eabcbe"), "L" }
                });
        }
    }
}
