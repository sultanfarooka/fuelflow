using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FuelFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class addedOMEtoStation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_omcs_name",
                table: "omcs");

            migrationBuilder.DropColumn(
                name: "role",
                table: "AspNetUsers");

            migrationBuilder.CreateIndex(
                name: "IX_omcs_name",
                table: "omcs",
                column: "name",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_omcs_name",
                table: "omcs");

            migrationBuilder.AddColumn<string>(
                name: "role",
                table: "AspNetUsers",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_omcs_name",
                table: "omcs",
                column: "name");
        }
    }
}
