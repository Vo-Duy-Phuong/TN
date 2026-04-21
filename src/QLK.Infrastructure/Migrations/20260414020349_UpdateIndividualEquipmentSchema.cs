using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QLK.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateIndividualEquipmentSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_IndividualEquipment_ExportDetails_ExportDetailId",
                table: "IndividualEquipment");

            migrationBuilder.DropForeignKey(
                name: "FK_IndividualEquipment_ImportDetails_ImportDetailId",
                table: "IndividualEquipment");

            migrationBuilder.DropForeignKey(
                name: "FK_IndividualEquipment_Products_ProductId",
                table: "IndividualEquipment");

            migrationBuilder.DropForeignKey(
                name: "FK_IndividualEquipment_RetrievalDetails_RetrievalDetailId",
                table: "IndividualEquipment");

            migrationBuilder.DropForeignKey(
                name: "FK_IndividualEquipment_ServiceRequests_ServiceRequestId",
                table: "IndividualEquipment");

            migrationBuilder.DropPrimaryKey(
                name: "PK_IndividualEquipment",
                table: "IndividualEquipment");

            migrationBuilder.RenameTable(
                name: "IndividualEquipment",
                newName: "IndividualEquipments");

            migrationBuilder.RenameIndex(
                name: "IX_IndividualEquipment_ServiceRequestId",
                table: "IndividualEquipments",
                newName: "IX_IndividualEquipments_ServiceRequestId");

            migrationBuilder.RenameIndex(
                name: "IX_IndividualEquipment_RetrievalDetailId",
                table: "IndividualEquipments",
                newName: "IX_IndividualEquipments_RetrievalDetailId");

            migrationBuilder.RenameIndex(
                name: "IX_IndividualEquipment_ProductId",
                table: "IndividualEquipments",
                newName: "IX_IndividualEquipments_ProductId");

            migrationBuilder.RenameIndex(
                name: "IX_IndividualEquipment_ImportDetailId",
                table: "IndividualEquipments",
                newName: "IX_IndividualEquipments_ImportDetailId");

            migrationBuilder.RenameIndex(
                name: "IX_IndividualEquipment_ExportDetailId",
                table: "IndividualEquipments",
                newName: "IX_IndividualEquipments_ExportDetailId");

            migrationBuilder.AddColumn<Guid>(
                name: "WarehouseId",
                table: "IndividualEquipments",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_IndividualEquipments",
                table: "IndividualEquipments",
                column: "Id");

            migrationBuilder.CreateIndex(
                name: "IX_IndividualEquipments_WarehouseId",
                table: "IndividualEquipments",
                column: "WarehouseId");

            migrationBuilder.AddForeignKey(
                name: "FK_IndividualEquipments_ExportDetails_ExportDetailId",
                table: "IndividualEquipments",
                column: "ExportDetailId",
                principalTable: "ExportDetails",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_IndividualEquipments_ImportDetails_ImportDetailId",
                table: "IndividualEquipments",
                column: "ImportDetailId",
                principalTable: "ImportDetails",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_IndividualEquipments_Products_ProductId",
                table: "IndividualEquipments",
                column: "ProductId",
                principalTable: "Products",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_IndividualEquipments_RetrievalDetails_RetrievalDetailId",
                table: "IndividualEquipments",
                column: "RetrievalDetailId",
                principalTable: "RetrievalDetails",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_IndividualEquipments_ServiceRequests_ServiceRequestId",
                table: "IndividualEquipments",
                column: "ServiceRequestId",
                principalTable: "ServiceRequests",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_IndividualEquipments_Warehouses_WarehouseId",
                table: "IndividualEquipments",
                column: "WarehouseId",
                principalTable: "Warehouses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_IndividualEquipments_ExportDetails_ExportDetailId",
                table: "IndividualEquipments");

            migrationBuilder.DropForeignKey(
                name: "FK_IndividualEquipments_ImportDetails_ImportDetailId",
                table: "IndividualEquipments");

            migrationBuilder.DropForeignKey(
                name: "FK_IndividualEquipments_Products_ProductId",
                table: "IndividualEquipments");

            migrationBuilder.DropForeignKey(
                name: "FK_IndividualEquipments_RetrievalDetails_RetrievalDetailId",
                table: "IndividualEquipments");

            migrationBuilder.DropForeignKey(
                name: "FK_IndividualEquipments_ServiceRequests_ServiceRequestId",
                table: "IndividualEquipments");

            migrationBuilder.DropForeignKey(
                name: "FK_IndividualEquipments_Warehouses_WarehouseId",
                table: "IndividualEquipments");

            migrationBuilder.DropPrimaryKey(
                name: "PK_IndividualEquipments",
                table: "IndividualEquipments");

            migrationBuilder.DropIndex(
                name: "IX_IndividualEquipments_WarehouseId",
                table: "IndividualEquipments");

            migrationBuilder.DropColumn(
                name: "WarehouseId",
                table: "IndividualEquipments");

            migrationBuilder.RenameTable(
                name: "IndividualEquipments",
                newName: "IndividualEquipment");

            migrationBuilder.RenameIndex(
                name: "IX_IndividualEquipments_ServiceRequestId",
                table: "IndividualEquipment",
                newName: "IX_IndividualEquipment_ServiceRequestId");

            migrationBuilder.RenameIndex(
                name: "IX_IndividualEquipments_RetrievalDetailId",
                table: "IndividualEquipment",
                newName: "IX_IndividualEquipment_RetrievalDetailId");

            migrationBuilder.RenameIndex(
                name: "IX_IndividualEquipments_ProductId",
                table: "IndividualEquipment",
                newName: "IX_IndividualEquipment_ProductId");

            migrationBuilder.RenameIndex(
                name: "IX_IndividualEquipments_ImportDetailId",
                table: "IndividualEquipment",
                newName: "IX_IndividualEquipment_ImportDetailId");

            migrationBuilder.RenameIndex(
                name: "IX_IndividualEquipments_ExportDetailId",
                table: "IndividualEquipment",
                newName: "IX_IndividualEquipment_ExportDetailId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_IndividualEquipment",
                table: "IndividualEquipment",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_IndividualEquipment_ExportDetails_ExportDetailId",
                table: "IndividualEquipment",
                column: "ExportDetailId",
                principalTable: "ExportDetails",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_IndividualEquipment_ImportDetails_ImportDetailId",
                table: "IndividualEquipment",
                column: "ImportDetailId",
                principalTable: "ImportDetails",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_IndividualEquipment_Products_ProductId",
                table: "IndividualEquipment",
                column: "ProductId",
                principalTable: "Products",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_IndividualEquipment_RetrievalDetails_RetrievalDetailId",
                table: "IndividualEquipment",
                column: "RetrievalDetailId",
                principalTable: "RetrievalDetails",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_IndividualEquipment_ServiceRequests_ServiceRequestId",
                table: "IndividualEquipment",
                column: "ServiceRequestId",
                principalTable: "ServiceRequests",
                principalColumn: "Id");
        }
    }
}
