using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FuelFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class OMCTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DipChart_fuel_tanks_TankId",
                table: "DipChart");

            migrationBuilder.DropForeignKey(
                name: "FK_DipChartEntry_DipChart_DipChartId",
                table: "DipChartEntry");

            migrationBuilder.DropForeignKey(
                name: "FK_ShiftAssignment_User_UserId",
                table: "ShiftAssignment");

            migrationBuilder.DropForeignKey(
                name: "FK_ShiftAssignment_fuel_nozzles_FuelNozzleId",
                table: "ShiftAssignment");

            migrationBuilder.DropForeignKey(
                name: "FK_ShiftAssignment_station_shifts_StationShiftId",
                table: "ShiftAssignment");

            migrationBuilder.DropPrimaryKey(
                name: "PK_ShiftAssignment",
                table: "ShiftAssignment");

            migrationBuilder.DropPrimaryKey(
                name: "PK_DipChartEntry",
                table: "DipChartEntry");

            migrationBuilder.DropPrimaryKey(
                name: "PK_DipChart",
                table: "DipChart");

            migrationBuilder.RenameTable(
                name: "ShiftAssignment",
                newName: "ShiftAssignments");

            migrationBuilder.RenameTable(
                name: "DipChartEntry",
                newName: "DipChartEntries");

            migrationBuilder.RenameTable(
                name: "DipChart",
                newName: "DipCharts");

            migrationBuilder.RenameIndex(
                name: "IX_ShiftAssignment_UserId",
                table: "ShiftAssignments",
                newName: "IX_ShiftAssignments_UserId");

            migrationBuilder.RenameIndex(
                name: "IX_ShiftAssignment_StationShiftId",
                table: "ShiftAssignments",
                newName: "IX_ShiftAssignments_StationShiftId");

            migrationBuilder.RenameIndex(
                name: "IX_ShiftAssignment_FuelNozzleId",
                table: "ShiftAssignments",
                newName: "IX_ShiftAssignments_FuelNozzleId");

            migrationBuilder.RenameIndex(
                name: "IX_DipChartEntry_DipChartId",
                table: "DipChartEntries",
                newName: "IX_DipChartEntries_DipChartId");

            migrationBuilder.RenameIndex(
                name: "IX_DipChart_TankId",
                table: "DipCharts",
                newName: "IX_DipCharts_TankId");

            migrationBuilder.AddColumn<Guid>(
                name: "omc_id",
                table: "stations",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddPrimaryKey(
                name: "PK_ShiftAssignments",
                table: "ShiftAssignments",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_DipChartEntries",
                table: "DipChartEntries",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_DipCharts",
                table: "DipCharts",
                column: "Id");

            migrationBuilder.CreateTable(
                name: "meter_readings",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    nozzle_id = table.Column<Guid>(type: "uuid", nullable: false),
                    shift_id = table.Column<Guid>(type: "uuid", nullable: false),
                    reading_type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    totalizer_value = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: false),
                    recorded_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    recorded_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_meter_readings", x => x.id);
                    table.ForeignKey(
                        name: "FK_meter_readings_AspNetUsers_recorded_by_user_id",
                        column: x => x.recorded_by_user_id,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_meter_readings_fuel_nozzles_nozzle_id",
                        column: x => x.nozzle_id,
                        principalTable: "fuel_nozzles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_meter_readings_station_shifts_shift_id",
                        column: x => x.shift_id,
                        principalTable: "station_shifts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "omcs",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    address = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    phone = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    website = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    logo_url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    contact_person = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    contact_person_email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    contact_person_phone = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_omcs", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "tank_dip_readings",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    tank_id = table.Column<Guid>(type: "uuid", nullable: false),
                    shift_id = table.Column<Guid>(type: "uuid", nullable: true),
                    reading_type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    depth_cm = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: false),
                    volume_liters = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: false),
                    read_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    recorded_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tank_dip_readings", x => x.id);
                    table.ForeignKey(
                        name: "FK_tank_dip_readings_AspNetUsers_recorded_by_user_id",
                        column: x => x.recorded_by_user_id,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_tank_dip_readings_fuel_tanks_tank_id",
                        column: x => x.tank_id,
                        principalTable: "fuel_tanks",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_tank_dip_readings_station_shifts_shift_id",
                        column: x => x.shift_id,
                        principalTable: "station_shifts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "omc_fuel_types",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    omc_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_omc_fuel_types", x => x.id);
                    table.ForeignKey(
                        name: "FK_omc_fuel_types_omcs_omc_id",
                        column: x => x.omc_id,
                        principalTable: "omcs",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_stations_omc_id",
                table: "stations",
                column: "omc_id");

            migrationBuilder.CreateIndex(
                name: "IX_meter_readings_nozzle_id",
                table: "meter_readings",
                column: "nozzle_id");

            migrationBuilder.CreateIndex(
                name: "IX_meter_readings_recorded_by_user_id",
                table: "meter_readings",
                column: "recorded_by_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_meter_readings_shift_id",
                table: "meter_readings",
                column: "shift_id");

            migrationBuilder.CreateIndex(
                name: "IX_omc_fuel_types_name",
                table: "omc_fuel_types",
                column: "name");

            migrationBuilder.CreateIndex(
                name: "IX_omc_fuel_types_omc_id",
                table: "omc_fuel_types",
                column: "omc_id");

            migrationBuilder.CreateIndex(
                name: "IX_omcs_name",
                table: "omcs",
                column: "name");

            migrationBuilder.CreateIndex(
                name: "IX_tank_dip_readings_recorded_by_user_id",
                table: "tank_dip_readings",
                column: "recorded_by_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_tank_dip_readings_shift_id",
                table: "tank_dip_readings",
                column: "shift_id");

            migrationBuilder.CreateIndex(
                name: "IX_tank_dip_readings_tank_id",
                table: "tank_dip_readings",
                column: "tank_id");

            migrationBuilder.AddForeignKey(
                name: "FK_DipChartEntries_DipCharts_DipChartId",
                table: "DipChartEntries",
                column: "DipChartId",
                principalTable: "DipCharts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_DipCharts_fuel_tanks_TankId",
                table: "DipCharts",
                column: "TankId",
                principalTable: "fuel_tanks",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ShiftAssignments_User_UserId",
                table: "ShiftAssignments",
                column: "UserId",
                principalTable: "User",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ShiftAssignments_fuel_nozzles_FuelNozzleId",
                table: "ShiftAssignments",
                column: "FuelNozzleId",
                principalTable: "fuel_nozzles",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ShiftAssignments_station_shifts_StationShiftId",
                table: "ShiftAssignments",
                column: "StationShiftId",
                principalTable: "station_shifts",
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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DipChartEntries_DipCharts_DipChartId",
                table: "DipChartEntries");

            migrationBuilder.DropForeignKey(
                name: "FK_DipCharts_fuel_tanks_TankId",
                table: "DipCharts");

            migrationBuilder.DropForeignKey(
                name: "FK_ShiftAssignments_User_UserId",
                table: "ShiftAssignments");

            migrationBuilder.DropForeignKey(
                name: "FK_ShiftAssignments_fuel_nozzles_FuelNozzleId",
                table: "ShiftAssignments");

            migrationBuilder.DropForeignKey(
                name: "FK_ShiftAssignments_station_shifts_StationShiftId",
                table: "ShiftAssignments");

            migrationBuilder.DropForeignKey(
                name: "FK_stations_omcs_omc_id",
                table: "stations");

            migrationBuilder.DropTable(
                name: "meter_readings");

            migrationBuilder.DropTable(
                name: "omc_fuel_types");

            migrationBuilder.DropTable(
                name: "tank_dip_readings");

            migrationBuilder.DropTable(
                name: "omcs");

            migrationBuilder.DropIndex(
                name: "IX_stations_omc_id",
                table: "stations");

            migrationBuilder.DropPrimaryKey(
                name: "PK_ShiftAssignments",
                table: "ShiftAssignments");

            migrationBuilder.DropPrimaryKey(
                name: "PK_DipCharts",
                table: "DipCharts");

            migrationBuilder.DropPrimaryKey(
                name: "PK_DipChartEntries",
                table: "DipChartEntries");

            migrationBuilder.DropColumn(
                name: "omc_id",
                table: "stations");

            migrationBuilder.RenameTable(
                name: "ShiftAssignments",
                newName: "ShiftAssignment");

            migrationBuilder.RenameTable(
                name: "DipCharts",
                newName: "DipChart");

            migrationBuilder.RenameTable(
                name: "DipChartEntries",
                newName: "DipChartEntry");

            migrationBuilder.RenameIndex(
                name: "IX_ShiftAssignments_UserId",
                table: "ShiftAssignment",
                newName: "IX_ShiftAssignment_UserId");

            migrationBuilder.RenameIndex(
                name: "IX_ShiftAssignments_StationShiftId",
                table: "ShiftAssignment",
                newName: "IX_ShiftAssignment_StationShiftId");

            migrationBuilder.RenameIndex(
                name: "IX_ShiftAssignments_FuelNozzleId",
                table: "ShiftAssignment",
                newName: "IX_ShiftAssignment_FuelNozzleId");

            migrationBuilder.RenameIndex(
                name: "IX_DipCharts_TankId",
                table: "DipChart",
                newName: "IX_DipChart_TankId");

            migrationBuilder.RenameIndex(
                name: "IX_DipChartEntries_DipChartId",
                table: "DipChartEntry",
                newName: "IX_DipChartEntry_DipChartId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_ShiftAssignment",
                table: "ShiftAssignment",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_DipChart",
                table: "DipChart",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_DipChartEntry",
                table: "DipChartEntry",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_DipChart_fuel_tanks_TankId",
                table: "DipChart",
                column: "TankId",
                principalTable: "fuel_tanks",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_DipChartEntry_DipChart_DipChartId",
                table: "DipChartEntry",
                column: "DipChartId",
                principalTable: "DipChart",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ShiftAssignment_User_UserId",
                table: "ShiftAssignment",
                column: "UserId",
                principalTable: "User",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ShiftAssignment_fuel_nozzles_FuelNozzleId",
                table: "ShiftAssignment",
                column: "FuelNozzleId",
                principalTable: "fuel_nozzles",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ShiftAssignment_station_shifts_StationShiftId",
                table: "ShiftAssignment",
                column: "StationShiftId",
                principalTable: "station_shifts",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
