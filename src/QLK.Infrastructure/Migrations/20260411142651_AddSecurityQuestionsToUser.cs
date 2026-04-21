using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QLK.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSecurityQuestionsToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SecurityAnswerHash",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SecurityQuestion",
                table: "Users",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SecurityAnswerHash",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "SecurityQuestion",
                table: "Users");
        }
    }
}
