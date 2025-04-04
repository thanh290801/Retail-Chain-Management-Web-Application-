using Microsoft.EntityFrameworkCore.Migrations;

namespace RCM.Backend.Migrations
{
    public partial class AddIsRejectedToOvertimeRecord : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsRejected", // Tên cột mới
                table: "OvertimeRecords", // Tên bảng hiện có
                type: "bit", // Kiểu dữ liệu trong SQL Server (boolean)
                nullable: false, // Không cho phép null
                defaultValue: false); // Giá trị mặc định là false
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsRejected",
                table: "OvertimeRecords");
        }
    }
}