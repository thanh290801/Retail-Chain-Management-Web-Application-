using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RCM.Backend.Migrations
{
    public partial class ChangeBonusHoursToDecimal : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<decimal>(
                name: "BonusHours",
                table: "Salary",
                type: "decimal(18,2)",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "BonusHours",
                table: "Salary",
                type: "int",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)",
                oldNullable: true);
        }
    }
}
