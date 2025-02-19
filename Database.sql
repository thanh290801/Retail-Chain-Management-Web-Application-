-- Tạo cơ sở dữ liệutest
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
