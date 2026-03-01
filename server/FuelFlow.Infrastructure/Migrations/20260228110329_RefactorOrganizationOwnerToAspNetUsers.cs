using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FuelFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RefactorOrganizationOwnerToAspNetUsers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "User");

            migrationBuilder.DropIndex(
                name: "IX_organizations_email",
                table: "organizations");

            migrationBuilder.DropIndex(
                name: "IX_AspNetUsers_organization_id",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "email",
                table: "organizations");

            migrationBuilder.DropColumn(
                name: "phone",
                table: "organizations");

            migrationBuilder.DropColumn(
                name: "registered_at",
                table: "organizations");

            migrationBuilder.DropColumn(
                name: "subscription_status",
                table: "organizations");

            migrationBuilder.DropColumn(
                name: "trial_ends_at",
                table: "organizations");

            migrationBuilder.AddColumn<Guid>(
                name: "owner_id",
                table: "organizations",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_organizations_owner_id",
                table: "organizations",
                column: "owner_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_organization_id",
                table: "AspNetUsers",
                column: "organization_id");

            // Backfill owner_id so FK can be added (use first AspNetUser when default guid has no match)
            migrationBuilder.Sql(@"
                UPDATE organizations
                SET owner_id = (SELECT ""Id"" FROM ""AspNetUsers"" LIMIT 1)
                WHERE owner_id = '00000000-0000-0000-0000-000000000000'
                   OR NOT EXISTS (SELECT 1 FROM ""AspNetUsers"" a WHERE a.""Id"" = organizations.owner_id);
            ");

            migrationBuilder.AddForeignKey(
                name: "FK_organizations_AspNetUsers_owner_id",
                table: "organizations",
                column: "owner_id",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_organizations_AspNetUsers_owner_id",
                table: "organizations");

            migrationBuilder.DropIndex(
                name: "IX_organizations_owner_id",
                table: "organizations");

            migrationBuilder.DropIndex(
                name: "IX_AspNetUsers_organization_id",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "owner_id",
                table: "organizations");

            migrationBuilder.AddColumn<string>(
                name: "email",
                table: "organizations",
                type: "character varying(255)",
                maxLength: 255,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "phone",
                table: "organizations",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "registered_at",
                table: "organizations",
                type: "timestamp with time zone",
                nullable: true,
                defaultValueSql: "NOW()");

            migrationBuilder.AddColumn<string>(
                name: "subscription_status",
                table: "organizations",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Trial");

            migrationBuilder.AddColumn<DateTime>(
                name: "trial_ends_at",
                table: "organizations",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "User",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Email = table.Column<string>(type: "text", nullable: false),
                    FullName = table.Column<string>(type: "text", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    Phone = table.Column<string>(type: "text", nullable: true),
                    Role = table.Column<int>(type: "integer", nullable: false),
                    SessionTimeoutMins = table.Column<int>(type: "integer", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_User", x => x.Id);
                    table.ForeignKey(
                        name: "FK_User_organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "organizations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_organizations_email",
                table: "organizations",
                column: "email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_organization_id",
                table: "AspNetUsers",
                column: "organization_id");

            migrationBuilder.CreateIndex(
                name: "IX_User_OrganizationId",
                table: "User",
                column: "OrganizationId");
        }
    }
}
