using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FuelFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddOnboardingEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "accepted_payment_methods",
                table: "stations",
                type: "jsonb",
                nullable: false,
                defaultValueSql: "'[\"Cash\"]'::jsonb");

            migrationBuilder.AddColumn<bool>(
                name: "is_setup_complete",
                table: "stations",
                type: "boolean",
                nullable: false,
                defaultValue: false);

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

            migrationBuilder.CreateIndex(
                name: "IX_bank_accounts_organization_id",
                table: "bank_accounts",
                column: "organization_id");

            migrationBuilder.CreateIndex(
                name: "IX_bank_accounts_organization_id_is_primary",
                table: "bank_accounts",
                columns: new[] { "organization_id", "is_primary" });

            migrationBuilder.CreateIndex(
                name: "IX_station_shift_configs_station_id",
                table: "station_shift_configs",
                column: "station_id",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "bank_accounts");

            migrationBuilder.DropTable(
                name: "station_shift_configs");

            migrationBuilder.DropColumn(
                name: "accepted_payment_methods",
                table: "stations");

            migrationBuilder.DropColumn(
                name: "is_setup_complete",
                table: "stations");
        }
    }
}
