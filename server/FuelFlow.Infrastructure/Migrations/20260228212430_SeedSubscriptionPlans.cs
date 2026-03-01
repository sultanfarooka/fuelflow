using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FuelFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SeedSubscriptionPlans : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Idempotent: insert only if row does not exist (safe for existing DBs).
            migrationBuilder.Sql(@"
                INSERT INTO subscription_plans (id, name, max_stations, max_users, created_at, updated_at)
                VALUES
                    ('11111111-1111-1111-1111-111111111101'::uuid, 'Starter', 1, 5, '2000-01-01 00:00:00+00'::timestamptz, '2000-01-01 00:00:00+00'::timestamptz),
                    ('11111111-1111-1111-1111-111111111102'::uuid, 'Professional', 3, 10, '2000-01-01 00:00:00+00'::timestamptz, '2000-01-01 00:00:00+00'::timestamptz),
                    ('11111111-1111-1111-1111-111111111103'::uuid, 'Enterprise', -1, -1, '2000-01-01 00:00:00+00'::timestamptz, '2000-01-01 00:00:00+00'::timestamptz)
                ON CONFLICT (id) DO NOTHING;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(table: "subscription_plans", keyColumn: "id", keyValue: new Guid("11111111-1111-1111-1111-111111111101"));
            migrationBuilder.DeleteData(table: "subscription_plans", keyColumn: "id", keyValue: new Guid("11111111-1111-1111-1111-111111111102"));
            migrationBuilder.DeleteData(table: "subscription_plans", keyColumn: "id", keyValue: new Guid("11111111-1111-1111-1111-111111111103"));
        }
    }
}
