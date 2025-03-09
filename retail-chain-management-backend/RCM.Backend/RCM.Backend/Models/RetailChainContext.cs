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
        public virtual DbSet<AttendanceRecord> AttendanceRecords { get; set; } = null!;
        public virtual DbSet<BankTransaction> BankTransactions { get; set; } = null!;
        public virtual DbSet<Batch> Batches { get; set; } = null!;
        public virtual DbSet<BatchDetail> BatchDetails { get; set; } = null!;
        public virtual DbSet<CashTransaction> CashTransactions { get; set; } = null!;
        public virtual DbSet<DailySalesReport> DailySalesReports { get; set; } = null!;
        public virtual DbSet<Employee> Employees { get; set; } = null!;
        public virtual DbSet<Fund> Funds { get; set; } = null!;
        public virtual DbSet<FundTransactionHistory> FundTransactionHistories { get; set; } = null!;
        public virtual DbSet<Order> Orders { get; set; } = null!;
        public virtual DbSet<OrderDetail> OrderDetails { get; set; } = null!;
        public virtual DbSet<Payment> Payments { get; set; } = null!;
        public virtual DbSet<PaymentMethod> PaymentMethods { get; set; } = null!;
        public virtual DbSet<Product> Products { get; set; } = null!;
        public virtual DbSet<ProductPriceHistory> ProductPriceHistories { get; set; } = null!;
        public virtual DbSet<Promotion> Promotions { get; set; } = null!;
        public virtual DbSet<PurchaseOrder> PurchaseOrders { get; set; } = null!;
        public virtual DbSet<PurchaseOrderItem> PurchaseOrderItems { get; set; } = null!;
        public virtual DbSet<Refund> Refunds { get; set; } = null!;
        public virtual DbSet<RefundDetail> RefundDetails { get; set; } = null!;
        public virtual DbSet<Salary> Salaries { get; set; } = null!;
        public virtual DbSet<SalesReport> SalesReports { get; set; } = null!;
        public virtual DbSet<StockAdjustment> StockAdjustments { get; set; } = null!;
        public virtual DbSet<StockAdjustmentDetail> StockAdjustmentDetails { get; set; } = null!;
        public virtual DbSet<StockAuditDetail> StockAuditDetails { get; set; } = null!;
        public virtual DbSet<StockAuditRecord> StockAuditRecords { get; set; } = null!;
        public virtual DbSet<StockLevel> StockLevels { get; set; } = null!;
        public virtual DbSet<Supplier> Suppliers { get; set; } = null!;
        public virtual DbSet<SupplierProduct> SupplierProducts { get; set; } = null!;
        public virtual DbSet<Warehouse> Warehouses { get; set; } = null!;
        public virtual DbSet<WarehouseTransfer> WarehouseTransfers { get; set; } = null!;
        public virtual DbSet<WarehouseTransferDetail> WarehouseTransferDetails { get; set; } = null!;

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (!optionsBuilder.IsConfigured)
            {
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see http://go.microsoft.com/fwlink/?LinkId=723263.
                optionsBuilder.UseSqlServer("Server=DESKTOP-IGHRD48;Database=RetailChain;User Id=sa;Password=123;");
            }
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Account>(entity =>
            {
                entity.ToTable("Account");

                entity.HasIndex(e => e.Username, "UQ__Account__536C85E43EC42083")
                    .IsUnique();

                entity.Property(e => e.AccountId).HasColumnName("AccountID");

                entity.Property(e => e.IsActive).HasDefaultValueSql("((1))");

                entity.Property(e => e.PasswordHash).HasMaxLength(255);

                entity.Property(e => e.Role).HasMaxLength(20);

                entity.Property(e => e.Username).HasMaxLength(50);
            });

            modelBuilder.Entity<AttendanceRecord>(entity =>
            {
                entity.HasKey(e => e.AttendanceRecordsId)
                    .HasName("PK__Attendan__6D2B1F0CC7749894");

                entity.Property(e => e.CheckIn).HasColumnType("datetime");

                entity.Property(e => e.CheckOut).HasColumnType("datetime");

                entity.HasOne(d => d.Employee)
                    .WithMany(p => p.AttendanceRecords)
                    .HasForeignKey(d => d.EmployeeId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK__Attendanc__Emplo__2B0A656D");
            });

            modelBuilder.Entity<BankTransaction>(entity =>
            {
                entity.HasKey(e => e.TransactionId)
                    .HasName("PK__Bank_Tra__55433A4B8BBDA6CB");

                entity.ToTable("Bank_Transactions");

                entity.HasIndex(e => e.TransactionCode, "UQ__Bank_Tra__D85E70262512E663")
                    .IsUnique();

                entity.Property(e => e.TransactionId).HasColumnName("TransactionID");

                entity.Property(e => e.Amount).HasColumnType("decimal(18, 2)");

                entity.Property(e => e.EmployeeId).HasColumnName("EmployeeID");

                entity.Property(e => e.FundId).HasColumnName("FundID");

                entity.Property(e => e.SourceType).HasMaxLength(50);

                entity.Property(e => e.TransactionCode).HasMaxLength(20);

                entity.Property(e => e.TransactionDate)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.TransactionType).HasMaxLength(50);

                entity.HasOne(d => d.Employee)
                    .WithMany(p => p.BankTransactions)
                    .HasForeignKey(d => d.EmployeeId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK__Bank_Tran__Emplo__2BFE89A6");

                entity.HasOne(d => d.Fund)
                    .WithMany(p => p.BankTransactions)
                    .HasForeignKey(d => d.FundId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK__Bank_Tran__FundI__2CF2ADDF");
            });

            modelBuilder.Entity<Batch>(entity =>
            {
                entity.HasKey(e => e.BatchesId)
                    .HasName("PK__batches__D7870D5C9977AF31");

                entity.ToTable("batches");

                entity.Property(e => e.ReceivedDate)
                    .HasColumnType("datetime")
                    .HasColumnName("received_date")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.WarehouseId).HasColumnName("warehouse_id");

                entity.HasOne(d => d.Warehouse)
                    .WithMany(p => p.Batches)
                    .HasForeignKey(d => d.WarehouseId)
                    .HasConstraintName("FK__batches__warehou__30C33EC3");
            });

            modelBuilder.Entity<BatchDetail>(entity =>
            {
                entity.HasKey(e => e.BatchDetailsId)
                    .HasName("PK__batch_de__04D3CE30F4190EA4");

                entity.ToTable("batch_details");

                entity.Property(e => e.BatchDetailsId).HasColumnName("Batch_detailsId");

                entity.Property(e => e.BatchId).HasColumnName("batch_id");

                entity.Property(e => e.ProductId).HasColumnName("product_id");

                entity.Property(e => e.PurchaseOrderId).HasColumnName("purchase_order_id");

                entity.Property(e => e.Quantity).HasColumnName("quantity");

                entity.HasOne(d => d.Batch)
                    .WithMany(p => p.BatchDetails)
                    .HasForeignKey(d => d.BatchId)
                    .HasConstraintName("FK__batch_det__batch__2DE6D218");

                entity.HasOne(d => d.Product)
                    .WithMany(p => p.BatchDetails)
                    .HasForeignKey(d => d.ProductId)
                    .HasConstraintName("FK__batch_det__produ__2EDAF651");

                entity.HasOne(d => d.PurchaseOrder)
                    .WithMany(p => p.BatchDetails)
                    .HasForeignKey(d => d.PurchaseOrderId)
                    .OnDelete(DeleteBehavior.SetNull)
                    .HasConstraintName("FK__batch_det__purch__2FCF1A8A");
            });

            modelBuilder.Entity<CashTransaction>(entity =>
            {
                entity.HasKey(e => e.TransactionId)
                    .HasName("PK__Cash_Tra__55433A4B62FE195C");

                entity.ToTable("Cash_Transactions");

                entity.HasIndex(e => e.TransactionCode, "UQ__Cash_Tra__D85E7026722FF998")
                    .IsUnique();

                entity.Property(e => e.TransactionId).HasColumnName("TransactionID");

                entity.Property(e => e.Amount).HasColumnType("decimal(18, 2)");

                entity.Property(e => e.EmployeeId).HasColumnName("EmployeeID");

                entity.Property(e => e.FundId).HasColumnName("FundID");

                entity.Property(e => e.SourceType).HasMaxLength(50);

                entity.Property(e => e.TransactionCode).HasMaxLength(20);

                entity.Property(e => e.TransactionDate)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.TransactionType).HasMaxLength(50);

                entity.HasOne(d => d.Employee)
                    .WithMany(p => p.CashTransactions)
                    .HasForeignKey(d => d.EmployeeId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK__Cash_Tran__Emplo__31B762FC");

                entity.HasOne(d => d.Fund)
                    .WithMany(p => p.CashTransactions)
                    .HasForeignKey(d => d.FundId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK__Cash_Tran__FundI__32AB8735");
            });

            modelBuilder.Entity<DailySalesReport>(entity =>
            {
                entity.HasKey(e => e.ReportId)
                    .HasName("PK__daily_sa__D5BD48E5F9D9809C");

                entity.ToTable("daily_sales_reports");

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
                    .HasConstraintName("FK__daily_sal__wareh__339FAB6E");
            });

            modelBuilder.Entity<Employee>(entity =>
            {
                entity.ToTable("Employee");

                entity.HasIndex(e => e.IdentityNumber, "UQ__Employee__6354A73F71FDBC04")
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

                entity.Property(e => e.IdentityNumber)
                    .HasMaxLength(20)
                    .IsUnicode(false);

                entity.Property(e => e.IsActive).HasDefaultValueSql("((1))");

                entity.Property(e => e.IsCheckedIn).HasDefaultValueSql("((0))");

                entity.Property(e => e.Phone).HasMaxLength(20);

                entity.Property(e => e.ProfileImage).HasMaxLength(255);

                entity.Property(e => e.StartDate).HasColumnType("date");

                entity.Property(e => e.UpdatedAt)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("(getdate())");

                entity.HasOne(e => e.Account)
                    .WithOne(a => a.Employee)
                    .HasForeignKey<Employee>(e => e.AccountId)
                    .HasConstraintName("FK_Employee_Account");

               
                entity.HasOne(d => d.Branch)
                    .WithMany(p => p.Employees)
                    .HasForeignKey(d => d.BranchId)
                    .HasConstraintName("FK__Employee__Branch__3587F3E0");
            });

            modelBuilder.Entity<Fund>(entity =>
            {
                entity.ToTable("Fund");

                entity.Property(e => e.FundId).HasColumnName("FundID");

                entity.Property(e => e.Balance).HasColumnType("decimal(18, 2)");

                entity.Property(e => e.BranchId).HasColumnName("BranchID");

                entity.Property(e => e.FundType).HasMaxLength(50);

                entity.Property(e => e.LastUpdated)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("(getdate())");

                entity.HasOne(d => d.Branch)
                    .WithMany(p => p.Funds)
                    .HasForeignKey(d => d.BranchId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK__Fund__BranchID__367C1819");
            });

            modelBuilder.Entity<FundTransactionHistory>(entity =>
            {
                entity.HasKey(e => e.TransactionHistoryId)
                    .HasName("PK__Fund_Tra__599D2092763CC4D3");

                entity.ToTable("Fund_Transaction_History");

                entity.Property(e => e.TransactionHistoryId).HasColumnName("TransactionHistoryID");

                entity.Property(e => e.Amount).HasColumnType("decimal(18, 2)");

                entity.Property(e => e.FundId).HasColumnName("FundID");

                entity.Property(e => e.Notes).HasMaxLength(500);

                entity.Property(e => e.RelatedBankTransactionId).HasColumnName("RelatedBankTransactionID");

                entity.Property(e => e.RelatedCashTransactionId).HasColumnName("RelatedCashTransactionID");

                entity.Property(e => e.RelatedOrderId).HasColumnName("RelatedOrderID");

                entity.Property(e => e.RelatedRefundId).HasColumnName("RelatedRefundID");

                entity.Property(e => e.SourceType).HasMaxLength(50);

                entity.Property(e => e.TransactionDate)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.TransactionType).HasMaxLength(50);

                entity.HasOne(d => d.Fund)
                    .WithMany(p => p.FundTransactionHistories)
                    .HasForeignKey(d => d.FundId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK__Fund_Tran__FundI__37703C52");

                entity.HasOne(d => d.RelatedBankTransaction)
                    .WithMany(p => p.FundTransactionHistories)
                    .HasForeignKey(d => d.RelatedBankTransactionId)
                    .HasConstraintName("FK__Fund_Tran__Relat__3B40CD36");

                entity.HasOne(d => d.RelatedCashTransaction)
                    .WithMany(p => p.FundTransactionHistories)
                    .HasForeignKey(d => d.RelatedCashTransactionId)
                    .HasConstraintName("FK__Fund_Tran__Relat__3A4CA8FD");

                entity.HasOne(d => d.RelatedOrder)
                    .WithMany(p => p.FundTransactionHistories)
                    .HasForeignKey(d => d.RelatedOrderId)
                    .HasConstraintName("FK__Fund_Tran__Relat__3864608B");

                entity.HasOne(d => d.RelatedRefund)
                    .WithMany(p => p.FundTransactionHistories)
                    .HasForeignKey(d => d.RelatedRefundId)
                    .HasConstraintName("FK__Fund_Tran__Relat__395884C4");
            });

            modelBuilder.Entity<Order>(entity =>
            {
                entity.ToTable("Order");

                entity.Property(e => e.CreatedDate)
                    .HasColumnType("datetime")
                    .HasColumnName("created_date")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.Discount)
                    .HasColumnType("decimal(18, 2)")
                    .HasColumnName("discount");

                entity.Property(e => e.Employeeid).HasColumnName("employeeid");

                entity.Property(e => e.FinalAmount)
                    .HasColumnType("decimal(18, 2)")
                    .HasColumnName("final_amount");

                entity.Property(e => e.InvoiceDate)
                    .HasColumnType("datetime")
                    .HasColumnName("invoice_date")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.PaymentStatus)
                    .HasMaxLength(20)
                    .IsUnicode(false)
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
                    .HasConstraintName("FK__Order__employeei__3C34F16F");

                entity.HasOne(d => d.Shop)
                    .WithMany(p => p.Orders)
                    .HasForeignKey(d => d.ShopId)
                    .HasConstraintName("FK__Order__shop_id__3D2915A8");
            });

            modelBuilder.Entity<OrderDetail>(entity =>
            {
                entity.ToTable("OrderDetail");

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
                    .HasConstraintName("FK__OrderDeta__order__3E1D39E1");

                entity.HasOne(d => d.Product)
                    .WithMany(p => p.OrderDetails)
                    .HasForeignKey(d => d.ProductId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK__OrderDeta__produ__3F115E1A");
            });

            modelBuilder.Entity<Payment>(entity =>
            {
                entity.ToTable("Payment");

                entity.Property(e => e.AmountPaid).HasColumnType("decimal(18, 2)");

                entity.Property(e => e.BankTransactionId).HasColumnName("BankTransactionID");

                entity.Property(e => e.CashTransactionId).HasColumnName("CashTransactionID");

                entity.Property(e => e.OrderId).HasColumnName("OrderID");

                entity.Property(e => e.PaymentDate)
                    .HasColumnType("date")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.PaymentMethodId).HasColumnName("PaymentMethodID");

                entity.Property(e => e.PaymentStatus).HasMaxLength(20);

                entity.Property(e => e.TransactionId)
                    .HasMaxLength(255)
                    .HasColumnName("TransactionID");

                entity.HasOne(d => d.BankTransaction)
                    .WithMany(p => p.Payments)
                    .HasForeignKey(d => d.BankTransactionId)
                    .HasConstraintName("FK__Payment__BankTra__40058253");

                entity.HasOne(d => d.CashTransaction)
                    .WithMany(p => p.Payments)
                    .HasForeignKey(d => d.CashTransactionId)
                    .HasConstraintName("FK__Payment__CashTra__40F9A68C");

                entity.HasOne(d => d.Order)
                    .WithMany(p => p.Payments)
                    .HasForeignKey(d => d.OrderId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK__Payment__OrderID__41EDCAC5");

                entity.HasOne(d => d.PaymentMethod)
                    .WithMany(p => p.Payments)
                    .HasForeignKey(d => d.PaymentMethodId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK__Payment__Payment__42E1EEFE");
            });

            modelBuilder.Entity<PaymentMethod>(entity =>
            {
                entity.ToTable("PaymentMethod");

                entity.HasIndex(e => e.MethodName, "UQ__PaymentM__218CFB1749B42727")
                    .IsUnique();

                entity.Property(e => e.MethodName).HasMaxLength(50);
            });

            modelBuilder.Entity<Product>(entity =>
            {
                entity.HasKey(e => e.ProductsId)
                    .HasName("PK__products__BB48EDE5E42F3252");

                entity.ToTable("products");

                entity.HasIndex(e => e.Barcode, "UQ__products__C16E36F8461601EC")
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

            modelBuilder.Entity<ProductPriceHistory>(entity =>
            {
                entity.HasKey(e => e.PriceHistoryId)
                    .HasName("PK__product___A927CB2B2E04A79F");

                entity.ToTable("product_price_history");

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
                    .HasConstraintName("FK__product_p__chang__43D61337");

                entity.HasOne(d => d.Product)
                    .WithMany(p => p.ProductPriceHistories)
                    .HasForeignKey(d => d.ProductId)
                    .HasConstraintName("FK__product_p__produ__44CA3770");

                entity.HasOne(d => d.Warehouse)
                    .WithMany(p => p.ProductPriceHistories)
                    .HasForeignKey(d => d.WarehouseId)
                    .HasConstraintName("FK__product_p__wareh__45BE5BA9");
            });

            modelBuilder.Entity<Promotion>(entity =>
            {
                entity.HasKey(e => e.PromotionsId)
                    .HasName("PK__promotio__DBE22B92435E6284");

                entity.ToTable("promotions");

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
                    .HasConstraintName("FK__promotion__produ__46B27FE2");

                entity.HasOne(d => d.Warehouse)
                    .WithMany(p => p.Promotions)
                    .HasForeignKey(d => d.WarehouseId)
                    .HasConstraintName("FK__promotion__wareh__47A6A41B");
            });

            modelBuilder.Entity<PurchaseOrder>(entity =>
            {
                entity.HasKey(e => e.PurchaseOrdersId)
                    .HasName("PK__purchase__9736EF3E6F74B63D");

                entity.ToTable("purchase_orders");

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
                    .HasConstraintName("FK__purchase___suppl__4A8310C6");
            });

            modelBuilder.Entity<PurchaseOrderItem>(entity =>
            {
                entity.HasKey(e => e.PurchaseOrderItemsId)
                    .HasName("PK__purchase__4120509FB64AFDEC");

                entity.ToTable("purchase_order_items");

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
                    .HasConstraintName("FK__purchase___produ__489AC854");

                entity.HasOne(d => d.PurchaseOrder)
                    .WithMany(p => p.PurchaseOrderItems)
                    .HasForeignKey(d => d.PurchaseOrderId)
                    .HasConstraintName("FK__purchase___purch__498EEC8D");
            });

            modelBuilder.Entity<Refund>(entity =>
            {
                entity.ToTable("Refund");

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
                    .IsUnicode(false)
                    .HasColumnName("refund_status")
                    .HasDefaultValueSql("('Pending')");

                entity.HasOne(d => d.Employee)
                    .WithMany(p => p.Refunds)
                    .HasForeignKey(d => d.Employeeid)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK__Refund__employee__4B7734FF");

                entity.HasOne(d => d.Order)
                    .WithMany(p => p.Refunds)
                    .HasForeignKey(d => d.OrderId)
                    .HasConstraintName("FK__Refund__order_id__4C6B5938");
            });

            modelBuilder.Entity<RefundDetail>(entity =>
            {
                entity.ToTable("RefundDetail");

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
                    .HasConstraintName("FK__RefundDet__refun__4D5F7D71");
            });

            modelBuilder.Entity<Salary>(entity =>
            {
                entity.ToTable("Salary");

                entity.Property(e => e.EndDate).HasColumnType("date");

                entity.Property(e => e.StartDate).HasColumnType("date");

                entity.HasOne(d => d.Employee)
                    .WithMany(p => p.Salaries)
                    .HasForeignKey(d => d.EmployeeId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK__Salary__Employee__4E53A1AA");
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
                    .HasName("PK__stock_ad__0205693470D9F7DF");

                entity.ToTable("stock_adjustments");

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
                    .HasConstraintName("FK__stock_adj__audit__51300E55");

                entity.HasOne(d => d.Warehouse)
                    .WithMany(p => p.StockAdjustments)
                    .HasForeignKey(d => d.WarehouseId)
                    .HasConstraintName("FK__stock_adj__wareh__5224328E");
            });

            modelBuilder.Entity<StockAdjustmentDetail>(entity =>
            {
                entity.HasKey(e => e.StockAdjustmentDetailsId)
                    .HasName("PK__stock_ad__5443DBDD2C162AA7");

                entity.ToTable("stock_adjustment_details");

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
                    .HasConstraintName("FK__stock_adj__adjus__4F47C5E3");

                entity.HasOne(d => d.Product)
                    .WithMany(p => p.StockAdjustmentDetails)
                    .HasForeignKey(d => d.ProductId)
                    .HasConstraintName("FK__stock_adj__produ__503BEA1C");
            });

            modelBuilder.Entity<StockAuditDetail>(entity =>
            {
                entity.HasKey(e => e.StockAuditDetailsId)
                    .HasName("PK__stock_au__814DB738A3F8D183");

                entity.ToTable("stock_audit_details");

                entity.Property(e => e.AuditId).HasColumnName("audit_id");

                entity.Property(e => e.ProductId).HasColumnName("product_id");

                entity.Property(e => e.RecordedQuantity).HasColumnName("recorded_quantity");

                entity.HasOne(d => d.Audit)
                    .WithMany(p => p.StockAuditDetails)
                    .HasForeignKey(d => d.AuditId)
                    .HasConstraintName("FK__stock_aud__audit__531856C7");

                entity.HasOne(d => d.Product)
                    .WithMany(p => p.StockAuditDetails)
                    .HasForeignKey(d => d.ProductId)
                    .HasConstraintName("FK__stock_aud__produ__540C7B00");
            });

            modelBuilder.Entity<StockAuditRecord>(entity =>
            {
                entity.HasKey(e => e.StockAuditRecordsId)
                    .HasName("PK__stock_au__1C0D2BE344CE2C99");

                entity.ToTable("stock_audit_records");

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
                    .HasConstraintName("FK__stock_aud__audit__55009F39");

                entity.HasOne(d => d.CoAuditor)
                    .WithMany(p => p.StockAuditRecordCoAuditors)
                    .HasForeignKey(d => d.CoAuditorId)
                    .OnDelete(DeleteBehavior.SetNull)
                    .HasConstraintName("FK__stock_aud__co_au__55F4C372");

                entity.HasOne(d => d.Warehouse)
                    .WithMany(p => p.StockAuditRecords)
                    .HasForeignKey(d => d.WarehouseId)
                    .HasConstraintName("FK__stock_aud__wareh__56E8E7AB");
            });

            modelBuilder.Entity<StockLevel>(entity =>
            {
                entity.HasKey(e => e.StockLevelsId)
                    .HasName("PK__stock_le__76AB5D158F31ACE3");

                entity.ToTable("stock_levels");

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

                entity.Property(e => e.WarehouseId).HasColumnName("warehouse_id");

                entity.Property(e => e.WholesalePrice)
                    .HasColumnType("decimal(18, 2)")
                    .HasColumnName("wholesale_price");

                entity.HasOne(d => d.Product)
                    .WithMany(p => p.StockLevels)
                    .HasForeignKey(d => d.ProductId)
                    .HasConstraintName("FK__stock_lev__produ__57DD0BE4");

                entity.HasOne(d => d.Warehouse)
                    .WithMany(p => p.StockLevels)
                    .HasForeignKey(d => d.WarehouseId)
                    .HasConstraintName("FK__stock_lev__wareh__58D1301D");
            });

            modelBuilder.Entity<Supplier>(entity =>
            {
                entity.HasKey(e => e.SuppliersId)
                    .HasName("PK__supplier__8AB703A43970B8CE");

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

                entity.Property(e => e.Name)
                    .HasMaxLength(255)
                    .HasColumnName("name");

                entity.Property(e => e.Phone)
                    .HasMaxLength(50)
                    .HasColumnName("phone");
            });

            modelBuilder.Entity<SupplierProduct>(entity =>
            {
                entity.HasKey(e => e.SupplierProductsId)
                    .HasName("PK__supplier__6892C21EB7FECBE4");

                entity.ToTable("supplier_products");

                entity.Property(e => e.ProductId).HasColumnName("product_id");

                entity.Property(e => e.SupplierId).HasColumnName("supplier_id");

                entity.HasOne(d => d.Product)
                    .WithMany(p => p.SupplierProducts)
                    .HasForeignKey(d => d.ProductId)
                    .HasConstraintName("FK__supplier___produ__59C55456");

                entity.HasOne(d => d.Supplier)
                    .WithMany(p => p.SupplierProducts)
                    .HasForeignKey(d => d.SupplierId)
                    .HasConstraintName("FK__supplier___suppl__5AB9788F");
            });

            modelBuilder.Entity<Warehouse>(entity =>
            {
                entity.HasKey(e => e.WarehousesId)
                    .HasName("PK__warehous__00D1C583ACB2C5DE");

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
                    .HasName("PK__warehous__954901711BC2EB1A");

                entity.ToTable("warehouse_transfers");

                entity.Property(e => e.TransferId).HasColumnName("TransferID");

                entity.Property(e => e.CreatedBy).HasColumnName("created_by");

                entity.Property(e => e.FromWarehouseId).HasColumnName("from_warehouse_id");

                entity.Property(e => e.Notes)
                    .HasMaxLength(500)
                    .HasColumnName("notes");

                entity.Property(e => e.Status)
                    .HasMaxLength(50)
                    .HasColumnName("status")
                    .HasDefaultValueSql("('pending')");

                entity.Property(e => e.ToWarehouseId).HasColumnName("to_warehouse_id");

                entity.Property(e => e.TransferDate)
                    .HasColumnType("datetime")
                    .HasColumnName("transfer_date")
                    .HasDefaultValueSql("(getdate())");

                entity.HasOne(d => d.CreatedByNavigation)
                    .WithMany(p => p.WarehouseTransfers)
                    .HasForeignKey(d => d.CreatedBy)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK__warehouse__creat__5D95E53A");

                entity.HasOne(d => d.FromWarehouse)
                    .WithMany(p => p.WarehouseTransferFromWarehouses)
                    .HasForeignKey(d => d.FromWarehouseId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK__warehouse__from___5E8A0973");

                entity.HasOne(d => d.ToWarehouse)
                    .WithMany(p => p.WarehouseTransferToWarehouses)
                    .HasForeignKey(d => d.ToWarehouseId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK__warehouse__to_wa__5F7E2DAC");
            });

            modelBuilder.Entity<WarehouseTransferDetail>(entity =>
            {
                entity.HasKey(e => e.TransferDetailId)
                    .HasName("PK__warehous__F9BF690FCF0E6732");

                entity.ToTable("warehouse_transfer_details");

                entity.Property(e => e.TransferDetailId).HasColumnName("TransferDetailID");

                entity.Property(e => e.ProductId).HasColumnName("product_id");

                entity.Property(e => e.Quantity).HasColumnName("quantity");

                entity.Property(e => e.TransferId).HasColumnName("transfer_id");

                entity.HasOne(d => d.Product)
                    .WithMany(p => p.WarehouseTransferDetails)
                    .HasForeignKey(d => d.ProductId)
                    .HasConstraintName("FK__warehouse__produ__5BAD9CC8");

                entity.HasOne(d => d.Transfer)
                    .WithMany(p => p.WarehouseTransferDetails)
                    .HasForeignKey(d => d.TransferId)
                    .HasConstraintName("FK__warehouse__trans__5CA1C101");
            });

            OnModelCreatingPartial(modelBuilder);
        }

        partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
    }
}
