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
            // The cross-context FK constraints (stations->omcs, fuel_tanks->fuel_types,
            // fuel_prices->fuel_types) are no longer created by the Initial migration —
            // tenant DBs are physically separate (M14) and don't contain the
            // control-plane omcs/fuel_types tables, so there is nothing to drop here.
            // Only the now-unwanted omc_id auto-index (still created by Initial) is
            // dropped so the schema matches the model.
            migrationBuilder.DropIndex(
                name: "IX_stations_omc_id",
                table: "stations");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Mirror of Up: only the omc_id index is recreated. The cross-context FKs
            // are intentionally not re-added (they are never created in tenant DBs).
            migrationBuilder.CreateIndex(
                name: "IX_stations_omc_id",
                table: "stations",
                column: "omc_id");
        }
    }
}
