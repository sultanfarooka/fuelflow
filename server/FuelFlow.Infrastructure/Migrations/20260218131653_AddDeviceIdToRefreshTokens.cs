using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FuelFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDeviceIdToRefreshTokens : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "device_id",
                table: "refresh_tokens",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "device_id",
                table: "refresh_tokens");
        }
    }
}
