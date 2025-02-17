-- Tạo cơ sở dữ liệu
CREATE DATABASE RetailChain;
GO

-- Sử dụng cơ sở dữ liệu
USE RetailChain;
GO

-- Bảng Kho hàng
CREATE TABLE warehouses (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    address NVARCHAR(255) NOT NULL,
    capacity INT NOT NULL -- Dung tích kho
);

-- Bảng Sản phẩm
CREATE TABLE products (
    -- Tạo cơ sở dữ liệu
CREATE DATABASE RetailChain;
GO

-- Sử dụng cơ sở dữ liệu
USE RetailChain;
GO

-- Bảng Kho hàng
CREATE TABLE warehouses (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    address NVARCHAR(255) NOT NULL,
    capacity INT NOT NULL -- Dung tích kho
);

-- Bảng Sản phẩm
CREATE TABLE products (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    barcode NVARCHAR(50) UNIQUE NOT NULL, -- Mã vạch sản phẩm
    unit NVARCHAR(50) NOT NULL, -- Đơn vị tính (kg, lít, hộp…)
    quantity_per_unit INT NOT NULL, -- Số lượng trên mỗi đơn vị
    volume DECIMAL(10,2) NULL, -- Dung tích nếu là sản phẩm dạng nước
    category NVARCHAR(50) CHECK (category IN ('thực phẩm', 'đồ uống', 'hàng tiêu dùng')),
    is_enabled BIT DEFAULT 1 -- Có hiển thị trong hệ thống hay không
);

-- Bảng Quản lý hàng tồn kho
CREATE TABLE stock_levels (
    id INT IDENTITY(1,1) PRIMARY KEY,
    product_id INT NOT NULL,
    warehouse_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    min_quantity INT NOT NULL DEFAULT 20, -- Ngưỡng cảnh báo hàng sắp hết
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE
);

-- Bảng Lô hàng (Batch)
CREATE TABLE batches (
    id INT IDENTITY(1,1) PRIMARY KEY,
    product_id INT NOT NULL,
    warehouse_id INT NOT NULL,
    quantity INT NOT NULL,
    expiration_date DATE NOT NULL, -- Ngày hết hạn của từng lô
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE
);

-- Bảng Phiếu mua hàng
CREATE TABLE purchase_orders (
    id INT IDENTITY(1,1) PRIMARY KEY,
    supplier_id INT NOT NULL,
    order_date DATETIME DEFAULT GETDATE(),
    expected_arrival DATETIME, -- Ngày dự kiến nhận hàng
    status NVARCHAR(50) CHECK (status IN ('pending', 'partially_received', 'completed', 'cancelled'))
);

-- Bảng Chi tiết Phiếu mua hàng
CREATE TABLE purchase_order_items (
    id INT IDENTITY(1,1) PRIMARY KEY,
    purchase_order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity_ordered INT NOT NULL, -- Số lượng đặt mua
    quantity_received INT DEFAULT 0, -- Số lượng thực nhận
    price DECIMAL(10,2) NOT NULL, -- Giá nhập
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Bảng Đơn hàng (Thay thế cho sales_invoices)
CREATE TABLE "Order" (
    "id" INT IDENTITY(1,1) PRIMARY KEY,
    "created_date" DATETIME NOT NULL DEFAULT GETDATE(),
    "shop_id" INT NOT NULL,
    "total_amount" DECIMAL(18,2) NOT NULL,
    "discount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "final_amount" DECIMAL(18,2) NOT NULL,
    "payment_status" VARCHAR(20) CHECK ("payment_status" IN ('Pending', 'Paid', 'Refunded')) NOT NULL DEFAULT 'Pending',
    "invoice_date" DATETIME DEFAULT GETDATE(), -- Gộp từ sales_invoices
    FOREIGN KEY (shop_id) REFERENCES warehouses(id) ON DELETE CASCADE
);

-- Bảng Chi tiết đơn hàng (Thay thế cho sales_invoice_items)
CREATE TABLE "OrderDetail" (
    "id" INT IDENTITY(1,1) PRIMARY KEY,
    "order_id" INT NOT NULL,
    "product_id" INT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit_price" DECIMAL(18,2) NOT NULL,
    "total_price" DECIMAL(18,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES "Order"(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

);

-- Bảng Quản lý hàng tồn kho
CREATE TABLE stock_levels (
    id INT IDENTITY(1,1) PRIMARY KEY,
    product_id INT NOT NULL,
    warehouse_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    min_quantity INT NOT NULL DEFAULT 20, -- Ngưỡng cảnh báo hàng sắp hết
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE
);

-- Bảng Lô hàng (Batch)
CREATE TABLE batches (
    id INT IDENTITY(1,1) PRIMARY KEY,
    product_id INT NOT NULL,
    warehouse_id INT NOT NULL,
    quantity INT NOT NULL,
    expiration_date DATE NOT NULL, -- Ngày hết hạn của từng lô
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE
);

-- Bảng Phiếu mua hàng
CREATE TABLE purchase_orders (
    id INT IDENTITY(1,1) PRIMARY KEY,
    supplier_id INT NOT NULL,
    order_date DATETIME DEFAULT GETDATE(),
    expected_arrival DATETIME, -- Ngày dự kiến nhận hàng
    status NVARCHAR(50) CHECK (status IN ('pending', 'partially_received', 'completed', 'cancelled'))
);

-- Bảng Chi tiết Phiếu mua hàng
CREATE TABLE purchase_order_items (
    id INT IDENTITY(1,1) PRIMARY KEY,
    purchase_order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity_ordered INT NOT NULL, -- Số lượng đặt mua
    quantity_received INT DEFAULT 0, -- Số lượng thực nhận
    price DECIMAL(10,2) NOT NULL, -- Giá nhập
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Bảng Đơn hàng (Thay thế cho sales_invoices)
CREATE TABLE "Order" (
    "id" INT IDENTITY(1,1) PRIMARY KEY,
    "created_date" DATETIME NOT NULL DEFAULT GETDATE(),
    "shop_id" INT NOT NULL,
    "total_amount" DECIMAL(18,2) NOT NULL,
    "discount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "final_amount" DECIMAL(18,2) NOT NULL,
    "payment_status" VARCHAR(20) CHECK ("payment_status" IN ('Pending', 'Paid', 'Refunded')) NOT NULL DEFAULT 'Pending',
    "invoice_date" DATETIME DEFAULT GETDATE(), -- Gộp từ sales_invoices
    FOREIGN KEY (shop_id) REFERENCES warehouses(id) ON DELETE CASCADE
);

-- Bảng Chi tiết đơn hàng (Thay thế cho sales_invoice_items)
CREATE TABLE "OrderDetail" (
    "id" INT IDENTITY(1,1) PRIMARY KEY,
    "order_id" INT NOT NULL,
    "product_id" INT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit_price" DECIMAL(18,2) NOT NULL,
    "total_price" DECIMAL(18,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES "Order"(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Bảng phương thức thanh toán (Tiền mặt, VNPayQR)
CREATE TABLE "PaymentMethod" (
    "id" INT PRIMARY KEY NOT NULL,
    "method_name" VARCHAR(50) UNIQUE NOT NULL
);

-- Bảng lưu thông tin thanh toán
CREATE TABLE "Payment" (
    "id" INT PRIMARY KEY NOT NULL,
    "order_id" INT NOT NULL,
    "payment_method_id" INT NOT NULL,
    "amount_paid" DECIMAL(18,2) NOT NULL,
    "payment_status" VARCHAR(20) CHECK ("payment_status" IN ('Pending', 'Completed', 'Failed')) NOT NULL DEFAULT 'Pending',
    "transaction_id" VARCHAR(255) UNIQUE,
    "payment_date" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("order_id") REFERENCES "Order"("id") ON DELETE CASCADE,
    FOREIGN KEY ("payment_method_id") REFERENCES "PaymentMethod"("id") ON DELETE RESTRICT
);

-- Bảng lưu thông tin hoàn tiền
CREATE TABLE "Refund" (
    "id" INT PRIMARY KEY NOT NULL,
    "order_id" INT NOT NULL,
    "refund_date" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "refund_amount" DECIMAL(18,2) NOT NULL,
    "refund_status" VARCHAR(20) CHECK ("refund_status" IN ('Pending', 'Completed', 'Rejected')) NOT NULL DEFAULT 'Pending',
    FOREIGN KEY ("order_id") REFERENCES "Order"("id") ON DELETE CASCADE
);

-- Bảng chi tiết hoàn tiền
CREATE TABLE "RefundDetail" (
    "id" INT PRIMARY KEY NOT NULL,
    "refund_id" INT NOT NULL,
    "product_id" INT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit_price" DECIMAL(18,2) NOT NULL,
    "total_price" DECIMAL(18,2) NOT NULL,
    FOREIGN KEY ("refund_id") REFERENCES "Refund"("id") ON DELETE CASCADE
);

-- Bảng lưu giao dịch tiền (bao gồm thanh toán và hoàn tiền)
CREATE TABLE "Transaction" (
    "id" INT PRIMARY KEY NOT NULL,
    "order_id" INT,
    "refund_id" INT,
    "payment_method_id" INT NOT NULL,
    "transaction_type" VARCHAR(20) CHECK ("transaction_type" IN ('Payment', 'Refund')) NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "transaction_date" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transaction_status" VARCHAR(20) CHECK ("transaction_status" IN ('Pending', 'Completed', 'Failed')) NOT NULL DEFAULT 'Pending',
    "external_transaction_id" VARCHAR(255) UNIQUE,
    FOREIGN KEY ("order_id") REFERENCES "Order"("id") ON DELETE SET NULL,
    FOREIGN KEY ("refund_id") REFERENCES "Refund"("id") ON DELETE SET NULL,
    FOREIGN KEY ("payment_method_id") REFERENCES "PaymentMethod"("id") ON DELETE RESTRICT
);

--THÀNH
-- Bảng Doanh thu từ POS
CREATE TABLE financial_revenue (
    id INT IDENTITY(1,1) PRIMARY KEY,
    branch_id INT NOT NULL, 
    total_sales DECIMAL(15,2) NOT NULL, 
    transaction_date DATE NOT NULL, 
    created_at DATETIME DEFAULT GETDATE(),
    
    FOREIGN KEY (branch_id) REFERENCES warehouses(id)
);
GO

-- Bảng Chi phí nhập hàng từ kho
CREATE TABLE financial_inventory_cost (
    id INT IDENTITY(1,1) PRIMARY KEY,
    branch_id INT NOT NULL,
    total_cost DECIMAL(15,2) NOT NULL, 
    purchase_date DATE NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    
    FOREIGN KEY (branch_id) REFERENCES warehouses(id)
);
GO

-- Bảng Chi phí lương nhân sự
CREATE TABLE financial_salary_cost (
    id INT IDENTITY(1,1) PRIMARY KEY,
    branch_id INT NOT NULL,
    total_salary DECIMAL(15,2) NOT NULL, 
    salary_month DATE NOT NULL, 
    created_at DATETIME DEFAULT GETDATE(),

    FOREIGN KEY (branch_id) REFERENCES warehouses(id)
);
GO

-- Bảng Tổng hợp tài chính
CREATE TABLE financial_summary (
    id INT IDENTITY(1,1) PRIMARY KEY,
    branch_id INT NOT NULL,
    date DATE NOT NULL,
    total_sales DECIMAL(15,2) DEFAULT 0, 
    total_inventory_cost DECIMAL(15,2) DEFAULT 0, 
    total_salary_cost DECIMAL(15,2) DEFAULT 0, 
    total_other_expenses DECIMAL(15,2) DEFAULT 0, 
    net_profit AS (total_sales - (total_inventory_cost + total_salary_cost + total_other_expenses)) PERSISTED, 
    created_at DATETIME DEFAULT GETDATE(),
    
    FOREIGN KEY (branch_id) REFERENCES warehouses(id)
);
GO

-- Stored Procedure: Cập nhật tổng hợp tài chính
CREATE PROCEDURE UpdateFinancialSummary
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM financial_summary;

    INSERT INTO financial_summary (branch_id, date, total_sales, total_inventory_cost, total_salary_cost, created_at)
    SELECT 
        r.branch_id,
        r.transaction_date AS date,
        COALESCE(SUM(r.total_sales), 0) AS total_sales,
        COALESCE((SELECT SUM(ic.total_cost) FROM financial_inventory_cost ic 
                  WHERE ic.branch_id = r.branch_id AND ic.purchase_date = r.transaction_date), 0) AS total_inventory_cost,
        COALESCE((SELECT SUM(sc.total_salary) FROM financial_salary_cost sc 
                  WHERE sc.branch_id = r.branch_id AND sc.salary_month = EOMONTH(r.transaction_date)), 0) AS total_salary_cost,
        GETDATE() AS created_at
    FROM financial_revenue r
    GROUP BY r.branch_id, r.transaction_date;
END;
GO

-- Stored Procedure: Lấy báo cáo tài chính linh hoạt
CREATE PROCEDURE GetFinancialReport
    @startDate DATE = NULL,  
    @endDate DATE = NULL,    
    @year INT = NULL,        
    @month INT = NULL,       
    @day INT = NULL,         
    @branchId INT = NULL     
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        f.branch_id,
        b.name AS branch_name,
        f.date,
        f.total_sales,
        f.total_inventory_cost,
        f.total_salary_cost,
        f.total_other_expenses,
        f.net_profit
    FROM financial_summary f
    JOIN warehouses b ON f.branch_id = b.id
    WHERE 
        (@startDate IS NULL OR f.date >= @startDate)
        AND (@endDate IS NULL OR f.date <= @endDate)
        AND (@year IS NULL OR YEAR(f.date) = @year)
        AND (@month IS NULL OR MONTH(f.date) = @month)
        AND (@day IS NULL OR DAY(f.date) = @day)
        AND (@branchId IS NULL OR f.branch_id = @branchId)
    ORDER BY f.date DESC;
END;
GO











-- Chèn dữ liệu mẫu vào bảng Chi nhánh
INSERT INTO warehouses (name, location) VALUES 
(N'Chi nhánh 1', N'Hà Nội'),
(N'Chi nhánh 2', N'Hồ Chí Minh'),
(N'Chi nhánh 3', N'Đà Nẵng');
GO

-- Stored Procedure: Cập nhật bảng tổng hợp tài chính
CREATE PROCEDURE UpdateFinancialSummary
AS
BEGIN
    SET NOCOUNT ON;

    -- Xóa dữ liệu cũ trước khi cập nhật
    DELETE FROM financial_summary;

    -- Cập nhật dữ liệu mới vào bảng tổng hợp tài chính
    INSERT INTO financial_summary (branch_id, date, total_sales, total_expenses, created_at)
    SELECT 
        s.branch_id,
        s.transaction_date AS date,
        COALESCE(SUM(s.total_amount), 0) AS total_sales,
        COALESCE((SELECT SUM(ip.total_cost) FROM inventory_purchases ip 
                  WHERE ip.branch_id = s.branch_id AND ip.purchase_date = s.transaction_date), 0) + 
        COALESCE((SELECT SUM(sa.total_salary) FROM salaries sa 
                  WHERE sa.branch_id = s.branch_id AND sa.salary_month = EOMONTH(s.transaction_date)), 0) 
        AS total_expenses,
        GETDATE() AS created_at
    FROM sales s
    GROUP BY s.branch_id, s.transaction_date;
END;
GO

-- Stored Procedure: Lọc báo cáo tài chính theo ngày và chi nhánh
CREATE PROCEDURE GetFinancialReport
    @startDate DATE,  -- Ngày bắt đầu lọc
    @endDate DATE,    -- Ngày kết thúc lọc
    @branchId INT = NULL  -- ID chi nhánh (NULL = lấy toàn bộ)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        f.branch_id,
        b.name AS branch_name,
        f.date,
        f.total_sales,
        f.total_expenses,
        f.net_profit
    FROM financial_summary f
    JOIN warehouses b ON f.branch_id = b.id
    WHERE 
        f.date BETWEEN @startDate AND @endDate
        AND (@branchId IS NULL OR f.branch_id = @branchId)
    ORDER BY f.date DESC;
END;
GO
