using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace FuelFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class seedingFuelTypesAndOMC : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "omcs",
                columns: new[] { "id", "address", "contact_person", "contact_person_email", "contact_person_phone", "email", "logo_url", "name", "phone", "website" },
                values: new object[,]
                {
                    { new Guid("85b2756b-113d-417e-bffc-a6b4b063b4d8"), "", "", "", "", "", "", "Shell", "", "" },
                    { new Guid("b804916f-33ab-4fb6-9837-9a9024eabcbe"), "", "", "", "", "", "", "Total", "", "" },
                    { new Guid("e0e54749-bb85-4f0d-bb4c-1b3b8654b8b1"), "", "", "", "", "", "", "PSO", "", "" }
                });

            migrationBuilder.InsertData(
                table: "omc_fuel_types",
                columns: new[] { "id", "name", "omc_id" },
                values: new object[,]
                {
                    { new Guid("a1000001-0000-0000-0000-000000000001"), "Petrol", new Guid("e0e54749-bb85-4f0d-bb4c-1b3b8654b8b1") },
                    { new Guid("a1000001-0000-0000-0000-000000000002"), "Diesel", new Guid("e0e54749-bb85-4f0d-bb4c-1b3b8654b8b1") },
                    { new Guid("a1000001-0000-0000-0000-000000000003"), "CNG", new Guid("e0e54749-bb85-4f0d-bb4c-1b3b8654b8b1") },
                    { new Guid("a1000002-0000-0000-0000-000000000001"), "Petrol", new Guid("85b2756b-113d-417e-bffc-a6b4b063b4d8") },
                    { new Guid("a1000002-0000-0000-0000-000000000002"), "Diesel", new Guid("85b2756b-113d-417e-bffc-a6b4b063b4d8") },
                    { new Guid("a1000002-0000-0000-0000-000000000003"), "CNG", new Guid("85b2756b-113d-417e-bffc-a6b4b063b4d8") },
                    { new Guid("a1000003-0000-0000-0000-000000000001"), "Petrol", new Guid("b804916f-33ab-4fb6-9837-9a9024eabcbe") },
                    { new Guid("a1000003-0000-0000-0000-000000000002"), "Diesel", new Guid("b804916f-33ab-4fb6-9837-9a9024eabcbe") },
                    { new Guid("a1000003-0000-0000-0000-000000000003"), "CNG", new Guid("b804916f-33ab-4fb6-9837-9a9024eabcbe") }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
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
                table: "omcs",
                keyColumn: "id",
                keyValue: new Guid("85b2756b-113d-417e-bffc-a6b4b063b4d8"));

            migrationBuilder.DeleteData(
                table: "omcs",
                keyColumn: "id",
                keyValue: new Guid("b804916f-33ab-4fb6-9837-9a9024eabcbe"));

            migrationBuilder.DeleteData(
                table: "omcs",
                keyColumn: "id",
                keyValue: new Guid("e0e54749-bb85-4f0d-bb4c-1b3b8654b8b1"));
        }
    }
}
