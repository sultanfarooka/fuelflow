using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FuelFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class addUnitToOMCfuelTypes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "unit",
                table: "omc_fuel_types",
                type: "character varying(10)",
                maxLength: 10,
                nullable: false,
                defaultValue: "");

            migrationBuilder.UpdateData(
                table: "omc_fuel_types",
                keyColumn: "id",
                keyValue: new Guid("a1000001-0000-0000-0000-000000000001"),
                column: "unit",
                value: "L");

            migrationBuilder.UpdateData(
                table: "omc_fuel_types",
                keyColumn: "id",
                keyValue: new Guid("a1000001-0000-0000-0000-000000000002"),
                column: "unit",
                value: "L");

            migrationBuilder.UpdateData(
                table: "omc_fuel_types",
                keyColumn: "id",
                keyValue: new Guid("a1000001-0000-0000-0000-000000000003"),
                column: "unit",
                value: "L");

            migrationBuilder.UpdateData(
                table: "omc_fuel_types",
                keyColumn: "id",
                keyValue: new Guid("a1000002-0000-0000-0000-000000000001"),
                column: "unit",
                value: "L");

            migrationBuilder.UpdateData(
                table: "omc_fuel_types",
                keyColumn: "id",
                keyValue: new Guid("a1000002-0000-0000-0000-000000000002"),
                column: "unit",
                value: "L");

            migrationBuilder.UpdateData(
                table: "omc_fuel_types",
                keyColumn: "id",
                keyValue: new Guid("a1000002-0000-0000-0000-000000000003"),
                column: "unit",
                value: "L");

            migrationBuilder.UpdateData(
                table: "omc_fuel_types",
                keyColumn: "id",
                keyValue: new Guid("a1000003-0000-0000-0000-000000000001"),
                column: "unit",
                value: "L");

            migrationBuilder.UpdateData(
                table: "omc_fuel_types",
                keyColumn: "id",
                keyValue: new Guid("a1000003-0000-0000-0000-000000000002"),
                column: "unit",
                value: "L");

            migrationBuilder.UpdateData(
                table: "omc_fuel_types",
                keyColumn: "id",
                keyValue: new Guid("a1000003-0000-0000-0000-000000000003"),
                column: "unit",
                value: "L");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "unit",
                table: "omc_fuel_types");
        }
    }
}
