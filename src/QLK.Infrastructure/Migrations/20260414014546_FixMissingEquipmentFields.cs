using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QLK.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixMissingEquipmentFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "ExportDetailId",
                table: "IndividualEquipment",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ImportDetailId",
                table: "IndividualEquipment",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "RetrievalDetailId",
                table: "IndividualEquipment",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_IndividualEquipment_ExportDetailId",
                table: "IndividualEquipment",
                column: "ExportDetailId");

            migrationBuilder.CreateIndex(
                name: "IX_IndividualEquipment_ImportDetailId",
                table: "IndividualEquipment",
                column: "ImportDetailId");

            migrationBuilder.CreateIndex(
                name: "IX_IndividualEquipment_RetrievalDetailId",
                table: "IndividualEquipment",
                column: "RetrievalDetailId");

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
                name: "FK_IndividualEquipment_RetrievalDetails_RetrievalDetailId",
                table: "IndividualEquipment",
                column: "RetrievalDetailId",
                principalTable: "RetrievalDetails",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_IndividualEquipment_ExportDetails_ExportDetailId",
                table: "IndividualEquipment");

            migrationBuilder.DropForeignKey(
                name: "FK_IndividualEquipment_ImportDetails_ImportDetailId",
                table: "IndividualEquipment");

            migrationBuilder.DropForeignKey(
                name: "FK_IndividualEquipment_RetrievalDetails_RetrievalDetailId",
                table: "IndividualEquipment");

            migrationBuilder.DropIndex(
                name: "IX_IndividualEquipment_ExportDetailId",
                table: "IndividualEquipment");

            migrationBuilder.DropIndex(
                name: "IX_IndividualEquipment_ImportDetailId",
                table: "IndividualEquipment");

            migrationBuilder.DropIndex(
                name: "IX_IndividualEquipment_RetrievalDetailId",
                table: "IndividualEquipment");

            migrationBuilder.DropColumn(
                name: "ExportDetailId",
                table: "IndividualEquipment");

            migrationBuilder.DropColumn(
                name: "ImportDetailId",
                table: "IndividualEquipment");

            migrationBuilder.DropColumn(
                name: "RetrievalDetailId",
                table: "IndividualEquipment");
        }
    }
}
