using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RCM.Backend.Migrations
{
    public partial class AddIsCalculatedToSalary : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<bool>(
                name: "IsDeleted",
                table: "SalaryPaymentHistory",
                type: "bit",
                nullable: false,
                defaultValueSql: "((0))",
                oldClrType: typeof(bool),
                oldType: "bit",
                oldNullable: true,
                oldDefaultValueSql: "((0))");

            // Remove BonusHours since it already exists
            // migrationBuilder.AddColumn<int>(
            //     name: "BonusHours",
            //     table: "Salary",
            //     type: "int",
            //     nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsCalculated",
                table: "Salary",
                type: "bit",
                nullable: false,
                defaultValue: false);

            // Remove SalaryPerShift since it already exists
            // migrationBuilder.AddColumn<int>(
            //     name: "SalaryPerShift",
            //     table: "Salary",
            //     type: "int",
            //     nullable: true);

            // Remove UpdateAt since it already exists
            // migrationBuilder.AddColumn<DateTime>(
            //     name: "UpdateAt",
            //     table: "Salary",
            //     type: "datetime2",
            //     nullable: true);

            //migrationBuilder.AddColumn<int>(
            //    name: "WorkingDays",
            //    table: "Salary",
            //    type: "int",
            //    nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Don’t drop BonusHours, SalaryPerShift, or UpdateAt since they existed before
            // migrationBuilder.DropColumn(
            //     name: "BonusHours",
            //     table: "Salary");

            migrationBuilder.DropColumn(
                name: "IsCalculated",
                table: "Salary");

            // migrationBuilder.DropColumn(
            //     name: "SalaryPerShift",
            //     table: "Salary");

            // migrationBuilder.DropColumn(
            //     name: "UpdateAt",
            //     table: "Salary");

            //migrationBuilder.DropColumn(
            //    name: "WorkingDays",
            //    table: "Salary");

            //migrationBuilder.AlterColumn<bool>(
            //    name: "IsDeleted",
            //    table: "SalaryPaymentHistory",
            //    type: "bit",
            //    nullable: true,
            //    defaultValueSql: "((0))",
            //    oldClrType: typeof(bool),
            //    oldType: "bit",
            //    oldDefaultValueSql: "((0))");
        }
    }
}