using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QLK.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddGISFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "LastLatitude",
                table: "Users",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "LastLongitude",
                table: "Users",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Latitude",
                table: "ServiceRequests",
                type: "double precision",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<double>(
                name: "Longitude",
                table: "ServiceRequests",
                type: "double precision",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.CreateTable(
                name: "ServiceRequestEquipments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ServiceRequestId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductId = table.Column<Guid>(type: "uuid", nullable: false),
                    Quantity = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ServiceRequestEquipments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ServiceRequestEquipments_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ServiceRequestEquipments_ServiceRequests_ServiceRequestId",
                        column: x => x.ServiceRequestId,
                        principalTable: "ServiceRequests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ServiceRequestEquipments_ProductId",
                table: "ServiceRequestEquipments",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_ServiceRequestEquipments_ServiceRequestId",
                table: "ServiceRequestEquipments",
                column: "ServiceRequestId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ServiceRequestEquipments");

            migrationBuilder.DropColumn(
                name: "LastLatitude",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "LastLongitude",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Latitude",
                table: "ServiceRequests");

            migrationBuilder.DropColumn(
                name: "Longitude",
                table: "ServiceRequests");
        }
    }
}
