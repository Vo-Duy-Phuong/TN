using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QLK.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTechnicianZones : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TechnicianZones",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TechnicianId = table.Column<Guid>(type: "uuid", nullable: false),
                    WardName = table.Column<string>(type: "text", nullable: false),
                    District = table.Column<string>(type: "text", nullable: false),
                    Province = table.Column<string>(type: "text", nullable: false),
                    AssignedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TechnicianZones", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TechnicianZones_Users_TechnicianId",
                        column: x => x.TechnicianId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TechnicianZones_TechnicianId_WardName",
                table: "TechnicianZones",
                columns: new[] { "TechnicianId", "WardName" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TechnicianZones");
        }
    }
}
