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
CREATE TABLE "Order"(
    "id" BIGINT NOT NULL,
    "created_date" DATETIME NOT NULL,
    "shop" BIGINT NOT NULL,
    "totalAmount" BIGINT NOT NULL,
    "discount" BIGINT NOT NULL,
    "finalAmount" BIGINT NOT NULL,
    "paymentMethod" BIGINT NOT NULL,
    "paymentStatus" BIGINT NOT NULL
);
ALTER TABLE
    "Order" ADD CONSTRAINT "order_id_primary" PRIMARY KEY("id");
CREATE TABLE "OrderDetail"(
    "id" BIGINT NOT NULL,
    "orderId" BIGINT NOT NULL,
    "productId" BIGINT NOT NULL,
    "quantity" FLOAT(53) NOT NULL,
    "unitPrice" BIGINT NOT NULL,
    "totalPrice" BIGINT NOT NULL
);
ALTER TABLE
    "OrderDetail" ADD CONSTRAINT "orderdetail_id_primary" PRIMARY KEY("id");
CREATE TABLE "Refund"(
    "id" BIGINT NOT NULL,
    "bill_id" BIGINT NOT NULL,
    "refund_date" BIGINT NOT NULL
);
ALTER TABLE
    "Refund" ADD CONSTRAINT "refund_id_primary" PRIMARY KEY("id");
CREATE TABLE "Refund_details"(
    "id" BIGINT NOT NULL,
    "refundId" BIGINT NOT NULL,
    "productId" BIGINT NOT NULL,
    "quantity" FLOAT(53) NOT NULL,
    "unitPrice" BIGINT NOT NULL,
    "totalPrice" BIGINT NOT NULL
);
ALTER TABLE
    "Refund_details" ADD CONSTRAINT "refund_details_id_primary" PRIMARY KEY("id");
CREATE TABLE "Payment"(
    "id" BIGINT NOT NULL,
    "orderId" BIGINT NOT NULL
);
ALTER TABLE
    "Payment" ADD CONSTRAINT "payment_id_primary" PRIMARY KEY("id");
ALTER TABLE
    "Payment" ADD CONSTRAINT "payment_orderid_foreign" FOREIGN KEY("orderId") REFERENCES "Order"("id");
ALTER TABLE
    "Refund" ADD CONSTRAINT "refund_bill_id_foreign" FOREIGN KEY("bill_id") REFERENCES "Order"("id");
ALTER TABLE
    "OrderDetail" ADD CONSTRAINT "orderdetail_orderid_foreign" FOREIGN KEY("orderId") REFERENCES "Order"("id");
ALTER TABLE
    "Refund_details" ADD CONSTRAINT "refund_details_refundid_foreign" FOREIGN KEY("refundId") REFERENCES "Refund"("id");
-- Tạo bảng Doanh số từ POS
CREATE TABLE sales (
    id INT IDENTITY(1,1) PRIMARY KEY,
    branch_id INT FOREIGN KEY REFERENCES warehouses(id),
    total_amount DECIMAL(15,2) NOT NULL, -- Tổng tiền thu từ POS
    transaction_date DATE NOT NULL, -- Ngày giao dịch
    created_at DATETIME DEFAULT GETDATE()
);
GO

-- Tạo bảng Chi phí nhập hàng
CREATE TABLE inventory_purchases (
    id INT IDENTITY(1,1) PRIMARY KEY,
    branch_id INT FOREIGN KEY REFERENCES warehouses(id),
    total_cost DECIMAL(15,2) NOT NULL, -- Tổng chi phí nhập hàng
    purchase_date DATE NOT NULL, -- Ngày nhập hàng
    created_at DATETIME DEFAULT GETDATE()
);
GO

-- Tạo bảng Chi phí lương nhân viên
CREATE TABLE salaries (
    id INT IDENTITY(1,1) PRIMARY KEY,
    branch_id INT FOREIGN KEY REFERENCES warehouses(id),
    total_salary DECIMAL(15,2) NOT NULL, -- Tổng tiền lương phải trả
    salary_month DATE NOT NULL, -- Tháng chi trả lương
    created_at DATETIME DEFAULT GETDATE()
);
GO

-- Tạo bảng Tổng hợp tài chính
CREATE TABLE financial_summary (
    id INT IDENTITY(1,1) PRIMARY KEY,
    branch_id INT FOREIGN KEY REFERENCES warehouses(id),
    date DATE NOT NULL, -- Ngày tổng hợp dữ liệu
    total_sales DECIMAL(15,2) DEFAULT 0, -- Tổng doanh thu từ POS
    total_expenses DECIMAL(15,2) DEFAULT 0, -- Tổng chi phí (nhập hàng + lương)
    net_profit AS (total_sales - total_expenses) PERSISTED, -- Lợi nhuận tự động tính
    created_at DATETIME DEFAULT GETDATE()
);
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
