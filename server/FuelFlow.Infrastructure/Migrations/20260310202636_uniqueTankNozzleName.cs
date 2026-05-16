using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FuelFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class uniqueTankNozzleName : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_fuel_tanks_station_id_name",
                table: "fuel_tanks",
                columns: new[] { "station_id", "name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_fuel_nozzles_tank_id_nozzle_number",
                table: "fuel_nozzles",
                columns: new[] { "tank_id", "nozzle_number" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_fuel_tanks_station_id_name",
                table: "fuel_tanks");

            migrationBuilder.DropIndex(
                name: "IX_fuel_nozzles_tank_id_nozzle_number",
                table: "fuel_nozzles");
        }
    }
}
