using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FuelFlow.Infrastructure.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class DropCrossContextForeignKeys : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_fuel_prices_fuel_types_fuel_type_id",
                table: "fuel_prices");

            migrationBuilder.DropForeignKey(
                name: "FK_fuel_tanks_fuel_types_fuel_type_id",
                table: "fuel_tanks");

            migrationBuilder.DropForeignKey(
                name: "FK_stations_omcs_omc_id",
                table: "stations");

            migrationBuilder.DropIndex(
                name: "IX_stations_omc_id",
                table: "stations");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_stations_omc_id",
                table: "stations",
                column: "omc_id");

            migrationBuilder.AddForeignKey(
                name: "FK_fuel_prices_fuel_types_fuel_type_id",
                table: "fuel_prices",
                column: "fuel_type_id",
                principalTable: "fuel_types",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_fuel_tanks_fuel_types_fuel_type_id",
                table: "fuel_tanks",
                column: "fuel_type_id",
                principalTable: "fuel_types",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_stations_omcs_omc_id",
                table: "stations",
                column: "omc_id",
                principalTable: "omcs",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
