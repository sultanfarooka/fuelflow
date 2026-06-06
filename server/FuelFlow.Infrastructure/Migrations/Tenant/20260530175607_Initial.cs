using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FuelFlow.Infrastructure.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class Initial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "organizations",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    owner_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_organizations", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "bank_accounts",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    organization_id = table.Column<Guid>(type: "uuid", nullable: false),
                    bank_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    account_number = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    account_title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    is_primary = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_bank_accounts", x => x.id);
                    table.ForeignKey(
                        name: "FK_bank_accounts_organizations_organization_id",
                        column: x => x.organization_id,
                        principalTable: "organizations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "stations",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    address = table.Column<string>(type: "text", nullable: true),
                    phone = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    logo_url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    organization_id = table.Column<Guid>(type: "uuid", nullable: false),
                    omc_id = table.Column<Guid>(type: "uuid", nullable: false),
                    is_setup_complete = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    accepted_payment_methods = table.Column<string>(type: "jsonb", nullable: false, defaultValueSql: "'[\"Cash\"]'::jsonb"),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_stations", x => x.id);
                    // omc_id is a cross-context reference to the control-plane "omcs"
                    // table (M14): NO FK constraint — tenant DBs are physically separate
                    // and don't contain omcs. Existence is enforced at the application
                    // layer via the control-plane OMC repository.
                    table.ForeignKey(
                        name: "FK_stations_organizations_organization_id",
                        column: x => x.organization_id,
                        principalTable: "organizations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "fuel_prices",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    fuel_type_id = table.Column<Guid>(type: "uuid", nullable: false),
                    station_id = table.Column<Guid>(type: "uuid", nullable: false),
                    price = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: false),
                    effective_from = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    effective_to = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_fuel_prices", x => x.id);
                    // fuel_type_id is a cross-context reference to control-plane
                    // "fuel_types" (M14): NO FK constraint — see note on stations.omc_id.
                    table.ForeignKey(
                        name: "FK_fuel_prices_stations_station_id",
                        column: x => x.station_id,
                        principalTable: "stations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "fuel_tanks",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    capacity_liters = table.Column<decimal>(type: "numeric", nullable: false),
                    fuel_type_id = table.Column<Guid>(type: "uuid", nullable: false),
                    station_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_fuel_tanks", x => x.id);
                    // fuel_type_id is a cross-context reference to control-plane
                    // "fuel_types" (M14): NO FK constraint — see note on stations.omc_id.
                    table.ForeignKey(
                        name: "FK_fuel_tanks_stations_station_id",
                        column: x => x.station_id,
                        principalTable: "stations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "station_shift_configs",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    station_id = table.Column<Guid>(type: "uuid", nullable: false),
                    shift_count = table.Column<int>(type: "integer", nullable: false),
                    shift1_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    shift1_start_time = table.Column<TimeSpan>(type: "time", nullable: false),
                    shift2_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    shift2_start_time = table.Column<TimeSpan>(type: "time", nullable: false),
                    shift3_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    shift3_start_time = table.Column<TimeSpan>(type: "time", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_station_shift_configs", x => x.id);
                    table.ForeignKey(
                        name: "FK_station_shift_configs_stations_station_id",
                        column: x => x.station_id,
                        principalTable: "stations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "station_shifts",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    station_id = table.Column<Guid>(type: "uuid", nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    opened_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    closed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    opening_cash = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: false),
                    closing_cash = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: true),
                    opened_by_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    closed_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    shift_name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    total_cash = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: false),
                    total_sales = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: false),
                    total_credit_sales = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: false),
                    total_card_sales = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: false),
                    total_digital_sales = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: false),
                    total_expenses = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_station_shifts", x => x.id);
                    table.ForeignKey(
                        name: "FK_station_shifts_stations_station_id",
                        column: x => x.station_id,
                        principalTable: "stations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "user_stations",
                columns: table => new
                {
                    station_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_stations", x => new { x.station_id, x.user_id });
                    table.ForeignKey(
                        name: "FK_user_stations_stations_station_id",
                        column: x => x.station_id,
                        principalTable: "stations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DipCharts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TankId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DipCharts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DipCharts_fuel_tanks_TankId",
                        column: x => x.TankId,
                        principalTable: "fuel_tanks",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "fuel_nozzles",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    nozzle_number = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    tank_id = table.Column<Guid>(type: "uuid", nullable: false),
                    station_id = table.Column<Guid>(type: "uuid", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_fuel_nozzles", x => x.id);
                    table.ForeignKey(
                        name: "FK_fuel_nozzles_fuel_tanks_tank_id",
                        column: x => x.tank_id,
                        principalTable: "fuel_tanks",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_fuel_nozzles_stations_station_id",
                        column: x => x.station_id,
                        principalTable: "stations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
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
                name: "DipChartEntries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DipChartId = table.Column<Guid>(type: "uuid", nullable: false),
                    DepthCm = table.Column<decimal>(type: "numeric", nullable: false),
                    VolumeLiters = table.Column<decimal>(type: "numeric", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DipChartEntries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DipChartEntries_DipCharts_DipChartId",
                        column: x => x.DipChartId,
                        principalTable: "DipCharts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

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
                name: "shift_assignments",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    station_shift_id = table.Column<Guid>(type: "uuid", nullable: false),
                    fuel_nozzle_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_shift_assignments", x => x.id);
                    table.ForeignKey(
                        name: "FK_shift_assignments_fuel_nozzles_fuel_nozzle_id",
                        column: x => x.fuel_nozzle_id,
                        principalTable: "fuel_nozzles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_shift_assignments_station_shifts_station_shift_id",
                        column: x => x.station_shift_id,
                        principalTable: "station_shifts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_bank_accounts_organization_id",
                table: "bank_accounts",
                column: "organization_id");

            migrationBuilder.CreateIndex(
                name: "IX_bank_accounts_organization_id_is_primary",
                table: "bank_accounts",
                columns: new[] { "organization_id", "is_primary" });

            migrationBuilder.CreateIndex(
                name: "IX_DipChartEntries_DipChartId",
                table: "DipChartEntries",
                column: "DipChartId");

            migrationBuilder.CreateIndex(
                name: "IX_DipCharts_TankId",
                table: "DipCharts",
                column: "TankId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_fuel_nozzles_station_id",
                table: "fuel_nozzles",
                column: "station_id");

            migrationBuilder.CreateIndex(
                name: "IX_fuel_nozzles_tank_id",
                table: "fuel_nozzles",
                column: "tank_id");

            migrationBuilder.CreateIndex(
                name: "IX_fuel_nozzles_tank_id_nozzle_number",
                table: "fuel_nozzles",
                columns: new[] { "tank_id", "nozzle_number" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_fuel_prices_fuel_type_id",
                table: "fuel_prices",
                column: "fuel_type_id");

            migrationBuilder.CreateIndex(
                name: "IX_fuel_prices_station_id",
                table: "fuel_prices",
                column: "station_id");

            migrationBuilder.CreateIndex(
                name: "IX_fuel_prices_station_id_fuel_type_id_effective_from",
                table: "fuel_prices",
                columns: new[] { "station_id", "fuel_type_id", "effective_from" });

            migrationBuilder.CreateIndex(
                name: "IX_fuel_tanks_fuel_type_id",
                table: "fuel_tanks",
                column: "fuel_type_id");

            migrationBuilder.CreateIndex(
                name: "IX_fuel_tanks_station_id",
                table: "fuel_tanks",
                column: "station_id");

            migrationBuilder.CreateIndex(
                name: "IX_fuel_tanks_station_id_name",
                table: "fuel_tanks",
                columns: new[] { "station_id", "name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_meter_readings_nozzle_id",
                table: "meter_readings",
                column: "nozzle_id");

            migrationBuilder.CreateIndex(
                name: "IX_meter_readings_shift_id",
                table: "meter_readings",
                column: "shift_id");

            migrationBuilder.CreateIndex(
                name: "IX_organizations_owner_id",
                table: "organizations",
                column: "owner_id");

            migrationBuilder.CreateIndex(
                name: "IX_shift_assignments_fuel_nozzle_id",
                table: "shift_assignments",
                column: "fuel_nozzle_id");

            migrationBuilder.CreateIndex(
                name: "IX_shift_assignments_station_shift_id",
                table: "shift_assignments",
                column: "station_shift_id");

            migrationBuilder.CreateIndex(
                name: "IX_shift_assignments_user_id",
                table: "shift_assignments",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_station_shift_configs_station_id",
                table: "station_shift_configs",
                column: "station_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_station_shifts_closed_by_user_id",
                table: "station_shifts",
                column: "closed_by_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_station_shifts_opened_by_user_id",
                table: "station_shifts",
                column: "opened_by_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_station_shifts_station_id",
                table: "station_shifts",
                column: "station_id");

            migrationBuilder.CreateIndex(
                name: "IX_station_shifts_status",
                table: "station_shifts",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_stations_omc_id",
                table: "stations",
                column: "omc_id");

            migrationBuilder.CreateIndex(
                name: "IX_stations_organization_id",
                table: "stations",
                column: "organization_id");

            migrationBuilder.CreateIndex(
                name: "IX_tank_dip_readings_shift_id",
                table: "tank_dip_readings",
                column: "shift_id");

            migrationBuilder.CreateIndex(
                name: "IX_tank_dip_readings_tank_id",
                table: "tank_dip_readings",
                column: "tank_id");

            migrationBuilder.CreateIndex(
                name: "IX_user_stations_station_id",
                table: "user_stations",
                column: "station_id");

            migrationBuilder.CreateIndex(
                name: "IX_user_stations_user_id",
                table: "user_stations",
                column: "user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "bank_accounts");

            migrationBuilder.DropTable(
                name: "DipChartEntries");

            migrationBuilder.DropTable(
                name: "fuel_prices");

            migrationBuilder.DropTable(
                name: "meter_readings");

            migrationBuilder.DropTable(
                name: "shift_assignments");

            migrationBuilder.DropTable(
                name: "station_shift_configs");

            migrationBuilder.DropTable(
                name: "tank_dip_readings");

            migrationBuilder.DropTable(
                name: "user_stations");

            migrationBuilder.DropTable(
                name: "DipCharts");

            migrationBuilder.DropTable(
                name: "fuel_nozzles");

            migrationBuilder.DropTable(
                name: "station_shifts");

            migrationBuilder.DropTable(
                name: "fuel_tanks");

            migrationBuilder.DropTable(
                name: "stations");

            migrationBuilder.DropTable(
                name: "organizations");
        }
    }
}
