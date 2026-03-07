using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FuelFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SeedOMCsWithDummyData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                INSERT INTO omcs (id, name, address, phone, email, website, logo_url, contact_person, contact_person_email, contact_person_phone, created_at, updated_at)
                VALUES
                    ('e0e54749-bb85-4f0d-bb4c-1b3b8654b8b1'::uuid, 'PSO', 'PSO House, 3-K, Block 6, PECHS, Karachi 75400', '+92-21-111-774-774', 'info@pso.com.pk', 'https://www.pso.com.pk', '', 'Customer Service', 'customerservice@pso.com.pk', '+92-21-111-774-774', '2024-01-01 00:00:00+00', '2024-01-01 00:00:00+00'),
                    ('85b2756b-113d-417e-bffc-a6b4b063b4d8'::uuid, 'Shell', 'Shell House, 6, Ch. Khaliquzzaman Road, Karachi 75530', '+92-21-111-743-553', 'info@shell.com.pk', 'https://www.shell.com.pk', '', 'Customer Care', 'customercare@shell.com.pk', '+92-21-111-743-553', '2024-01-01 00:00:00+00', '2024-01-01 00:00:00+00'),
                    ('b804916f-33ab-4fb6-9837-9a9024eabcbe'::uuid, 'Total', 'Total Parco House, 1-A, Kohistan Road, F-8 Markaz, Islamabad 44000', '+92-51-111-868-255', 'info@total-parco.com.pk', 'https://www.total-parco.com.pk', '', 'Support Team', 'support@total-parco.com.pk', '+92-51-111-868-255', '2024-01-01 00:00:00+00', '2024-01-01 00:00:00+00')
                ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    address = EXCLUDED.address,
                    phone = EXCLUDED.phone,
                    email = EXCLUDED.email,
                    website = EXCLUDED.website,
                    logo_url = EXCLUDED.logo_url,
                    contact_person = EXCLUDED.contact_person,
                    contact_person_email = EXCLUDED.contact_person_email,
                    contact_person_phone = EXCLUDED.contact_person_phone,
                    updated_at = EXCLUDED.updated_at;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                UPDATE omcs SET
                    address = '', phone = '', email = '', website = '', logo_url = '',
                    contact_person = '', contact_person_email = '', contact_person_phone = ''
                WHERE id IN (
                    'e0e54749-bb85-4f0d-bb4c-1b3b8654b8b1'::uuid,
                    '85b2756b-113d-417e-bffc-a6b4b063b4d8'::uuid,
                    'b804916f-33ab-4fb6-9837-9a9024eabcbe'::uuid
                );
            ");
        }
    }
}
