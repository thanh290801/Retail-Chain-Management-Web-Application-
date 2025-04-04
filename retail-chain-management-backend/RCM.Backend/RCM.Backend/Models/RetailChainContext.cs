using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;

namespace RCM.Backend.Models
{
    public partial class RetailChainContext : DbContext
    {
        public RetailChainContext()
        {
        }

        public RetailChainContext(DbContextOptions<RetailChainContext> options)
            : base(options)
        {
        }

        public virtual DbSet<Account> Accounts { get; set; } = null!;
        public virtual DbSet<AttendanceCheckIn> AttendanceCheckIns { get; set; } = null!;
        public virtual DbSet<AttendanceCheckOut> AttendanceCheckOuts { get; set; } = null!;
        public virtual DbSet<AttendanceRecord> AttendanceRecords { get; set; } = null!;
        public virtual DbSet<Batch> Batches { get; set; } = null!;
        public virtual DbSet<BatchDetail> BatchDetails { get; set; } = null!;
        public virtual DbSet<Cash> Cashes { get; set; } = null!;
        public virtual DbSet<CashHandover> CashHandovers { get; set; } = null!;
        public virtual DbSet<DailySalesReport> DailySalesReports { get; set; } = null!;
        public virtual DbSet<Employee> Employees { get; set; } = null!;
        public virtual DbSet<EndShift> EndShifts { get; set; } = null!;
        public virtual DbSet<Order> Orders { get; set; } = null!;
        public virtual DbSet<OrderDetail> OrderDetails { get; set; } = null!;
        public virtual DbSet<OvertimeRecord> OvertimeRecords { get; set; } = null!;
        public virtual DbSet<PenaltyPayment> PenaltyPayments { get; set; } = null!;
        public virtual DbSet<Product> Products { get; set; } = null!;
        public virtual DbSet<ProductPrice> ProductPrices { get; set; } = null!;
        public virtual DbSet<ProductPriceHistory> ProductPriceHistories { get; set; } = null!;
        public virtual DbSet<Promotion> Promotions { get; set; } = null!;
        public virtual DbSet<PurchaseCost> PurchaseCosts { get; set; } = null!;
        public virtual DbSet<PurchaseOrder> PurchaseOrders { get; set; } = null!;
        public virtual DbSet<PurchaseOrderItem> PurchaseOrderItems { get; set; } = null!;
        public virtual DbSet<Refund> Refunds { get; set; } = null!;
        public virtual DbSet<RefundDetail> RefundDetails { get; set; } = null!;
        public virtual DbSet<Salary> Salaries { get; set; } = null!;
        public virtual DbSet<SalaryPaymentHistory> SalaryPaymentHistories { get; set; } = null!;
        public virtual DbSet<SalesReport> SalesReports { get; set; } = null!;
        public virtual DbSet<ShiftSetting> ShiftSettings { get; set; } = null!;
        public virtual DbSet<StockAdjustment> StockAdjustments { get; set; } = null!;
        public virtual DbSet<StockAdjustmentDetail> StockAdjustmentDetails { get; set; } = null!;
        public virtual DbSet<StockAuditDetail> StockAuditDetails { get; set; } = null!;
        public virtual DbSet<StockAuditRecord> StockAuditRecords { get; set; } = null!;
        public virtual DbSet<StockLevel> StockLevels { get; set; } = null!;
        public virtual DbSet<Supplier> Suppliers { get; set; } = null!;
        public virtual DbSet<SupplierProduct> SupplierProducts { get; set; } = null!;
        public virtual DbSet<Transaction> Transactions { get; set; } = null!;
        public virtual DbSet<Warehouse> Warehouses { get; set; } = null!;
        public virtual DbSet<WarehouseTransfer> WarehouseTransfers { get; set; } = null!;
        public virtual DbSet<WarehouseTransferDetail> WarehouseTransferDetails { get; set; } = null!;

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (!optionsBuilder.IsConfigured)
            {
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see http://go.microsoft.com/fwlink/?LinkId=723263.
                optionsBuilder.UseSqlServer("Server=localhost;Database=RetailChain;Trusted_Connection=True;");
            }
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Account>(entity =>
            {
                entity.ToTable("Account");

                entity.HasIndex(e => e.Username, "UQ__Account__536C85E46CF97CE1")
                    .IsUnique();

                entity.Property(e => e.AccountId).HasColumnName("AccountID");

                entity.Property(e => e.IsActive).HasDefaultValueSql("((1))");

                entity.Property(e => e.PasswordHash).HasMaxLength(255);

                entity.Property(e => e.Role).HasMaxLength(20);

                entity.Property(e => e.Username).HasMaxLength(50);

                entity.HasMany(d => d.EmployeesEmployees)
                    .WithMany(p => p.AccountsAccounts)
                    .UsingEntity<Dictionary<string, object>>(
                        "AccountEmployee",
                        l => l.HasOne<Employee>().WithMany().HasForeignKey("EmployeesEmployeeId"),
                        r => r.HasOne<Account>().WithMany().HasForeignKey("AccountsAccountId"),
                        j =>
                        {
                            j.HasKey("AccountsAccountId", "EmployeesEmployeeId");

                            j.ToTable("AccountEmployee");

                            j.HasIndex(new[] { "EmployeesEmployeeId" }, "IX_AccountEmployee_EmployeesEmployeeId");
                        });
            });

            modelBuilder.Entity<AttendanceCheckIn>(entity =>
            {
                entity.ToTable("AttendanceCheckIn");

                entity.HasIndex(e => e.EmployeeId, "IX_AttendanceCheckIn_EmployeeId");

                entity.Property(e => e.AttendanceDate).HasColumnType("date");

                entity.Property(e => e.CheckInTime).HasColumnType("datetime");

                entity.Property(e => e.Shift).HasMaxLength(50);

                entity.HasOne(d => d.Employee)
                    .WithMany(p => p.AttendanceCheckIns)
                    .HasForeignKey(d => d.EmployeeId)
                    .HasConstraintName("FK__Attendanc__Emplo__18EBB532");
            });

            modelBuilder.Entity<AttendanceCheckOut>(entity =>
            {
                entity.ToTable("AttendanceCheckOut");

                entity.HasIndex(e => e.EmployeeId, "IX_AttendanceCheckOut_EmployeeId");

                entity.Property(e => e.AttendanceDate).HasColumnType("date");

                entity.Property(e => e.CheckOutTime).HasColumnType("datetime");

                entity.Property(e => e.Shift).HasMaxLength(50);

                entity.HasOne(d => d.Employee)
                    .WithMany(p => p.AttendanceCheckOuts)
                    .HasForeignKey(d => d.EmployeeId)
                    .HasConstraintName("FK__Attendanc__Emplo__1BC821DD");
            });

            modelBuilder.Entity<AttendanceRecord>(entity =>
            {
                entity.HasKey(e => e.AttendanceRecordsId)
                    .HasName("PK__Attendan__6D2B1F0C4A22C7E5");

                entity.ToTable("AttendanceRecord");

                entity.HasIndex(e => e.EmployeeId, "IX_AttendanceRecord_EmployeeId");

                entity.Property(e => e.CheckIn).HasColumnType("datetime");

                entity.Property(e => e.CheckOut).HasColumnType("datetime");

                entity.HasOne(d => d.Employee)
                    .WithMany(p => p.AttendanceRecords)
                    .HasForeignKey(d => d.EmployeeId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK__Attendanc__Emplo__114A936A");
            });

            modelBuilder.Entity<Batch>(entity =>
            {
                entity.HasKey(e => e.BatchesId)
                    .HasName("PK__batches__D7870D5CBB7EFCFE");

                entity.ToTable("batches");

                entity.HasIndex(e => e.WarehouseId, "IX_batches_warehouse_id");

                entity.Property(e => e.BatchPrices)
                    .HasColumnType("decimal(18, 2)")
                    .HasColumnName("batch_prices");

                entity.Property(e => e.PurchaseOrderId).HasColumnName("purchase_orderId");

                entity.Property(e => e.ReceivedDate)
                    .HasColumnType("datetime")
                    .HasColumnName("received_date")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.Status)
                    .HasMaxLength(50)
                    .HasColumnName("status");

                entity.Property(e => e.WarehouseId).HasColumnName("warehouse_id");

                entity.HasOne(d => d.PurchaseOrder)
                    .WithMany(p => p.Batches)
                    .HasForeignKey(d => d.PurchaseOrderId)
                    .HasConstraintName("FK_batches_purchase_order");

                entity.HasOne(d => d.Warehouse)
                    .WithMany(p => p.Batches)
                    .HasForeignKey(d => d.WarehouseId)
                    .HasConstraintName("FK__batches__warehou__151B244E");
            });

            modelBuilder.Entity<BatchDetail>(entity =>
            {
                entity.HasKey(e => e.BatchDetailsId)
                    .HasName("PK__batch_de__04D3CE3069F8D36A");

                entity.ToTable("batch_details");

                entity.HasIndex(e => e.BatchId, "IX_batch_details_batch_id");

                entity.HasIndex(e => e.ProductId, "IX_batch_details_product_id");

                entity.HasIndex(e => e.PurchaseOrderId, "IX_batch_details_purchase_order_id");

                entity.Property(e => e.BatchDetailsId).HasColumnName("Batch_detailsId");

                entity.Property(e => e.BatchId).HasColumnName("batch_id");

                entity.Property(e => e.ProductId).HasColumnName("product_id");

                entity.Property(e => e.PurchaseOrderId).HasColumnName("purchase_order_id");

                entity.Property(e => e.Quantity).HasColumnName("quantity");

                entity.HasOne(d => d.Batch)
                    .WithMany(p => p.BatchDetails)
                    .HasForeignKey(d => d.BatchId)
                    .HasConstraintName("FK__batch_det__batch__123EB7A3");

                entity.HasOne(d => d.Product)
                    .WithMany(p => p.BatchDetails)
                    .HasForeignKey(d => d.ProductId)
                    .HasConstraintName("FK__batch_det__produ__1332DBDC");

                entity.HasOne(d => d.PurchaseOrder)
                    .WithMany(p => p.BatchDetails)
                    .HasForeignKey(d => d.PurchaseOrderId)
                    .OnDelete(DeleteBehavior.SetNull)
                    .HasConstraintName("FK__batch_det__purch__14270015");
            });

            modelBuilder.Entity<Cash>(entity =>
            {
                entity.ToTable("CASH");

                entity.HasIndex(e => e.BranchId, "IX_CASH_BranchId");

                entity.HasIndex(e => e.EmployeeId, "IX_CASH_EmployeeId");

                entity.Property(e => e.Date).HasColumnType("date");

                entity.Property(e => e.Note)
                    .HasMaxLength(255)
                    .HasColumnName("note");

                entity.Property(e => e.PaymentMethod).HasColumnName("payment_method");

                entity.HasOne(d => d.Branch)
                    .WithMany(p => p.Cashes)
                    .HasForeignKey(d => d.BranchId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK__CASH__BranchId__7A672E12");

                entity.HasOne(d => d.Employee)
                    .WithMany(p => p.Cashes)
                    .HasForeignKey(d => d.EmployeeId)
                    .HasConstraintName("FK__CASH__EmployeeId__73BA3083");
            });

            modelBuilder.Entity<CashHandover>(entity =>
            {
                entity.HasKey(e => e.HandoverId)
                    .HasName("PK__Cash_Han__DB2A1F61CE3A7914");

                entity.ToTable("Cash_Handover");

                entity.HasIndex(e => e.BranchId, "IX_Cash_Handover_BranchID");

                entity.HasIndex(e => e.EmployeeId, "IX_Cash_Handover_EmployeeID");

                entity.HasIndex(e => e.ReceiverId, "IX_Cash_Handover_ReceiverID");

                entity.Property(e => e.HandoverId).HasColumnName("HandoverID");

                entity.Property(e => e.Amount).HasColumnType("decimal(18, 2)");

                entity.Property(e => e.BranchId).HasColumnName("BranchID");

                entity.Property(e => e.CreatedAt)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.CreatedBy).HasMaxLength(255);

                entity.Property(e => e.Description).HasMaxLength(255);

                entity.Property(e => e.EmployeeId).HasColumnName("EmployeeID");

                entity.Property(e => e.Note).HasMaxLength(500);

                entity.Property(e => e.PersonName)
                    .HasMaxLength(255)
                    .HasDefaultValueSql("('Không xác d?nh')");

                entity.Property(e => e.ReceiverId).HasColumnName("ReceiverID");

                entity.Property(e => e.TransactionDate)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.TransactionType)
                    .HasMaxLength(50)
                    .HasDefaultValueSql("('Thu')");

                entity.HasOne(d => d.Branch)
                    .WithMany(p => p.CashHandovers)
                    .HasForeignKey(d => d.BranchId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK__Cash_Hand__Branc__160F4887");

                entity.HasOne(d => d.Employee)
                    .WithMany(p => p.CashHandoverEmployees)
                    .HasForeignKey(d => d.EmployeeId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK__Cash_Hand__Emplo__17036CC0");

                entity.HasOne(d => d.Receiver)
                    .WithMany(p => p.CashHandoverReceivers)
                    .HasForeignKey(d => d.ReceiverId)
                    .HasConstraintName("FK__Cash_Hand__Recei__17F790F9");
            });

            modelBuilder.Entity<DailySalesReport>(entity =>
            {
                entity.HasKey(e => e.ReportId)
                    .HasName("PK__daily_sa__D5BD48E518F85104");

                entity.ToTable("daily_sales_reports");

                entity.HasIndex(e => e.WarehouseId, "IX_daily_sales_reports_warehouse_id");

                entity.Property(e => e.ReportId).HasColumnName("ReportID");

                entity.Property(e => e.CreatedAt)
                    .HasColumnType("datetime")
                    .HasColumnName("created_at")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.ReportDate)
                    .HasColumnType("date")
                    .HasColumnName("report_date");

                entity.Property(e => e.TotalOrders).HasColumnName("total_orders");

                entity.Property(e => e.TotalSales)
                    .HasColumnType("decimal(18, 2)")
                    .HasColumnName("total_sales");

                entity.Property(e => e.WarehouseId).HasColumnName("warehouse_id");

                entity.HasOne(d => d.Warehouse)
                    .WithMany(p => p.DailySalesReports)
                    .HasForeignKey(d => d.WarehouseId)
                    .HasConstraintName("FK__daily_sal__wareh__18EBB532");
            });

            modelBuilder.Entity<Employee>(entity =>
            {
                entity.ToTable("Employee");

                entity.HasIndex(e => e.AccountId, "IX_Employee_AccountID")
                    .IsUnique()
                    .HasFilter("([AccountID] IS NOT NULL)");

                entity.HasIndex(e => e.BranchId, "IX_Employee_BranchID");

                entity.HasIndex(e => e.IdentityNumber, "UQ__Employee__6354A73FB4499D6D")
                    .IsUnique();

                entity.Property(e => e.EmployeeId).HasColumnName("EmployeeID");

                entity.Property(e => e.AccountId).HasColumnName("AccountID");

                entity.Property(e => e.BirthDate).HasColumnType("date");

                entity.Property(e => e.BranchId).HasColumnName("BranchID");

                entity.Property(e => e.CreatedAt)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.FixedSalary).HasDefaultValueSql("((0))");

                entity.Property(e => e.FullName).HasMaxLength(100);

                entity.Property(e => e.Gender).HasMaxLength(10);

                entity.Property(e => e.Hometown).HasMaxLength(100);

                entity.Property(e => e.IdentityNumber).HasMaxLength(20);

                entity.Property(e => e.IsActive).HasDefaultValueSql("((1))");

                entity.Property(e => e.IsCheckedIn).HasDefaultValueSql("((0))");

                entity.Property(e => e.OvertimeRate).HasColumnType("decimal(10, 2)");

                entity.Property(e => e.Phone).HasMaxLength(20);

                entity.Property(e => e.ProfileImage).HasMaxLength(255);

                entity.Property(e => e.StartDate).HasColumnType("date");

                entity.Property(e => e.UpdatedAt)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("(getdate())");

                entity.HasOne(d => d.Account)
                    .WithOne(p => p.Employee)
                    .HasForeignKey<Employee>(d => d.AccountId)
                    .HasConstraintName("FK_Employee_Account");

                entity.HasOne(d => d.Branch)
                    .WithMany(p => p.Employees)
                    .HasForeignKey(d => d.BranchId)
                    .HasConstraintName("FK__Employee__Branch__1AD3FDA4");
            });

            modelBuilder.Entity<EndShift>(entity =>
            {
                entity.HasKey(e => e.ShiftId)
                    .HasName("PK__End_Shif__C0A838E1F05C106C");

                entity.ToTable("End_Shifts");

                entity.HasIndex(e => e.BranchId, "IX_End_Shifts_BranchID");

                entity.HasIndex(e => e.EmployeeId, "IX_End_Shifts_EmployeeID");

                entity.Property(e => e.ShiftId).HasColumnName("ShiftID");

                entity.Property(e => e.BankCollected).HasColumnType("decimal(18, 2)");

                entity.Property(e => e.BranchId).HasColumnName("BranchID");

                entity.Property(e => e.CashAtEnd).HasColumnType("decimal(18, 2)");

                entity.Property(e => e.CashAtStart).HasColumnType("decimal(18, 2)");

                entity.Property(e => e.CashCollected).HasColumnType("decimal(18, 2)");

                entity.Property(e => e.EmployeeId).HasColumnName("EmployeeID");

                entity.Property(e => e.EndTime).HasColumnType("datetime");

                entity.Property(e => e.StartTime).HasColumnType("datetime");

                entity.Property(e => e.TotalSales).HasColumnType("decimal(18, 2)");

                entity.HasOne(d => d.Branch)
                    .WithMany(p => p.EndShifts)
                    .HasForeignKey(d => d.BranchId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK__End_Shift__Branc__1BC821DD");

                entity.HasOne(d => d.Employee)
                    .WithMany(p => p.EndShifts)
                    .HasForeignKey(d => d.EmployeeId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK__End_Shift__Emplo__1CBC4616");
            });

            modelBuilder.Entity<Order>(entity =>
            {
                entity.ToTable("Order");

                entity.HasIndex(e => e.Employeeid, "IX_Order_employeeid");

                entity.HasIndex(e => e.ShopId, "IX_Order_shop_id");

                entity.Property(e => e.CreatedDate)
                    .HasColumnType("datetime")
                    .HasColumnName("created_date")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.Employeeid).HasColumnName("employeeid");

                entity.Property(e => e.PaymentStatus)
                    .HasMaxLength(20)
                    .HasColumnName("payment_status")
                    .HasDefaultValueSql("('Pending')");

                entity.Property(e => e.ShopId).HasColumnName("shop_id");

                entity.Property(e => e.TotalAmount)
                    .HasColumnType("decimal(18, 2)")
                    .HasColumnName("total_amount");

                entity.HasOne(d => d.Employee)
                    .WithMany(p => p.Orders)
                    .HasForeignKey(d => d.Employeeid)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK__Order__employeei__1DB06A4F");

                entity.HasOne(d => d.Shop)
                    .WithMany(p => p.Orders)
                    .HasForeignKey(d => d.ShopId)
                    .HasConstraintName("FK__Order__shop_id__1EA48E88");
            });

            modelBuilder.Entity<OrderDetail>(entity =>
            {
                entity.ToTable("OrderDetail");

                entity.HasIndex(e => e.OrderId, "IX_OrderDetail_order_id");

                entity.HasIndex(e => e.ProductId, "IX_OrderDetail_product_id");

                entity.Property(e => e.OrderId).HasColumnName("order_id");

                entity.Property(e => e.ProductId).HasColumnName("product_id");

                entity.Property(e => e.Quantity)
                    .HasColumnType("decimal(10, 2)")
                    .HasColumnName("quantity");

                entity.Property(e => e.TotalPrice)
                    .HasColumnType("decimal(18, 2)")
                    .HasColumnName("total_price");

                entity.Property(e => e.UnitPrice)
                    .HasColumnType("decimal(18, 2)")
                    .HasColumnName("unit_price");

                entity.HasOne(d => d.Order)
                    .WithMany(p => p.OrderDetails)
                    .HasForeignKey(d => d.OrderId)
                    .HasConstraintName("FK__OrderDeta__order__1F98B2C1");

                entity.HasOne(d => d.Product)
                    .WithMany(p => p.OrderDetails)
                    .HasForeignKey(d => d.ProductId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK__OrderDeta__produ__208CD6FA");
            });

            modelBuilder.Entity<OvertimeRecord>(entity =>
            {
                entity.HasIndex(e => e.EmployeeId, "IX_OvertimeRecords_EmployeeId");

                entity.Property(e => e.Date).HasColumnType("date");

                entity.Property(e => e.Reason).HasMaxLength(255);

                entity.Property(e => e.TotalHours).HasColumnType("decimal(5, 2)");

                entity.HasOne(d => d.Employee)
                    .WithMany(p => p.OvertimeRecords)
                    .HasForeignKey(d => d.EmployeeId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK__OvertimeR__Emplo__160F4887");
            });

            modelBuilder.Entity<PenaltyPayment>(entity =>
            {
                entity.HasIndex(e => e.EmployeeId, "IX_PenaltyPayments_EmployeeId");

                entity.Property(e => e.IsDeleted).HasDefaultValueSql("((0))");

                entity.Property(e => e.Note).HasMaxLength(255);

                entity.Property(e => e.PaymentDate).HasColumnType("date");

                entity.Property(e => e.Reason).HasMaxLength(255);

                entity.HasOne(d => d.Employee)
                    .WithMany(p => p.PenaltyPayments)
                    .HasForeignKey(d => d.EmployeeId)
                    .HasConstraintName("FK__PenaltyPa__Emplo__0E6E26BF");
            });

            modelBuilder.Entity<Product>(entity =>
            {
                entity.HasKey(e => e.ProductsId)
                    .HasName("PK__products__BB48EDE5F3F1EB85");

                entity.ToTable("products");

                entity.HasIndex(e => e.Barcode, "UQ__products__C16E36F8C3CC1692")
                    .IsUnique();

                entity.Property(e => e.Barcode)
                    .HasMaxLength(50)
                    .HasColumnName("barcode");

                entity.Property(e => e.Category)
                    .HasMaxLength(50)
                    .HasColumnName("category");

                entity.Property(e => e.ImageUrl)
                    .HasMaxLength(500)
                    .HasColumnName("image_url");

                entity.Property(e => e.IsEnabled)
                    .HasColumnName("is_enabled")
                    .HasDefaultValueSql("((1))");

                entity.Property(e => e.Name)
                    .HasMaxLength(255)
                    .HasColumnName("name");

                entity.Property(e => e.Unit)
                    .HasMaxLength(50)
                    .HasColumnName("unit");

                entity.Property(e => e.Volume)
                    .HasColumnType("decimal(10, 2)")
                    .HasColumnName("volume");

                entity.Property(e => e.Weight)
                    .HasColumnType("decimal(10, 2)")
                    .HasColumnName("weight");
            });

            modelBuilder.Entity<ProductPrice>(entity =>
            {
                entity.ToTable("product_prices");

                entity.HasIndex(e => e.ProductId, "IX_product_prices_product_id");

                entity.Property(e => e.Id).HasColumnName("id");

                entity.Property(e => e.EffectiveDate)
                    .HasColumnType("datetime")
                    .HasColumnName("effective_date")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.Price)
                    .HasColumnType("decimal(18, 2)")
                    .HasColumnName("price");

                entity.Property(e => e.ProductId).HasColumnName("product_id");

                entity.HasOne(d => d.Product)
                    .WithMany(p => p.ProductPrices)
                    .HasForeignKey(d => d.ProductId)
                    .HasConstraintName("FK__product_p__produ__02FC7413");
            });

            modelBuilder.Entity<ProductPriceHistory>(entity =>
            {
                entity.HasKey(e => e.PriceHistoryId)
                    .HasName("PK__product___A927CB2B68C0B1C4");

                entity.ToTable("product_price_history");

                entity.HasIndex(e => e.ChangedBy, "IX_product_price_history_changed_by");

                entity.HasIndex(e => e.ProductId, "IX_product_price_history_product_id");

                entity.HasIndex(e => e.WarehouseId, "IX_product_price_history_warehouse_id");

                entity.Property(e => e.PriceHistoryId).HasColumnName("PriceHistoryID");

                entity.Property(e => e.ChangeDate)
                    .HasColumnType("datetime")
                    .HasColumnName("change_date")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.ChangedBy).HasColumnName("changed_by");

                entity.Property(e => e.NewPrice)
                    .HasColumnType("decimal(18, 2)")
                    .HasColumnName("new_price");

                entity.Property(e => e.OldPrice)
                    .HasColumnType("decimal(18, 2)")
                    .HasColumnName("old_price");

                entity.Property(e => e.PriceType)
                    .HasMaxLength(20)
                    .HasColumnName("price_type");

                entity.Property(e => e.ProductId).HasColumnName("product_id");

                entity.Property(e => e.WarehouseId).HasColumnName("warehouse_id");

                entity.HasOne(d => d.ChangedByNavigation)
                    .WithMany(p => p.ProductPriceHistories)
                    .HasForeignKey(d => d.ChangedBy)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK__product_p__chang__2180FB33");

                entity.HasOne(d => d.Product)
                    .WithMany(p => p.ProductPriceHistories)
                    .HasForeignKey(d => d.ProductId)
                    .HasConstraintName("FK__product_p__produ__22751F6C");

                entity.HasOne(d => d.Warehouse)
                    .WithMany(p => p.ProductPriceHistories)
                    .HasForeignKey(d => d.WarehouseId)
                    .HasConstraintName("FK__product_p__wareh__236943A5");
            });

            modelBuilder.Entity<Promotion>(entity =>
            {
                entity.HasKey(e => e.PromotionsId)
                    .HasName("PK__promotio__DBE22B922F2EDACB");

                entity.ToTable("promotions");

                entity.HasIndex(e => e.ProductId, "IX_promotions_product_id");

                entity.HasIndex(e => e.WarehouseId, "IX_promotions_warehouse_id");

                entity.Property(e => e.Description)
                    .HasMaxLength(500)
                    .HasColumnName("description");

                entity.Property(e => e.DiscountPercent)
                    .HasColumnType("decimal(5, 2)")
                    .HasColumnName("discount_percent");

                entity.Property(e => e.EndDate)
                    .HasColumnType("date")
                    .HasColumnName("end_date");

                entity.Property(e => e.Name)
                    .HasMaxLength(255)
                    .HasColumnName("name");

                entity.Property(e => e.ProductId).HasColumnName("product_id");

                entity.Property(e => e.StartDate)
                    .HasColumnType("date")
                    .HasColumnName("start_date");

                entity.Property(e => e.WarehouseId).HasColumnName("warehouse_id");

                entity.HasOne(d => d.Product)
                    .WithMany(p => p.Promotions)
                    .HasForeignKey(d => d.ProductId)
                    .HasConstraintName("FK__promotion__produ__245D67DE");

                entity.HasOne(d => d.Warehouse)
                    .WithMany(p => p.Promotions)
                    .HasForeignKey(d => d.WarehouseId)
                    .HasConstraintName("FK__promotion__wareh__25518C17");
            });

            modelBuilder.Entity<PurchaseCost>(entity =>
            {
                entity.HasKey(e => e.CostId)
                    .HasName("PK__Purchase__8285231E4A994A7F");

                entity.ToTable("Purchase_Costs");

                entity.HasIndex(e => e.BranchId, "IX_Purchase_Costs_BranchID");

                entity.HasIndex(e => e.PurchaseOrderId, "IX_Purchase_Costs_PurchaseOrderID");

                entity.Property(e => e.CostId).HasColumnName("CostID");

                entity.Property(e => e.BranchId).HasColumnName("BranchID");

                entity.Property(e => e.PurchaseOrderId).HasColumnName("PurchaseOrderID");

                entity.Property(e => e.RecordedDate)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.TotalCost).HasColumnType("decimal(18, 2)");

                entity.HasOne(d => d.Branch)
                    .WithMany(p => p.PurchaseCosts)
                    .HasForeignKey(d => d.BranchId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK__Purchase___Branc__2645B050");

                entity.HasOne(d => d.PurchaseOrder)
                    .WithMany(p => p.PurchaseCosts)
                    .HasForeignKey(d => d.PurchaseOrderId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK__Purchase___Purch__2739D489");
            });

            modelBuilder.Entity<PurchaseOrder>(entity =>
            {
                entity.HasKey(e => e.PurchaseOrdersId)
                    .HasName("PK__purchase__9736EF3EF43D85EF");

                entity.ToTable("purchase_orders");

                entity.HasIndex(e => e.WarehousesId, "IX_purchase_orders_WarehousesId");

                entity.HasIndex(e => e.SupplierId, "IX_purchase_orders_supplier_id");

                entity.Property(e => e.PurchaseOrdersId).HasColumnName("Purchase_ordersId");

                entity.Property(e => e.Notes)
                    .HasMaxLength(500)
                    .HasColumnName("notes");

                entity.Property(e => e.OrderDate)
                    .HasColumnType("datetime")
                    .HasColumnName("order_date")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.Status)
                    .HasMaxLength(50)
                    .HasColumnName("status");

                entity.Property(e => e.SupplierId).HasColumnName("supplier_id");

                entity.HasOne(d => d.Supplier)
                    .WithMany(p => p.PurchaseOrders)
                    .HasForeignKey(d => d.SupplierId)
                    .OnDelete(DeleteBehavior.SetNull)
                    .HasConstraintName("FK__purchase___suppl__2A164134");

                entity.HasOne(d => d.Warehouses)
                    .WithMany(p => p.PurchaseOrders)
                    .HasForeignKey(d => d.WarehousesId);
            });

            modelBuilder.Entity<PurchaseOrderItem>(entity =>
            {
                entity.HasKey(e => e.PurchaseOrderItemsId)
                    .HasName("PK__purchase__4120509F6B7B071E");

                entity.ToTable("purchase_order_items");

                entity.HasIndex(e => e.ProductId, "IX_purchase_order_items_product_id");

                entity.HasIndex(e => e.PurchaseOrderId, "IX_purchase_order_items_purchase_order_id");

                entity.Property(e => e.PurchaseOrderItemsId).HasColumnName("Purchase_order_itemsId");

                entity.Property(e => e.ProductId).HasColumnName("product_id");

                entity.Property(e => e.PurchaseOrderId).HasColumnName("purchase_order_id");

                entity.Property(e => e.QuantityOrdered).HasColumnName("quantity_ordered");

                entity.Property(e => e.QuantityReceived)
                    .HasColumnName("quantity_received")
                    .HasDefaultValueSql("((0))");

                entity.HasOne(d => d.Product)
                    .WithMany(p => p.PurchaseOrderItems)
                    .HasForeignKey(d => d.ProductId)
                    .HasConstraintName("FK__purchase___produ__282DF8C2");

                entity.HasOne(d => d.PurchaseOrder)
                    .WithMany(p => p.PurchaseOrderItems)
                    .HasForeignKey(d => d.PurchaseOrderId)
                    .HasConstraintName("FK__purchase___purch__29221CFB");
            });

            modelBuilder.Entity<Refund>(entity =>
            {
                entity.ToTable("Refund");

                entity.HasIndex(e => e.Employeeid, "IX_Refund_employeeid");

                entity.HasIndex(e => e.OrderId, "IX_Refund_order_id");

                entity.Property(e => e.Id).HasColumnName("id");

                entity.Property(e => e.Employeeid).HasColumnName("employeeid");

                entity.Property(e => e.OrderId).HasColumnName("order_id");

                entity.Property(e => e.RefundAmount)
                    .HasColumnType("decimal(18, 2)")
                    .HasColumnName("refund_amount");

                entity.Property(e => e.RefundDate)
                    .HasColumnType("date")
                    .HasColumnName("refund_date")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.RefundStatus)
                    .HasMaxLength(20)
                    .HasColumnName("refund_status")
                    .HasDefaultValueSql("('Pending')");

                entity.HasOne(d => d.Employee)
                    .WithMany(p => p.Refunds)
                    .HasForeignKey(d => d.Employeeid)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK__Refund__employee__2B0A656D");

                entity.HasOne(d => d.Order)
                    .WithMany(p => p.Refunds)
                    .HasForeignKey(d => d.OrderId)
                    .HasConstraintName("FK__Refund__order_id__2BFE89A6");
            });

            modelBuilder.Entity<RefundDetail>(entity =>
            {
                entity.ToTable("RefundDetail");

                entity.HasIndex(e => e.RefundId, "IX_RefundDetail_refund_id");

                entity.Property(e => e.Id).HasColumnName("id");

                entity.Property(e => e.ProductId).HasColumnName("product_id");

                entity.Property(e => e.Quantity)
                    .HasColumnType("decimal(10, 2)")
                    .HasColumnName("quantity");

                entity.Property(e => e.RefundId).HasColumnName("refund_id");

                entity.Property(e => e.TotalPrice)
                    .HasColumnType("decimal(18, 2)")
                    .HasColumnName("total_price");

                entity.Property(e => e.UnitPrice)
                    .HasColumnType("decimal(18, 2)")
                    .HasColumnName("unit_price");

                entity.HasOne(d => d.Refund)
                    .WithMany(p => p.RefundDetails)
                    .HasForeignKey(d => d.RefundId)
                    .HasConstraintName("FK__RefundDet__refun__2CF2ADDF");
            });

            modelBuilder.Entity<Salary>(entity =>
            {
                entity.ToTable("Salary");

                entity.HasIndex(e => e.EmployeeId, "IX_Salary_EmployeeId");

                entity.Property(e => e.EndDate).HasColumnType("date");

                entity.Property(e => e.StartDate).HasColumnType("date");

                entity.Property(e => e.UpdateAt).HasColumnType("datetime");

                entity.HasOne(d => d.Employee)
                    .WithMany(p => p.Salaries)
                    .HasForeignKey(d => d.EmployeeId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK__Salary__Employee__2DE6D218");
            });

            modelBuilder.Entity<SalaryPaymentHistory>(entity =>
            {
                entity.ToTable("SalaryPaymentHistory");

                entity.HasIndex(e => e.EmployeeId, "IX_SalaryPaymentHistory_EmployeeId");

                entity.HasIndex(e => e.SalaryId, "IX_SalaryPaymentHistory_SalaryId");

                entity.Property(e => e.IsDeleted).HasDefaultValueSql("((0))");

                entity.Property(e => e.Note).HasMaxLength(255);

                entity.Property(e => e.PaymentDate).HasColumnType("date");

                entity.HasOne(d => d.Employee)
                    .WithMany(p => p.SalaryPaymentHistories)
                    .HasForeignKey(d => d.EmployeeId)
                    .HasConstraintName("FK__SalaryPay__Emplo__787EE5A0");

                entity.HasOne(d => d.Salary)
                    .WithMany(p => p.SalaryPaymentHistories)
                    .HasForeignKey(d => d.SalaryId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK__SalaryPay__Salar__0B91BA14");
            });

            modelBuilder.Entity<SalesReport>(entity =>
            {
                entity.ToTable("sales_reports");

                entity.Property(e => e.Id).HasColumnName("id");

                entity.Property(e => e.ReportMonth)
                    .HasColumnType("date")
                    .HasColumnName("report_month");

                entity.Property(e => e.TotalCost)
                    .HasColumnType("decimal(18, 2)")
                    .HasColumnName("total_cost");

                entity.Property(e => e.TotalOrders).HasColumnName("total_orders");

                entity.Property(e => e.TotalProfit)
                    .HasColumnType("decimal(18, 2)")
                    .HasColumnName("total_profit");

                entity.Property(e => e.TotalSalary)
                    .HasColumnType("decimal(18, 2)")
                    .HasColumnName("total_salary");

                entity.Property(e => e.TotalSales)
                    .HasColumnType("decimal(18, 2)")
                    .HasColumnName("total_sales");
            });

            modelBuilder.Entity<StockAdjustment>(entity =>
            {
                entity.HasKey(e => e.StockAdjustmentsId)
                    .HasName("PK__stock_ad__02056934008DB342");

                entity.ToTable("stock_adjustments");

                entity.HasIndex(e => e.AuditorId, "IX_stock_adjustments_auditor_id");

                entity.HasIndex(e => e.WarehouseId, "IX_stock_adjustments_warehouse_id");

                entity.Property(e => e.AdjustmentDate)
                    .HasColumnType("datetime")
                    .HasColumnName("adjustment_date")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.AuditorId).HasColumnName("auditor_id");

                entity.Property(e => e.Notes)
                    .HasMaxLength(500)
                    .HasColumnName("notes");

                entity.Property(e => e.WarehouseId).HasColumnName("warehouse_id");

                entity.HasOne(d => d.Auditor)
                    .WithMany(p => p.StockAdjustments)
                    .HasForeignKey(d => d.AuditorId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK__stock_adj__audit__30C33EC3");

                entity.HasOne(d => d.Warehouse)
                    .WithMany(p => p.StockAdjustments)
                    .HasForeignKey(d => d.WarehouseId)
                    .HasConstraintName("FK__stock_adj__wareh__31B762FC");
            });

            modelBuilder.Entity<StockAdjustmentDetail>(entity =>
            {
                entity.HasKey(e => e.StockAdjustmentDetailsId)
                    .HasName("PK__stock_ad__5443DBDDEC7A5983");

                entity.ToTable("stock_adjustment_details");

                entity.HasIndex(e => e.AdjustmentId, "IX_stock_adjustment_details_adjustment_id");

                entity.HasIndex(e => e.ProductId, "IX_stock_adjustment_details_product_id");

                entity.Property(e => e.AdjustedQuantity).HasColumnName("adjusted_quantity");

                entity.Property(e => e.AdjustmentId).HasColumnName("adjustment_id");

                entity.Property(e => e.PreviousQuantity).HasColumnName("previous_quantity");

                entity.Property(e => e.ProductId).HasColumnName("product_id");

                entity.Property(e => e.Reason)
                    .HasMaxLength(255)
                    .HasColumnName("reason");

                entity.HasOne(d => d.Adjustment)
                    .WithMany(p => p.StockAdjustmentDetails)
                    .HasForeignKey(d => d.AdjustmentId)
                    .HasConstraintName("FK__stock_adj__adjus__2EDAF651");

                entity.HasOne(d => d.Product)
                    .WithMany(p => p.StockAdjustmentDetails)
                    .HasForeignKey(d => d.ProductId)
                    .HasConstraintName("FK__stock_adj__produ__2FCF1A8A");
            });

            modelBuilder.Entity<StockAuditDetail>(entity =>
            {
                entity.HasKey(e => e.StockAuditDetailsId)
                    .HasName("PK__stock_au__814DB73894F66C3F");

                entity.ToTable("stock_audit_details");

                entity.HasIndex(e => e.AuditId, "IX_stock_audit_details_audit_id");

                entity.HasIndex(e => e.ProductId, "IX_stock_audit_details_product_id");

                entity.Property(e => e.AuditId).HasColumnName("audit_id");

                entity.Property(e => e.ProductId).HasColumnName("product_id");

                entity.Property(e => e.Reason)
                    .HasMaxLength(255)
                    .HasColumnName("reason");

                entity.Property(e => e.RecordedQuantity).HasColumnName("recorded_quantity");

                entity.Property(e => e.StockQuantity).HasColumnName("stock_quantity");

                entity.HasOne(d => d.Audit)
                    .WithMany(p => p.StockAuditDetails)
                    .HasForeignKey(d => d.AuditId)
                    .HasConstraintName("FK__stock_aud__audit__32AB8735");

                entity.HasOne(d => d.Product)
                    .WithMany(p => p.StockAuditDetails)
                    .HasForeignKey(d => d.ProductId)
                    .HasConstraintName("FK__stock_aud__produ__339FAB6E");
            });

            modelBuilder.Entity<StockAuditRecord>(entity =>
            {
                entity.HasKey(e => e.StockAuditRecordsId)
                    .HasName("PK__stock_au__1C0D2BE394761EEE");

                entity.ToTable("stock_audit_records");

                entity.HasIndex(e => e.AuditorId, "IX_stock_audit_records_auditor_id");

                entity.HasIndex(e => e.CoAuditorId, "IX_stock_audit_records_co_auditor_id");

                entity.HasIndex(e => e.WarehouseId, "IX_stock_audit_records_warehouse_id");

                entity.Property(e => e.AuditDate)
                    .HasColumnType("datetime")
                    .HasColumnName("audit_date")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.AuditorId).HasColumnName("auditor_id");

                entity.Property(e => e.CoAuditorId).HasColumnName("co_auditor_id");

                entity.Property(e => e.WarehouseId).HasColumnName("warehouse_id");

                entity.HasOne(d => d.Auditor)
                    .WithMany(p => p.StockAuditRecordAuditors)
                    .HasForeignKey(d => d.AuditorId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK__stock_aud__audit__3493CFA7");

                entity.HasOne(d => d.CoAuditor)
                    .WithMany(p => p.StockAuditRecordCoAuditors)
                    .HasForeignKey(d => d.CoAuditorId)
                    .OnDelete(DeleteBehavior.SetNull)
                    .HasConstraintName("FK__stock_aud__co_au__3587F3E0");

                entity.HasOne(d => d.Warehouse)
                    .WithMany(p => p.StockAuditRecords)
                    .HasForeignKey(d => d.WarehouseId)
                    .HasConstraintName("FK__stock_aud__wareh__367C1819");
            });

            modelBuilder.Entity<StockLevel>(entity =>
            {
                entity.HasKey(e => e.StockLevelsId)
                    .HasName("PK__stock_le__76AB5D15AAAE7868");

                entity.ToTable("stock_levels");

                entity.HasIndex(e => e.ProductId, "IX_stock_levels_product_id");

                entity.HasIndex(e => e.WarehouseId, "IX_stock_levels_warehouse_id");

                entity.Property(e => e.StockLevelsId).HasColumnName("Stock_levelsId");

                entity.Property(e => e.MinQuantity)
                    .HasColumnName("min_quantity")
                    .HasDefaultValueSql("((20))");

                entity.Property(e => e.ProductId).HasColumnName("product_id");

                entity.Property(e => e.PurchasePrice)
                    .HasColumnType("decimal(18, 2)")
                    .HasColumnName("purchase_price");

                entity.Property(e => e.Quantity).HasColumnName("quantity");

                entity.Property(e => e.RetailPrice)
                    .HasColumnType("decimal(18, 2)")
                    .HasColumnName("retail_price");

                entity.Property(e => e.Status)
                    .HasColumnName("status")
                    .HasDefaultValueSql("((1))");

                entity.Property(e => e.WarehouseId).HasColumnName("warehouse_id");

                entity.Property(e => e.WholesalePrice)
                    .HasColumnType("decimal(18, 2)")
                    .HasColumnName("wholesale_price");

                entity.HasOne(d => d.Product)
                    .WithMany(p => p.StockLevels)
                    .HasForeignKey(d => d.ProductId)
                    .HasConstraintName("FK__stock_lev__produ__37703C52");

                entity.HasOne(d => d.Warehouse)
                    .WithMany(p => p.StockLevels)
                    .HasForeignKey(d => d.WarehouseId)
                    .HasConstraintName("FK__stock_lev__wareh__3864608B");
            });

            modelBuilder.Entity<Supplier>(entity =>
            {
                entity.HasKey(e => e.SuppliersId)
                    .HasName("PK__supplier__8AB703A4D1582F49");

                entity.ToTable("suppliers");

                entity.Property(e => e.Address)
                    .HasMaxLength(255)
                    .HasColumnName("address");

                entity.Property(e => e.ContactPerson)
                    .HasMaxLength(255)
                    .HasColumnName("contact_person");

                entity.Property(e => e.Email)
                    .HasMaxLength(255)
                    .HasColumnName("email");

                entity.Property(e => e.Fax).HasMaxLength(50);

                entity.Property(e => e.Name)
                    .HasMaxLength(255)
                    .HasColumnName("name");

                entity.Property(e => e.Phone)
                    .HasMaxLength(50)
                    .HasColumnName("phone");

                entity.Property(e => e.RPhone)
                    .HasMaxLength(20)
                    .HasColumnName("r_phone");

                entity.Property(e => e.TaxCode)
                    .HasMaxLength(20)
                    .HasColumnName("Tax_Code");

                entity.Property(e => e.Website)
                    .HasMaxLength(255)
                    .HasColumnName("website");
            });

            modelBuilder.Entity<SupplierProduct>(entity =>
            {
                entity.HasKey(e => e.SupplierProductsId)
                    .HasName("PK__supplier__6892C21ED19AEF7F");

                entity.ToTable("supplier_products");

                entity.HasIndex(e => e.ProductId, "IX_supplier_products_product_id");

                entity.HasIndex(e => e.SupplierId, "IX_supplier_products_supplier_id");

                entity.Property(e => e.ProductId).HasColumnName("product_id");

                entity.Property(e => e.SupplierId).HasColumnName("supplier_id");

                entity.HasOne(d => d.Product)
                    .WithMany(p => p.SupplierProducts)
                    .HasForeignKey(d => d.ProductId)
                    .HasConstraintName("FK__supplier___produ__395884C4");

                entity.HasOne(d => d.Supplier)
                    .WithMany(p => p.SupplierProducts)
                    .HasForeignKey(d => d.SupplierId)
                    .HasConstraintName("FK__supplier___suppl__3A4CA8FD");
            });

            modelBuilder.Entity<Transaction>(entity =>
            {
                entity.HasIndex(e => e.BranchId, "IX_Transactions_branch_id");

                entity.HasIndex(e => e.EmployeeId, "IX_Transactions_employee_id");

                entity.HasIndex(e => e.HandoverId, "IX_Transactions_handover_id");

                entity.HasIndex(e => e.OrderId, "IX_Transactions_order_id");

                entity.HasIndex(e => e.RefundId, "IX_Transactions_refund_id");

                entity.HasIndex(e => e.TransactionCode, "UQ__Transact__DD5740BEF432A0F9")
                    .IsUnique();

                entity.Property(e => e.TransactionId).HasColumnName("transaction_id");

                entity.Property(e => e.Amount)
                    .HasColumnType("decimal(18, 2)")
                    .HasColumnName("amount");

                entity.Property(e => e.BankAccount)
                    .HasMaxLength(50)
                    .IsUnicode(false)
                    .HasColumnName("bank_account");

                entity.Property(e => e.BranchId).HasColumnName("branch_id");

                entity.Property(e => e.Description)
                    .HasMaxLength(255)
                    .HasColumnName("description");

                entity.Property(e => e.EmployeeId).HasColumnName("employee_id");

                entity.Property(e => e.HandoverId).HasColumnName("handover_id");

                entity.Property(e => e.OrderId).HasColumnName("order_id");

                entity.Property(e => e.PaymentMethod)
                    .HasMaxLength(20)
                    .IsUnicode(false)
                    .HasColumnName("payment_method");

                entity.Property(e => e.PerformedBy)
                    .HasMaxLength(100)
                    .IsUnicode(false)
                    .HasColumnName("performed_by");

                entity.Property(e => e.ReferenceId)
                    .HasMaxLength(50)
                    .IsUnicode(false)
                    .HasColumnName("reference_id");

                entity.Property(e => e.RefundId).HasColumnName("refund_id");

                entity.Property(e => e.TransactionCode)
                    .HasMaxLength(20)
                    .IsUnicode(false)
                    .HasColumnName("transaction_code");

                entity.Property(e => e.TransactionDate)
                    .HasColumnType("datetime")
                    .HasColumnName("transaction_date")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.TransactionType)
                    .HasMaxLength(50)
                    .IsUnicode(false)
                    .HasColumnName("transaction_type");

                entity.HasOne(d => d.Branch)
                    .WithMany(p => p.Transactions)
                    .HasForeignKey(d => d.BranchId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK_Transactions_Branch");

                entity.HasOne(d => d.Employee)
                    .WithMany(p => p.Transactions)
                    .HasForeignKey(d => d.EmployeeId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK_Transactions_Employee");

                entity.HasOne(d => d.Handover)
                    .WithMany(p => p.Transactions)
                    .HasForeignKey(d => d.HandoverId)
                    .HasConstraintName("FK_Transactions_Handover");

                entity.HasOne(d => d.Order)
                    .WithMany(p => p.Transactions)
                    .HasForeignKey(d => d.OrderId)
                    .HasConstraintName("FK_Transactions_Order");

                entity.HasOne(d => d.Refund)
                    .WithMany(p => p.Transactions)
                    .HasForeignKey(d => d.RefundId)
                    .HasConstraintName("FK_Transactions_Refund");
            });

            modelBuilder.Entity<Warehouse>(entity =>
            {
                entity.HasKey(e => e.WarehousesId)
                    .HasName("PK__warehous__00D1C5832338674B");

                entity.ToTable("warehouses");

                entity.Property(e => e.Address)
                    .HasMaxLength(255)
                    .HasColumnName("address");

                entity.Property(e => e.Capacity).HasColumnName("capacity");

                entity.Property(e => e.Name)
                    .HasMaxLength(255)
                    .HasColumnName("name");
            });

            modelBuilder.Entity<WarehouseTransfer>(entity =>
            {
                entity.HasKey(e => e.TransferId)
                    .HasName("PK__warehous__9549017165A1B91A");

                entity.ToTable("warehouse_transfers");

                entity.HasIndex(e => e.CreatedBy, "IX_warehouse_transfers_created_by");

                entity.HasIndex(e => e.FromWarehouseId, "IX_warehouse_transfers_from_warehouse_id");

                entity.HasIndex(e => e.ToWarehouseId, "IX_warehouse_transfers_to_warehouse_id");

                entity.Property(e => e.TransferId).HasColumnName("TransferID");

                entity.Property(e => e.CreatedBy).HasColumnName("created_by");

                entity.Property(e => e.FromWarehouseId).HasColumnName("from_warehouse_id");

                entity.Property(e => e.Notes)
                    .HasMaxLength(500)
                    .HasColumnName("notes");

                entity.Property(e => e.Status)
                    .HasMaxLength(50)
                    .HasColumnName("status")
                    .HasDefaultValueSql("(N'Chưa chuyển')");

                entity.Property(e => e.ToWarehouseId).HasColumnName("to_warehouse_id");

                entity.Property(e => e.TransferDate)
                    .HasColumnType("datetime")
                    .HasColumnName("transfer_date")
                    .HasDefaultValueSql("(getdate())");

                entity.HasOne(d => d.CreatedByNavigation)
                    .WithMany(p => p.WarehouseTransfers)
                    .HasForeignKey(d => d.CreatedBy)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK__warehouse__creat__41EDCAC5");

                entity.HasOne(d => d.FromWarehouse)
                    .WithMany(p => p.WarehouseTransferFromWarehouses)
                    .HasForeignKey(d => d.FromWarehouseId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK__warehouse__from___42E1EEFE");

                entity.HasOne(d => d.ToWarehouse)
                    .WithMany(p => p.WarehouseTransferToWarehouses)
                    .HasForeignKey(d => d.ToWarehouseId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK__warehouse__to_wa__43D61337");
            });

            modelBuilder.Entity<WarehouseTransferDetail>(entity =>
            {
                entity.HasKey(e => e.TransferDetailId)
                    .HasName("PK__warehous__F9BF690F258FA262");

                entity.ToTable("warehouse_transfer_details");

                entity.HasIndex(e => e.ProductId, "IX_warehouse_transfer_details_product_id");

                entity.HasIndex(e => e.TransferId, "IX_warehouse_transfer_details_transfer_id");

                entity.Property(e => e.TransferDetailId).HasColumnName("TransferDetailID");

                entity.Property(e => e.ProductId).HasColumnName("product_id");

                entity.Property(e => e.Quantity).HasColumnName("quantity");

                entity.Property(e => e.TransferId).HasColumnName("transfer_id");

                entity.HasOne(d => d.Product)
                    .WithMany(p => p.WarehouseTransferDetails)
                    .HasForeignKey(d => d.ProductId)
                    .HasConstraintName("FK__warehouse__produ__40058253");

                entity.HasOne(d => d.Transfer)
                    .WithMany(p => p.WarehouseTransferDetails)
                    .HasForeignKey(d => d.TransferId)
                    .HasConstraintName("FK__warehouse__trans__40F9A68C");
            });

            OnModelCreatingPartial(modelBuilder);
        }

        partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
    }
}
