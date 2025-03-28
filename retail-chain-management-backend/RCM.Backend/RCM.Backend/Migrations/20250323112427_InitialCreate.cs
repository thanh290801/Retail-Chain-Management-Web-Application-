using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RCM.Backend.Migrations
{
    public partial class InitialCreate : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Account",
                columns: table => new
                {
                    AccountID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Username = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Role = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: true, defaultValueSql: "((1))"),
                    ResetOtp = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    OtpexpireTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    EmployeeId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Account", x => x.AccountID);
                });

            migrationBuilder.CreateTable(
                name: "products",
                columns: table => new
                {
                    ProductsId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    name = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    barcode = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    unit = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    weight = table.Column<decimal>(type: "decimal(10,2)", nullable: true),
                    volume = table.Column<decimal>(type: "decimal(10,2)", nullable: true),
                    image_url = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    category = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    is_enabled = table.Column<bool>(type: "bit", nullable: true, defaultValueSql: "((1))")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__products__BB48EDE5F3F1EB85", x => x.ProductsId);
                });

            migrationBuilder.CreateTable(
                name: "sales_reports",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    report_month = table.Column<DateTime>(type: "date", nullable: false),
                    total_sales = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    total_cost = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    total_salary = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    total_profit = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    total_orders = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sales_reports", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "ShiftSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Month = table.Column<int>(type: "int", nullable: false),
                    Year = table.Column<int>(type: "int", nullable: false),
                    TotalShifts = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShiftSettings", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "suppliers",
                columns: table => new
                {
                    SuppliersId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    name = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    contact_person = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    phone = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    email = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    address = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__supplier__8AB703A4D1582F49", x => x.SuppliersId);
                });

            migrationBuilder.CreateTable(
                name: "warehouses",
                columns: table => new
                {
                    WarehousesId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    name = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    address = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    capacity = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__warehous__00D1C5832338674B", x => x.WarehousesId);
                });

            migrationBuilder.CreateTable(
                name: "product_prices",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    product_id = table.Column<int>(type: "int", nullable: false),
                    price = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    effective_date = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_product_prices", x => x.id);
                    table.ForeignKey(
                        name: "FK__product_p__produ__02FC7413",
                        column: x => x.product_id,
                        principalTable: "products",
                        principalColumn: "ProductsId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "supplier_products",
                columns: table => new
                {
                    SupplierProductsId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    supplier_id = table.Column<int>(type: "int", nullable: false),
                    product_id = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__supplier__6892C21ED19AEF7F", x => x.SupplierProductsId);
                    table.ForeignKey(
                        name: "FK__supplier___produ__395884C4",
                        column: x => x.product_id,
                        principalTable: "products",
                        principalColumn: "ProductsId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK__supplier___suppl__3A4CA8FD",
                        column: x => x.supplier_id,
                        principalTable: "suppliers",
                        principalColumn: "SuppliersId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "batches",
                columns: table => new
                {
                    BatchesId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    warehouse_id = table.Column<int>(type: "int", nullable: false),
                    received_date = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__batches__D7870D5CBB7EFCFE", x => x.BatchesId);
                    table.ForeignKey(
                        name: "FK__batches__warehou__151B244E",
                        column: x => x.warehouse_id,
                        principalTable: "warehouses",
                        principalColumn: "WarehousesId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "daily_sales_reports",
                columns: table => new
                {
                    ReportID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    warehouse_id = table.Column<int>(type: "int", nullable: false),
                    report_date = table.Column<DateTime>(type: "date", nullable: false),
                    total_sales = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    total_orders = table.Column<int>(type: "int", nullable: false),
                    created_at = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__daily_sa__D5BD48E518F85104", x => x.ReportID);
                    table.ForeignKey(
                        name: "FK__daily_sal__wareh__18EBB532",
                        column: x => x.warehouse_id,
                        principalTable: "warehouses",
                        principalColumn: "WarehousesId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Employee",
                columns: table => new
                {
                    EmployeeID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AccountID = table.Column<int>(type: "int", nullable: true),
                    ProfileImage = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    FullName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Phone = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Gender = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: true),
                    BirthDate = table.Column<DateTime>(type: "date", nullable: false),
                    IdentityNumber = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Hometown = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    WorkShiftId = table.Column<int>(type: "int", nullable: true),
                    FixedSalary = table.Column<int>(type: "int", nullable: true, defaultValueSql: "((0))"),
                    IsActive = table.Column<bool>(type: "bit", nullable: true, defaultValueSql: "((1))"),
                    StartDate = table.Column<DateTime>(type: "date", nullable: false),
                    BranchID = table.Column<int>(type: "int", nullable: true),
                    IsCheckedIn = table.Column<bool>(type: "bit", nullable: true, defaultValueSql: "((0))"),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "(getdate())"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Employee", x => x.EmployeeID);
                    table.ForeignKey(
                        name: "FK__Employee__Branch__1AD3FDA4",
                        column: x => x.BranchID,
                        principalTable: "warehouses",
                        principalColumn: "WarehousesId");
                    table.ForeignKey(
                        name: "FK_Employee_Account",
                        column: x => x.AccountID,
                        principalTable: "Account",
                        principalColumn: "AccountID");
                });

            migrationBuilder.CreateTable(
                name: "product_price_history",
                columns: table => new
                {
                    PriceHistoryID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    product_id = table.Column<int>(type: "int", nullable: false),
                    price_type = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    old_price = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    new_price = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    changed_by = table.Column<int>(type: "int", nullable: false),
                    change_date = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "(getdate())"),
                    warehouse_id = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__product___A927CB2B68C0B1C4", x => x.PriceHistoryID);
                    table.ForeignKey(
                        name: "FK__product_p__chang__2180FB33",
                        column: x => x.changed_by,
                        principalTable: "Account",
                        principalColumn: "AccountID");
                    table.ForeignKey(
                        name: "FK__product_p__produ__22751F6C",
                        column: x => x.product_id,
                        principalTable: "products",
                        principalColumn: "ProductsId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK__product_p__wareh__236943A5",
                        column: x => x.warehouse_id,
                        principalTable: "warehouses",
                        principalColumn: "WarehousesId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "promotions",
                columns: table => new
                {
                    PromotionsId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    name = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    product_id = table.Column<int>(type: "int", nullable: false),
                    warehouse_id = table.Column<int>(type: "int", nullable: false),
                    start_date = table.Column<DateTime>(type: "date", nullable: false),
                    end_date = table.Column<DateTime>(type: "date", nullable: false),
                    discount_percent = table.Column<decimal>(type: "decimal(5,2)", nullable: true),
                    description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__promotio__DBE22B922F2EDACB", x => x.PromotionsId);
                    table.ForeignKey(
                        name: "FK__promotion__produ__245D67DE",
                        column: x => x.product_id,
                        principalTable: "products",
                        principalColumn: "ProductsId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK__promotion__wareh__25518C17",
                        column: x => x.warehouse_id,
                        principalTable: "warehouses",
                        principalColumn: "WarehousesId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "purchase_orders",
                columns: table => new
                {
                    Purchase_ordersId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    supplier_id = table.Column<int>(type: "int", nullable: true),
                    order_date = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "(getdate())"),
                    status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    WarehousesId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__purchase__9736EF3EF43D85EF", x => x.Purchase_ordersId);
                    table.ForeignKey(
                        name: "FK__purchase___suppl__2A164134",
                        column: x => x.supplier_id,
                        principalTable: "suppliers",
                        principalColumn: "SuppliersId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_purchase_orders_warehouses_WarehousesId",
                        column: x => x.WarehousesId,
                        principalTable: "warehouses",
                        principalColumn: "WarehousesId");
                });

            migrationBuilder.CreateTable(
                name: "stock_adjustments",
                columns: table => new
                {
                    StockAdjustmentsId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    warehouse_id = table.Column<int>(type: "int", nullable: false),
                    auditor_id = table.Column<int>(type: "int", nullable: false),
                    adjustment_date = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "(getdate())"),
                    notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__stock_ad__02056934008DB342", x => x.StockAdjustmentsId);
                    table.ForeignKey(
                        name: "FK__stock_adj__audit__30C33EC3",
                        column: x => x.auditor_id,
                        principalTable: "Account",
                        principalColumn: "AccountID");
                    table.ForeignKey(
                        name: "FK__stock_adj__wareh__31B762FC",
                        column: x => x.warehouse_id,
                        principalTable: "warehouses",
                        principalColumn: "WarehousesId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "stock_audit_records",
                columns: table => new
                {
                    StockAuditRecordsId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    warehouse_id = table.Column<int>(type: "int", nullable: false),
                    auditor_id = table.Column<int>(type: "int", nullable: false),
                    co_auditor_id = table.Column<int>(type: "int", nullable: true),
                    audit_date = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__stock_au__1C0D2BE394761EEE", x => x.StockAuditRecordsId);
                    table.ForeignKey(
                        name: "FK__stock_aud__audit__3493CFA7",
                        column: x => x.auditor_id,
                        principalTable: "Account",
                        principalColumn: "AccountID");
                    table.ForeignKey(
                        name: "FK__stock_aud__co_au__3587F3E0",
                        column: x => x.co_auditor_id,
                        principalTable: "Account",
                        principalColumn: "AccountID",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK__stock_aud__wareh__367C1819",
                        column: x => x.warehouse_id,
                        principalTable: "warehouses",
                        principalColumn: "WarehousesId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "stock_levels",
                columns: table => new
                {
                    Stock_levelsId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    product_id = table.Column<int>(type: "int", nullable: false),
                    warehouse_id = table.Column<int>(type: "int", nullable: false),
                    quantity = table.Column<int>(type: "int", nullable: false),
                    min_quantity = table.Column<int>(type: "int", nullable: false, defaultValueSql: "((20))"),
                    purchase_price = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    wholesale_price = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    retail_price = table.Column<decimal>(type: "decimal(18,2)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__stock_le__76AB5D15AAAE7868", x => x.Stock_levelsId);
                    table.ForeignKey(
                        name: "FK__stock_lev__produ__37703C52",
                        column: x => x.product_id,
                        principalTable: "products",
                        principalColumn: "ProductsId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK__stock_lev__wareh__3864608B",
                        column: x => x.warehouse_id,
                        principalTable: "warehouses",
                        principalColumn: "WarehousesId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "warehouse_transfers",
                columns: table => new
                {
                    TransferID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    from_warehouse_id = table.Column<int>(type: "int", nullable: false),
                    to_warehouse_id = table.Column<int>(type: "int", nullable: false),
                    transfer_date = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "(getdate())"),
                    created_by = table.Column<int>(type: "int", nullable: false),
                    status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true, defaultValueSql: "('pending')"),
                    notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__warehous__9549017165A1B91A", x => x.TransferID);
                    table.ForeignKey(
                        name: "FK__warehouse__creat__41EDCAC5",
                        column: x => x.created_by,
                        principalTable: "Account",
                        principalColumn: "AccountID");
                    table.ForeignKey(
                        name: "FK__warehouse__from___42E1EEFE",
                        column: x => x.from_warehouse_id,
                        principalTable: "warehouses",
                        principalColumn: "WarehousesId");
                    table.ForeignKey(
                        name: "FK__warehouse__to_wa__43D61337",
                        column: x => x.to_warehouse_id,
                        principalTable: "warehouses",
                        principalColumn: "WarehousesId");
                });

            migrationBuilder.CreateTable(
                name: "AccountEmployee",
                columns: table => new
                {
                    AccountsAccountId = table.Column<int>(type: "int", nullable: false),
                    EmployeesEmployeeId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AccountEmployee", x => new { x.AccountsAccountId, x.EmployeesEmployeeId });
                    table.ForeignKey(
                        name: "FK_AccountEmployee_Account_AccountsAccountId",
                        column: x => x.AccountsAccountId,
                        principalTable: "Account",
                        principalColumn: "AccountID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AccountEmployee_Employee_EmployeesEmployeeId",
                        column: x => x.EmployeesEmployeeId,
                        principalTable: "Employee",
                        principalColumn: "EmployeeID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AttendanceCheckIn",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EmployeeId = table.Column<int>(type: "int", nullable: false),
                    AttendanceDate = table.Column<DateTime>(type: "date", nullable: false),
                    Shift = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    CheckInTime = table.Column<DateTime>(type: "datetime", nullable: false),
                    OnTime = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AttendanceCheckIn", x => x.Id);
                    table.ForeignKey(
                        name: "FK__Attendanc__Emplo__18EBB532",
                        column: x => x.EmployeeId,
                        principalTable: "Employee",
                        principalColumn: "EmployeeID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AttendanceCheckOut",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EmployeeId = table.Column<int>(type: "int", nullable: false),
                    AttendanceDate = table.Column<DateTime>(type: "date", nullable: false),
                    Shift = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    CheckOutTime = table.Column<DateTime>(type: "datetime", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AttendanceCheckOut", x => x.Id);
                    table.ForeignKey(
                        name: "FK__Attendanc__Emplo__1BC821DD",
                        column: x => x.EmployeeId,
                        principalTable: "Employee",
                        principalColumn: "EmployeeID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AttendanceRecord",
                columns: table => new
                {
                    AttendanceRecordsId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EmployeeId = table.Column<int>(type: "int", nullable: false),
                    CheckIn = table.Column<DateTime>(type: "datetime", nullable: true),
                    CheckOut = table.Column<DateTime>(type: "datetime", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Attendan__6D2B1F0C4A22C7E5", x => x.AttendanceRecordsId);
                    table.ForeignKey(
                        name: "FK__Attendanc__Emplo__114A936A",
                        column: x => x.EmployeeId,
                        principalTable: "Employee",
                        principalColumn: "EmployeeID");
                });

            migrationBuilder.CreateTable(
                name: "CASH",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EmployeeId = table.Column<int>(type: "int", nullable: false),
                    BranchId = table.Column<int>(type: "int", nullable: false),
                    payment_method = table.Column<int>(type: "int", nullable: false),
                    Type = table.Column<bool>(type: "bit", nullable: true),
                    Amount = table.Column<int>(type: "int", nullable: false),
                    Date = table.Column<DateTime>(type: "date", nullable: true),
                    note = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CASH", x => x.Id);
                    table.ForeignKey(
                        name: "FK__CASH__BranchId__7A672E12",
                        column: x => x.BranchId,
                        principalTable: "warehouses",
                        principalColumn: "WarehousesId");
                    table.ForeignKey(
                        name: "FK__CASH__EmployeeId__73BA3083",
                        column: x => x.EmployeeId,
                        principalTable: "Employee",
                        principalColumn: "EmployeeID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Cash_Handover",
                columns: table => new
                {
                    HandoverID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TransactionDate = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "(getdate())"),
                    EmployeeID = table.Column<int>(type: "int", nullable: false),
                    ReceiverID = table.Column<int>(type: "int", nullable: true),
                    BranchID = table.Column<int>(type: "int", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TransactionType = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: true, defaultValueSql: "('Thu')"),
                    Description = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    PersonName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false, defaultValueSql: "('Không xác d?nh')"),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "(getdate())"),
                    Note = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Cash_Han__DB2A1F61CE3A7914", x => x.HandoverID);
                    table.ForeignKey(
                        name: "FK__Cash_Hand__Branc__160F4887",
                        column: x => x.BranchID,
                        principalTable: "warehouses",
                        principalColumn: "WarehousesId");
                    table.ForeignKey(
                        name: "FK__Cash_Hand__Emplo__17036CC0",
                        column: x => x.EmployeeID,
                        principalTable: "Employee",
                        principalColumn: "EmployeeID");
                    table.ForeignKey(
                        name: "FK__Cash_Hand__Recei__17F790F9",
                        column: x => x.ReceiverID,
                        principalTable: "Employee",
                        principalColumn: "EmployeeID");
                });

            migrationBuilder.CreateTable(
                name: "End_Shifts",
                columns: table => new
                {
                    ShiftID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EmployeeID = table.Column<int>(type: "int", nullable: false),
                    BranchID = table.Column<int>(type: "int", nullable: false),
                    StartTime = table.Column<DateTime>(type: "datetime", nullable: false),
                    EndTime = table.Column<DateTime>(type: "datetime", nullable: false),
                    TotalSales = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    CashCollected = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    BankCollected = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    CashAtStart = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    CashAtEnd = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__End_Shif__C0A838E1F05C106C", x => x.ShiftID);
                    table.ForeignKey(
                        name: "FK__End_Shift__Branc__1BC821DD",
                        column: x => x.BranchID,
                        principalTable: "warehouses",
                        principalColumn: "WarehousesId");
                    table.ForeignKey(
                        name: "FK__End_Shift__Emplo__1CBC4616",
                        column: x => x.EmployeeID,
                        principalTable: "Employee",
                        principalColumn: "EmployeeID");
                });

            migrationBuilder.CreateTable(
                name: "Order",
                columns: table => new
                {
                    OrderId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    created_date = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "(getdate())"),
                    shop_id = table.Column<int>(type: "int", nullable: false),
                    total_amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    employeeid = table.Column<int>(type: "int", nullable: false),
                    payment_status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValueSql: "('Pending')")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Order", x => x.OrderId);
                    table.ForeignKey(
                        name: "FK__Order__employeei__1DB06A4F",
                        column: x => x.employeeid,
                        principalTable: "Employee",
                        principalColumn: "EmployeeID");
                    table.ForeignKey(
                        name: "FK__Order__shop_id__1EA48E88",
                        column: x => x.shop_id,
                        principalTable: "warehouses",
                        principalColumn: "WarehousesId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "OvertimeRecords",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EmployeeId = table.Column<int>(type: "int", nullable: false),
                    Date = table.Column<DateTime>(type: "date", nullable: false),
                    StartTime = table.Column<TimeSpan>(type: "time", nullable: false),
                    EndTime = table.Column<TimeSpan>(type: "time", nullable: false),
                    TotalHours = table.Column<decimal>(type: "decimal(5,2)", nullable: false),
                    Reason = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    IsApproved = table.Column<bool>(type: "bit", nullable: false, defaultValueSql: "((0))")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OvertimeRecords", x => x.Id);
                    table.ForeignKey(
                        name: "FK__OvertimeR__Emplo__160F4887",
                        column: x => x.EmployeeId,
                        principalTable: "Employee",
                        principalColumn: "EmployeeID");
                });

            migrationBuilder.CreateTable(
                name: "PenaltyPayments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EmployeeId = table.Column<int>(type: "int", nullable: false),
                    Amount = table.Column<int>(type: "int", nullable: false),
                    PaymentDate = table.Column<DateTime>(type: "date", nullable: false),
                    Reason = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    PaymentMethod = table.Column<int>(type: "int", nullable: false),
                    Note = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: true, defaultValueSql: "((0))")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PenaltyPayments", x => x.Id);
                    table.ForeignKey(
                        name: "FK__PenaltyPa__Emplo__0E6E26BF",
                        column: x => x.EmployeeId,
                        principalTable: "Employee",
                        principalColumn: "EmployeeID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Salary",
                columns: table => new
                {
                    SalaryId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EmployeeId = table.Column<int>(type: "int", nullable: false),
                    FixedSalary = table.Column<int>(type: "int", nullable: true),
                    StartDate = table.Column<DateTime>(type: "date", nullable: true),
                    EndDate = table.Column<DateTime>(type: "date", nullable: true),
                    BonusSalary = table.Column<int>(type: "int", nullable: true),
                    Penalty = table.Column<int>(type: "int", nullable: true),
                    FinalSalary = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Salary", x => x.SalaryId);
                    table.ForeignKey(
                        name: "FK__Salary__Employee__2DE6D218",
                        column: x => x.EmployeeId,
                        principalTable: "Employee",
                        principalColumn: "EmployeeID");
                });

            migrationBuilder.CreateTable(
                name: "batch_details",
                columns: table => new
                {
                    Batch_detailsId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    batch_id = table.Column<int>(type: "int", nullable: false),
                    product_id = table.Column<int>(type: "int", nullable: false),
                    purchase_order_id = table.Column<int>(type: "int", nullable: true),
                    quantity = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__batch_de__04D3CE3069F8D36A", x => x.Batch_detailsId);
                    table.ForeignKey(
                        name: "FK__batch_det__batch__123EB7A3",
                        column: x => x.batch_id,
                        principalTable: "batches",
                        principalColumn: "BatchesId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK__batch_det__produ__1332DBDC",
                        column: x => x.product_id,
                        principalTable: "products",
                        principalColumn: "ProductsId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK__batch_det__purch__14270015",
                        column: x => x.purchase_order_id,
                        principalTable: "purchase_orders",
                        principalColumn: "Purchase_ordersId",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "Purchase_Costs",
                columns: table => new
                {
                    CostID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PurchaseOrderID = table.Column<int>(type: "int", nullable: false),
                    TotalCost = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    BranchID = table.Column<int>(type: "int", nullable: false),
                    RecordedDate = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Purchase__8285231E4A994A7F", x => x.CostID);
                    table.ForeignKey(
                        name: "FK__Purchase___Branc__2645B050",
                        column: x => x.BranchID,
                        principalTable: "warehouses",
                        principalColumn: "WarehousesId");
                    table.ForeignKey(
                        name: "FK__Purchase___Purch__2739D489",
                        column: x => x.PurchaseOrderID,
                        principalTable: "purchase_orders",
                        principalColumn: "Purchase_ordersId");
                });

            migrationBuilder.CreateTable(
                name: "purchase_order_items",
                columns: table => new
                {
                    Purchase_order_itemsId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    purchase_order_id = table.Column<int>(type: "int", nullable: false),
                    product_id = table.Column<int>(type: "int", nullable: false),
                    quantity_ordered = table.Column<int>(type: "int", nullable: false),
                    quantity_received = table.Column<int>(type: "int", nullable: true, defaultValueSql: "((0))")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__purchase__4120509F6B7B071E", x => x.Purchase_order_itemsId);
                    table.ForeignKey(
                        name: "FK__purchase___produ__282DF8C2",
                        column: x => x.product_id,
                        principalTable: "products",
                        principalColumn: "ProductsId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK__purchase___purch__29221CFB",
                        column: x => x.purchase_order_id,
                        principalTable: "purchase_orders",
                        principalColumn: "Purchase_ordersId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "stock_adjustment_details",
                columns: table => new
                {
                    StockAdjustmentDetailsId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    adjustment_id = table.Column<int>(type: "int", nullable: false),
                    product_id = table.Column<int>(type: "int", nullable: false),
                    previous_quantity = table.Column<int>(type: "int", nullable: false),
                    adjusted_quantity = table.Column<int>(type: "int", nullable: false),
                    reason = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__stock_ad__5443DBDDEC7A5983", x => x.StockAdjustmentDetailsId);
                    table.ForeignKey(
                        name: "FK__stock_adj__adjus__2EDAF651",
                        column: x => x.adjustment_id,
                        principalTable: "stock_adjustments",
                        principalColumn: "StockAdjustmentsId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK__stock_adj__produ__2FCF1A8A",
                        column: x => x.product_id,
                        principalTable: "products",
                        principalColumn: "ProductsId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "stock_audit_details",
                columns: table => new
                {
                    StockAuditDetailsId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    audit_id = table.Column<int>(type: "int", nullable: false),
                    product_id = table.Column<int>(type: "int", nullable: false),
                    recorded_quantity = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__stock_au__814DB73894F66C3F", x => x.StockAuditDetailsId);
                    table.ForeignKey(
                        name: "FK__stock_aud__audit__32AB8735",
                        column: x => x.audit_id,
                        principalTable: "stock_audit_records",
                        principalColumn: "StockAuditRecordsId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK__stock_aud__produ__339FAB6E",
                        column: x => x.product_id,
                        principalTable: "products",
                        principalColumn: "ProductsId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "warehouse_transfer_details",
                columns: table => new
                {
                    TransferDetailID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    transfer_id = table.Column<int>(type: "int", nullable: false),
                    product_id = table.Column<int>(type: "int", nullable: false),
                    quantity = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__warehous__F9BF690F258FA262", x => x.TransferDetailID);
                    table.ForeignKey(
                        name: "FK__warehouse__produ__40058253",
                        column: x => x.product_id,
                        principalTable: "products",
                        principalColumn: "ProductsId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK__warehouse__trans__40F9A68C",
                        column: x => x.transfer_id,
                        principalTable: "warehouse_transfers",
                        principalColumn: "TransferID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "OrderDetail",
                columns: table => new
                {
                    OrderDetailId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    order_id = table.Column<int>(type: "int", nullable: false),
                    product_id = table.Column<int>(type: "int", nullable: false),
                    quantity = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    unit_price = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    total_price = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrderDetail", x => x.OrderDetailId);
                    table.ForeignKey(
                        name: "FK__OrderDeta__order__1F98B2C1",
                        column: x => x.order_id,
                        principalTable: "Order",
                        principalColumn: "OrderId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK__OrderDeta__produ__208CD6FA",
                        column: x => x.product_id,
                        principalTable: "products",
                        principalColumn: "ProductsId");
                });

            migrationBuilder.CreateTable(
                name: "Refund",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    order_id = table.Column<int>(type: "int", nullable: false),
                    employeeid = table.Column<int>(type: "int", nullable: false),
                    refund_date = table.Column<DateTime>(type: "date", nullable: false, defaultValueSql: "(getdate())"),
                    refund_amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    refund_status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValueSql: "('Pending')")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Refund", x => x.id);
                    table.ForeignKey(
                        name: "FK__Refund__employee__2B0A656D",
                        column: x => x.employeeid,
                        principalTable: "Employee",
                        principalColumn: "EmployeeID");
                    table.ForeignKey(
                        name: "FK__Refund__order_id__2BFE89A6",
                        column: x => x.order_id,
                        principalTable: "Order",
                        principalColumn: "OrderId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SalaryPaymentHistory",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EmployeeId = table.Column<int>(type: "int", nullable: false),
                    SalaryId = table.Column<int>(type: "int", nullable: false),
                    PaymentDate = table.Column<DateTime>(type: "date", nullable: true),
                    PaidAmount = table.Column<int>(type: "int", nullable: false),
                    PaymentMethod = table.Column<int>(type: "int", nullable: false),
                    Note = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: true, defaultValueSql: "((0))")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SalaryPaymentHistory", x => x.Id);
                    table.ForeignKey(
                        name: "FK__SalaryPay__Emplo__787EE5A0",
                        column: x => x.EmployeeId,
                        principalTable: "Employee",
                        principalColumn: "EmployeeID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK__SalaryPay__Salar__0B91BA14",
                        column: x => x.SalaryId,
                        principalTable: "Salary",
                        principalColumn: "SalaryId");
                });

            migrationBuilder.CreateTable(
                name: "RefundDetail",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    refund_id = table.Column<int>(type: "int", nullable: false),
                    product_id = table.Column<int>(type: "int", nullable: false),
                    quantity = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    unit_price = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    total_price = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RefundDetail", x => x.id);
                    table.ForeignKey(
                        name: "FK__RefundDet__refun__2CF2ADDF",
                        column: x => x.refund_id,
                        principalTable: "Refund",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Transactions",
                columns: table => new
                {
                    transaction_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    transaction_code = table.Column<string>(type: "varchar(20)", unicode: false, maxLength: 20, nullable: false),
                    transaction_type = table.Column<string>(type: "varchar(50)", unicode: false, maxLength: 50, nullable: false),
                    payment_method = table.Column<string>(type: "varchar(20)", unicode: false, maxLength: 20, nullable: false),
                    amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    transaction_date = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "(getdate())"),
                    reference_id = table.Column<string>(type: "varchar(50)", unicode: false, maxLength: 50, nullable: true),
                    bank_account = table.Column<string>(type: "varchar(50)", unicode: false, maxLength: 50, nullable: true),
                    employee_id = table.Column<int>(type: "int", nullable: false),
                    branch_id = table.Column<int>(type: "int", nullable: false),
                    performed_by = table.Column<string>(type: "varchar(100)", unicode: false, maxLength: 100, nullable: true),
                    order_id = table.Column<int>(type: "int", nullable: true),
                    refund_id = table.Column<int>(type: "int", nullable: true),
                    handover_id = table.Column<int>(type: "int", nullable: true),
                    description = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Transactions", x => x.transaction_id);
                    table.ForeignKey(
                        name: "FK_Transactions_Branch",
                        column: x => x.branch_id,
                        principalTable: "warehouses",
                        principalColumn: "WarehousesId");
                    table.ForeignKey(
                        name: "FK_Transactions_Employee",
                        column: x => x.employee_id,
                        principalTable: "Employee",
                        principalColumn: "EmployeeID");
                    table.ForeignKey(
                        name: "FK_Transactions_Handover",
                        column: x => x.handover_id,
                        principalTable: "Cash_Handover",
                        principalColumn: "HandoverID");
                    table.ForeignKey(
                        name: "FK_Transactions_Order",
                        column: x => x.order_id,
                        principalTable: "Order",
                        principalColumn: "OrderId");
                    table.ForeignKey(
                        name: "FK_Transactions_Refund",
                        column: x => x.refund_id,
                        principalTable: "Refund",
                        principalColumn: "id");
                });

            migrationBuilder.CreateIndex(
                name: "UQ__Account__536C85E46CF97CE1",
                table: "Account",
                column: "Username",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AccountEmployee_EmployeesEmployeeId",
                table: "AccountEmployee",
                column: "EmployeesEmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_AttendanceCheckIn_EmployeeId",
                table: "AttendanceCheckIn",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_AttendanceCheckOut_EmployeeId",
                table: "AttendanceCheckOut",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_AttendanceRecord_EmployeeId",
                table: "AttendanceRecord",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_batch_details_batch_id",
                table: "batch_details",
                column: "batch_id");

            migrationBuilder.CreateIndex(
                name: "IX_batch_details_product_id",
                table: "batch_details",
                column: "product_id");

            migrationBuilder.CreateIndex(
                name: "IX_batch_details_purchase_order_id",
                table: "batch_details",
                column: "purchase_order_id");

            migrationBuilder.CreateIndex(
                name: "IX_batches_warehouse_id",
                table: "batches",
                column: "warehouse_id");

            migrationBuilder.CreateIndex(
                name: "IX_CASH_BranchId",
                table: "CASH",
                column: "BranchId");

            migrationBuilder.CreateIndex(
                name: "IX_CASH_EmployeeId",
                table: "CASH",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_Cash_Handover_BranchID",
                table: "Cash_Handover",
                column: "BranchID");

            migrationBuilder.CreateIndex(
                name: "IX_Cash_Handover_EmployeeID",
                table: "Cash_Handover",
                column: "EmployeeID");

            migrationBuilder.CreateIndex(
                name: "IX_Cash_Handover_ReceiverID",
                table: "Cash_Handover",
                column: "ReceiverID");

            migrationBuilder.CreateIndex(
                name: "IX_daily_sales_reports_warehouse_id",
                table: "daily_sales_reports",
                column: "warehouse_id");

            migrationBuilder.CreateIndex(
                name: "IX_Employee_AccountID",
                table: "Employee",
                column: "AccountID",
                unique: true,
                filter: "[AccountID] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Employee_BranchID",
                table: "Employee",
                column: "BranchID");

            migrationBuilder.CreateIndex(
                name: "UQ__Employee__6354A73FB4499D6D",
                table: "Employee",
                column: "IdentityNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_End_Shifts_BranchID",
                table: "End_Shifts",
                column: "BranchID");

            migrationBuilder.CreateIndex(
                name: "IX_End_Shifts_EmployeeID",
                table: "End_Shifts",
                column: "EmployeeID");

            migrationBuilder.CreateIndex(
                name: "IX_Order_employeeid",
                table: "Order",
                column: "employeeid");

            migrationBuilder.CreateIndex(
                name: "IX_Order_shop_id",
                table: "Order",
                column: "shop_id");

            migrationBuilder.CreateIndex(
                name: "IX_OrderDetail_order_id",
                table: "OrderDetail",
                column: "order_id");

            migrationBuilder.CreateIndex(
                name: "IX_OrderDetail_product_id",
                table: "OrderDetail",
                column: "product_id");

            migrationBuilder.CreateIndex(
                name: "IX_OvertimeRecords_EmployeeId",
                table: "OvertimeRecords",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_PenaltyPayments_EmployeeId",
                table: "PenaltyPayments",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_product_price_history_changed_by",
                table: "product_price_history",
                column: "changed_by");

            migrationBuilder.CreateIndex(
                name: "IX_product_price_history_product_id",
                table: "product_price_history",
                column: "product_id");

            migrationBuilder.CreateIndex(
                name: "IX_product_price_history_warehouse_id",
                table: "product_price_history",
                column: "warehouse_id");

            migrationBuilder.CreateIndex(
                name: "IX_product_prices_product_id",
                table: "product_prices",
                column: "product_id");

            migrationBuilder.CreateIndex(
                name: "UQ__products__C16E36F8C3CC1692",
                table: "products",
                column: "barcode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_promotions_product_id",
                table: "promotions",
                column: "product_id");

            migrationBuilder.CreateIndex(
                name: "IX_promotions_warehouse_id",
                table: "promotions",
                column: "warehouse_id");

            migrationBuilder.CreateIndex(
                name: "IX_Purchase_Costs_BranchID",
                table: "Purchase_Costs",
                column: "BranchID");

            migrationBuilder.CreateIndex(
                name: "IX_Purchase_Costs_PurchaseOrderID",
                table: "Purchase_Costs",
                column: "PurchaseOrderID");

            migrationBuilder.CreateIndex(
                name: "IX_purchase_order_items_product_id",
                table: "purchase_order_items",
                column: "product_id");

            migrationBuilder.CreateIndex(
                name: "IX_purchase_order_items_purchase_order_id",
                table: "purchase_order_items",
                column: "purchase_order_id");

            migrationBuilder.CreateIndex(
                name: "IX_purchase_orders_supplier_id",
                table: "purchase_orders",
                column: "supplier_id");

            migrationBuilder.CreateIndex(
                name: "IX_purchase_orders_WarehousesId",
                table: "purchase_orders",
                column: "WarehousesId");

            migrationBuilder.CreateIndex(
                name: "IX_Refund_employeeid",
                table: "Refund",
                column: "employeeid");

            migrationBuilder.CreateIndex(
                name: "IX_Refund_order_id",
                table: "Refund",
                column: "order_id");

            migrationBuilder.CreateIndex(
                name: "IX_RefundDetail_refund_id",
                table: "RefundDetail",
                column: "refund_id");

            migrationBuilder.CreateIndex(
                name: "IX_Salary_EmployeeId",
                table: "Salary",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_SalaryPaymentHistory_EmployeeId",
                table: "SalaryPaymentHistory",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_SalaryPaymentHistory_SalaryId",
                table: "SalaryPaymentHistory",
                column: "SalaryId");

            migrationBuilder.CreateIndex(
                name: "IX_stock_adjustment_details_adjustment_id",
                table: "stock_adjustment_details",
                column: "adjustment_id");

            migrationBuilder.CreateIndex(
                name: "IX_stock_adjustment_details_product_id",
                table: "stock_adjustment_details",
                column: "product_id");

            migrationBuilder.CreateIndex(
                name: "IX_stock_adjustments_auditor_id",
                table: "stock_adjustments",
                column: "auditor_id");

            migrationBuilder.CreateIndex(
                name: "IX_stock_adjustments_warehouse_id",
                table: "stock_adjustments",
                column: "warehouse_id");

            migrationBuilder.CreateIndex(
                name: "IX_stock_audit_details_audit_id",
                table: "stock_audit_details",
                column: "audit_id");

            migrationBuilder.CreateIndex(
                name: "IX_stock_audit_details_product_id",
                table: "stock_audit_details",
                column: "product_id");

            migrationBuilder.CreateIndex(
                name: "IX_stock_audit_records_auditor_id",
                table: "stock_audit_records",
                column: "auditor_id");

            migrationBuilder.CreateIndex(
                name: "IX_stock_audit_records_co_auditor_id",
                table: "stock_audit_records",
                column: "co_auditor_id");

            migrationBuilder.CreateIndex(
                name: "IX_stock_audit_records_warehouse_id",
                table: "stock_audit_records",
                column: "warehouse_id");

            migrationBuilder.CreateIndex(
                name: "IX_stock_levels_product_id",
                table: "stock_levels",
                column: "product_id");

            migrationBuilder.CreateIndex(
                name: "IX_stock_levels_warehouse_id",
                table: "stock_levels",
                column: "warehouse_id");

            migrationBuilder.CreateIndex(
                name: "IX_supplier_products_product_id",
                table: "supplier_products",
                column: "product_id");

            migrationBuilder.CreateIndex(
                name: "IX_supplier_products_supplier_id",
                table: "supplier_products",
                column: "supplier_id");

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_branch_id",
                table: "Transactions",
                column: "branch_id");

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_employee_id",
                table: "Transactions",
                column: "employee_id");

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_handover_id",
                table: "Transactions",
                column: "handover_id");

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_order_id",
                table: "Transactions",
                column: "order_id");

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_refund_id",
                table: "Transactions",
                column: "refund_id");

            migrationBuilder.CreateIndex(
                name: "UQ__Transact__DD5740BEF432A0F9",
                table: "Transactions",
                column: "transaction_code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_warehouse_transfer_details_product_id",
                table: "warehouse_transfer_details",
                column: "product_id");

            migrationBuilder.CreateIndex(
                name: "IX_warehouse_transfer_details_transfer_id",
                table: "warehouse_transfer_details",
                column: "transfer_id");

            migrationBuilder.CreateIndex(
                name: "IX_warehouse_transfers_created_by",
                table: "warehouse_transfers",
                column: "created_by");

            migrationBuilder.CreateIndex(
                name: "IX_warehouse_transfers_from_warehouse_id",
                table: "warehouse_transfers",
                column: "from_warehouse_id");

            migrationBuilder.CreateIndex(
                name: "IX_warehouse_transfers_to_warehouse_id",
                table: "warehouse_transfers",
                column: "to_warehouse_id");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AccountEmployee");

            migrationBuilder.DropTable(
                name: "AttendanceCheckIn");

            migrationBuilder.DropTable(
                name: "AttendanceCheckOut");

            migrationBuilder.DropTable(
                name: "AttendanceRecord");

            migrationBuilder.DropTable(
                name: "batch_details");

            migrationBuilder.DropTable(
                name: "CASH");

            migrationBuilder.DropTable(
                name: "daily_sales_reports");

            migrationBuilder.DropTable(
                name: "End_Shifts");

            migrationBuilder.DropTable(
                name: "OrderDetail");

            migrationBuilder.DropTable(
                name: "OvertimeRecords");

            migrationBuilder.DropTable(
                name: "PenaltyPayments");

            migrationBuilder.DropTable(
                name: "product_price_history");

            migrationBuilder.DropTable(
                name: "product_prices");

            migrationBuilder.DropTable(
                name: "promotions");

            migrationBuilder.DropTable(
                name: "Purchase_Costs");

            migrationBuilder.DropTable(
                name: "purchase_order_items");

            migrationBuilder.DropTable(
                name: "RefundDetail");

            migrationBuilder.DropTable(
                name: "SalaryPaymentHistory");

            migrationBuilder.DropTable(
                name: "sales_reports");

            migrationBuilder.DropTable(
                name: "ShiftSettings");

            migrationBuilder.DropTable(
                name: "stock_adjustment_details");

            migrationBuilder.DropTable(
                name: "stock_audit_details");

            migrationBuilder.DropTable(
                name: "stock_levels");

            migrationBuilder.DropTable(
                name: "supplier_products");

            migrationBuilder.DropTable(
                name: "Transactions");

            migrationBuilder.DropTable(
                name: "warehouse_transfer_details");

            migrationBuilder.DropTable(
                name: "batches");

            migrationBuilder.DropTable(
                name: "purchase_orders");

            migrationBuilder.DropTable(
                name: "Salary");

            migrationBuilder.DropTable(
                name: "stock_adjustments");

            migrationBuilder.DropTable(
                name: "stock_audit_records");

            migrationBuilder.DropTable(
                name: "Cash_Handover");

            migrationBuilder.DropTable(
                name: "Refund");

            migrationBuilder.DropTable(
                name: "products");

            migrationBuilder.DropTable(
                name: "warehouse_transfers");

            migrationBuilder.DropTable(
                name: "suppliers");

            migrationBuilder.DropTable(
                name: "Order");

            migrationBuilder.DropTable(
                name: "Employee");

            migrationBuilder.DropTable(
                name: "warehouses");

            migrationBuilder.DropTable(
                name: "Account");
        }
    }
}
