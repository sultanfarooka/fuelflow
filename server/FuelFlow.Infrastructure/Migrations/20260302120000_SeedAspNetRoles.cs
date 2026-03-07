using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace FuelFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SeedAspNetRoles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "AspNetRoles",
                columns: new[] { "Id", "Name", "NormalizedName", "ConcurrencyStamp" },
                values: new object[,]
                {
                    { new Guid("b0000001-0000-0000-0000-000000000001"), "Owner", "OWNER", "b0000001-0000-0000-0000-000000000001" },
                    { new Guid("b0000002-0000-0000-0000-000000000002"), "Manager", "MANAGER", "b0000002-0000-0000-0000-000000000002" },
                    { new Guid("b0000003-0000-0000-0000-000000000003"), "Nozzleman", "NOZZLEMAN", "b0000003-0000-0000-0000-000000000003" },
                    { new Guid("b0000004-0000-0000-0000-000000000004"), "Accountant", "ACCOUNTANT", "b0000004-0000-0000-0000-000000000004" },
                    { new Guid("b0000005-0000-0000-0000-000000000005"), "Custom", "CUSTOM", "b0000005-0000-0000-0000-000000000005" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: new Guid("b0000001-0000-0000-0000-000000000001"));

            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: new Guid("b0000002-0000-0000-0000-000000000002"));

            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: new Guid("b0000003-0000-0000-0000-000000000003"));

            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: new Guid("b0000004-0000-0000-0000-000000000004"));

            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: new Guid("b0000005-0000-0000-0000-000000000005"));
        }
    }
}
