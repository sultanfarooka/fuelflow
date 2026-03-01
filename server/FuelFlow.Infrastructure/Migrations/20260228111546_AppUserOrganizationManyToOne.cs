using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FuelFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AppUserOrganizationManyToOne : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_AspNetUsers_organization_id",
                table: "AspNetUsers");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_organization_id",
                table: "AspNetUsers",
                column: "organization_id");

            // Clear organization_id that don't exist in organizations so FK can be added
            migrationBuilder.Sql(@"
                UPDATE ""AspNetUsers""
                SET organization_id = NULL
                WHERE organization_id IS NOT NULL
                  AND NOT EXISTS (SELECT 1 FROM organizations o WHERE o.id = ""AspNetUsers"".organization_id);
            ");

            migrationBuilder.AddForeignKey(
                name: "FK_AspNetUsers_organizations_organization_id",
                table: "AspNetUsers",
                column: "organization_id",
                principalTable: "organizations",
                principalColumn: "id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AspNetUsers_organizations_organization_id",
                table: "AspNetUsers");

            migrationBuilder.DropIndex(
                name: "IX_AspNetUsers_organization_id",
                table: "AspNetUsers");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_organization_id",
                table: "AspNetUsers",
                column: "organization_id",
                unique: true);
        }
    }
}
