-- Tạo cơ sở dữ liệu
CREATE DATABASE FinancialManagement4;
GO

-- Sử dụng cơ sở dữ liệu
USE FinancialManagement4;
GO

-- Tạo bảng Chi nhánh
CREATE TABLE warehouses (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    location NVARCHAR(500) NOT NULL
);
GO

-- Bảng Sản phẩm
CREATE TABLE products (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    sku NVARCHAR(50) UNIQUE NOT NULL, -- Mã sản phẩm duy nhất
    pricing_formula NVARCHAR(255) NULL -- Công thức giá bán (VD: "cost * 1.2")
);

-- Bảng Lô hàng (batch)
CREATE TABLE batches (
    id INT IDENTITY(1,1) PRIMARY KEY,
    product_id INT NOT NULL,
    warehouse_id INT NOT NULL,
    cost_price DECIMAL(10,2) NOT NULL, -- Giá nhập hàng của lô
    quantity INT NOT NULL, -- Số lượng trong lô
    expiry_date DATE NULL, -- Ngày hết hạn (nếu có)
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE NO ACTION
);

-- Bảng Quy tắc định giá
CREATE TABLE pricing_rules (
    id INT IDENTITY(1,1) PRIMARY KEY,
    product_id INT NOT NULL,
    min_cost_price DECIMAL(10,2) NOT NULL, -- Áp dụng nếu giá nhập >= min_cost_price
    max_cost_price DECIMAL(10,2) NOT NULL, -- Áp dụng nếu giá nhập <= max_cost_price
    formula NVARCHAR(255) NOT NULL, -- Công thức tính giá bán
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Bảng Lịch sử Nhập/Xuất/Điều chuyển hàng hóa
CREATE TABLE inventory_movements (
    id INT IDENTITY(1,1) PRIMARY KEY,
    product_id INT NOT NULL,
    batch_id INT NULL, -- Nếu có nhập theo lô
    from_warehouse_id INT NULL, -- NULL nếu nhập hàng mới
    to_warehouse_id INT NULL, -- NULL nếu bán hàng
    quantity INT NOT NULL,
    movement_type NVARCHAR(50) CHECK (movement_type IN ('import', 'export', 'transfer', 'internal_use')),
    cost_price DECIMAL(10,2) NULL, -- Ghi nhận giá nhập khi nhập hàng
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE NO ACTION,
    FOREIGN KEY (from_warehouse_id) REFERENCES warehouses(id) ON DELETE NO ACTION,
    FOREIGN KEY (to_warehouse_id) REFERENCES warehouses(id) ON DELETE NO ACTION
);
-- Bảng lưu thông tin đơn hàng
CREATE TABLE "Order" (
    "id" INT PRIMARY KEY NOT NULL,
    "created_date" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "shop_id" INT NOT NULL,
    "total_amount" DECIMAL(18,2) NOT NULL,
    "discount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "final_amount" DECIMAL(18,2) NOT NULL,
    "payment_status" VARCHAR(20) CHECK ("payment_status" IN ('Pending', 'Paid', 'Refunded')) NOT NULL DEFAULT 'Pending'
);

-- Bảng chi tiết đơn hàng
CREATE TABLE "OrderDetail" (
    "id" INT PRIMARY KEY NOT NULL,
    "order_id" INT NOT NULL,
    "product_id" INT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit_price" DECIMAL(18,2) NOT NULL,
    "total_price" DECIMAL(18,2) NOT NULL,
    FOREIGN KEY ("order_id") REFERENCES "Order"("id") ON DELETE CASCADE
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
