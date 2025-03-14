using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RCM.Backend.Migrations
{
    public partial class AddCashHandoverTable : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK__Cash_Hand__Branc__6166761E",
                table: "Cash_Handover");

            migrationBuilder.DropForeignKey(
                name: "FK__Cash_Hand__Emplo__5F7E2DAC",
                table: "Cash_Handover");

            migrationBuilder.DropForeignKey(
                name: "FK__Cash_Hand__Recei__607251E5",
                table: "Cash_Handover");

            migrationBuilder.DropPrimaryKey(
                name: "PK__Cash_Han__DB2A1F6143CFC0E5",
                table: "Cash_Handover");

            migrationBuilder.RenameColumn(
                name: "EmployeeID",
                table: "Cash_Handover",
                newName: "EmployeeId");

            migrationBuilder.RenameIndex(
                name: "IX_Cash_Handover_EmployeeID",
                table: "Cash_Handover",
                newName: "IX_Cash_Handover_EmployeeId");

            migrationBuilder.AddColumn<int>(
                name: "BranchID",
                table: "Cash_Transactions",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "Cash_Transactions",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "FullName",
                table: "Cash_Transactions",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AlterColumn<int>(
                name: "ReceiverID",
                table: "Cash_Handover",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "EmployeeId",
                table: "Cash_Handover",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "Cash_Handover",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<int>(
                name: "CreatedBy",
                table: "Cash_Handover",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "Cash_Handover",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "EmployeeID",
                table: "Cash_Handover",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "EmployeeId1",
                table: "Cash_Handover",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Note",
                table: "Cash_Handover",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PersonName",
                table: "Cash_Handover",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TransactionType",
                table: "Cash_Handover",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "WarehousesId",
                table: "Cash_Handover",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "BranchID",
                table: "Bank_Transactions",
                type: "int",
                nullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_Cash_Handover",
                table: "Cash_Handover",
                column: "HandoverID");

            migrationBuilder.CreateIndex(
                name: "IX_Cash_Handover_EmployeeID",
                table: "Cash_Handover",
                column: "EmployeeID");

            migrationBuilder.CreateIndex(
                name: "IX_Cash_Handover_EmployeeId1",
                table: "Cash_Handover",
                column: "EmployeeId1");

            migrationBuilder.CreateIndex(
                name: "IX_Cash_Handover_WarehousesId",
                table: "Cash_Handover",
                column: "WarehousesId");

            migrationBuilder.AddForeignKey(
                name: "FK_Cash_Handover_Employee_EmployeeId",
                table: "Cash_Handover",
                column: "EmployeeId",
                principalTable: "Employee",
                principalColumn: "EmployeeID");

            migrationBuilder.AddForeignKey(
                name: "FK_Cash_Handover_Employee_EmployeeId1",
                table: "Cash_Handover",
                column: "EmployeeId1",
                principalTable: "Employee",
                principalColumn: "EmployeeID");

            migrationBuilder.AddForeignKey(
                name: "FK_Cash_Handover_warehouses_WarehousesId",
                table: "Cash_Handover",
                column: "WarehousesId",
                principalTable: "warehouses",
                principalColumn: "WarehousesId");

            migrationBuilder.AddForeignKey(
                name: "FK_CashHandover_Branch",
                table: "Cash_Handover",
                column: "BranchID",
                principalTable: "batches",
                principalColumn: "BatchesId");

            migrationBuilder.AddForeignKey(
                name: "FK_CashHandover_Employee",
                table: "Cash_Handover",
                column: "EmployeeID",
                principalTable: "Employee",
                principalColumn: "EmployeeID");

            migrationBuilder.AddForeignKey(
                name: "FK_CashHandover_Receiver",
                table: "Cash_Handover",
                column: "ReceiverID",
                principalTable: "Employee",
                principalColumn: "EmployeeID",
                onDelete: ReferentialAction.SetNull);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Cash_Handover_Employee_EmployeeId",
                table: "Cash_Handover");

            migrationBuilder.DropForeignKey(
                name: "FK_Cash_Handover_Employee_EmployeeId1",
                table: "Cash_Handover");

            migrationBuilder.DropForeignKey(
                name: "FK_Cash_Handover_warehouses_WarehousesId",
                table: "Cash_Handover");

            migrationBuilder.DropForeignKey(
                name: "FK_CashHandover_Branch",
                table: "Cash_Handover");

            migrationBuilder.DropForeignKey(
                name: "FK_CashHandover_Employee",
                table: "Cash_Handover");

            migrationBuilder.DropForeignKey(
                name: "FK_CashHandover_Receiver",
                table: "Cash_Handover");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Cash_Handover",
                table: "Cash_Handover");

            migrationBuilder.DropIndex(
                name: "IX_Cash_Handover_EmployeeID",
                table: "Cash_Handover");

            migrationBuilder.DropIndex(
                name: "IX_Cash_Handover_EmployeeId1",
                table: "Cash_Handover");

            migrationBuilder.DropIndex(
                name: "IX_Cash_Handover_WarehousesId",
                table: "Cash_Handover");

            migrationBuilder.DropColumn(
                name: "BranchID",
                table: "Cash_Transactions");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "Cash_Transactions");

            migrationBuilder.DropColumn(
                name: "FullName",
                table: "Cash_Transactions");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "Cash_Handover");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "Cash_Handover");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "Cash_Handover");

            migrationBuilder.DropColumn(
                name: "EmployeeID",
                table: "Cash_Handover");

            migrationBuilder.DropColumn(
                name: "EmployeeId1",
                table: "Cash_Handover");

            migrationBuilder.DropColumn(
                name: "Note",
                table: "Cash_Handover");

            migrationBuilder.DropColumn(
                name: "PersonName",
                table: "Cash_Handover");

            migrationBuilder.DropColumn(
                name: "TransactionType",
                table: "Cash_Handover");

            migrationBuilder.DropColumn(
                name: "WarehousesId",
                table: "Cash_Handover");

            migrationBuilder.DropColumn(
                name: "BranchID",
                table: "Bank_Transactions");

            migrationBuilder.RenameColumn(
                name: "EmployeeId",
                table: "Cash_Handover",
                newName: "EmployeeID");

            migrationBuilder.RenameIndex(
                name: "IX_Cash_Handover_EmployeeId",
                table: "Cash_Handover",
                newName: "IX_Cash_Handover_EmployeeID");

            migrationBuilder.AlterColumn<int>(
                name: "ReceiverID",
                table: "Cash_Handover",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AlterColumn<int>(
                name: "EmployeeID",
                table: "Cash_Handover",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK__Cash_Han__DB2A1F6143CFC0E5",
                table: "Cash_Handover",
                column: "HandoverID");

            migrationBuilder.AddForeignKey(
                name: "FK__Cash_Hand__Branc__6166761E",
                table: "Cash_Handover",
                column: "BranchID",
                principalTable: "warehouses",
                principalColumn: "WarehousesId");

            migrationBuilder.AddForeignKey(
                name: "FK__Cash_Hand__Emplo__5F7E2DAC",
                table: "Cash_Handover",
                column: "EmployeeID",
                principalTable: "Employee",
                principalColumn: "EmployeeID");

            migrationBuilder.AddForeignKey(
                name: "FK__Cash_Hand__Recei__607251E5",
                table: "Cash_Handover",
                column: "ReceiverID",
                principalTable: "Employee",
                principalColumn: "EmployeeID");
        }
    }
}
