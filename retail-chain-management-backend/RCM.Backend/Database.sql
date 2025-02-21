
-- Tạo cơ sở dữ liệu
CREATE DATABASE RetailChain10;
GO

-- Sử dụng cơ sở dữ liệu
USE RetailChain10;
GO

-- Bảng Kho hàng
CREATE TABLE warehouses (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    address NVARCHAR(255) NOT NULL,
    capacity INT NOT NULL -- Dung tích kho
);

-- Bảng Quản lý nhân sự
CREATE TABLE Employee (
    Id INT IDENTITY(1,1) PRIMARY KEY,
	[Image] Nvarchar(100),
    FullName NVARCHAR(100) NOT NULL,
    Gender NVARCHAR(10) CHECK (Gender IN ('Male', 'Female')),
    BirthDate DATE NOT NULL,
    IdentityNumber VARCHAR(20) UNIQUE NOT NULL,
    Hometown NVARCHAR(100),
    CurrentAddress NVARCHAR(255),
    PhoneNumber VARCHAR(15) UNIQUE NOT NULL,
	WorkShiftId int,
	FixedSalary int,
	ActiveStatus bit,
    StartDate DATE NOT NULL,
    BranchId INT,
    FOREIGN KEY (BranchId) REFERENCES warehouses(id)
);
-- Bảng Nhà cung cấp
CREATE TABLE suppliers (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    contact_person NVARCHAR(255) NULL,
    phone NVARCHAR(50) NULL,
    email NVARCHAR(255) NULL,
    address NVARCHAR(255) NULL
);

-- Bảng Sản phẩm
CREATE TABLE products (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    barcode NVARCHAR(50) UNIQUE NOT NULL,
    unit NVARCHAR(50) NOT NULL,
    quantity_per_unit INT NOT NULL,
    base_unit NVARCHAR(50) NOT NULL,
    weight DECIMAL(10,2) NULL,
    volume DECIMAL(10,2) NULL,
    image_url NVARCHAR(500) NULL,
    category NVARCHAR(50) CHECK (category IN ('thực phẩm', 'đồ uống', 'hàng tiêu dùng')),
    is_enabled BIT DEFAULT 1
);

-- Bảng Giá bán sản phẩm
CREATE TABLE product_prices (
    id INT IDENTITY(1,1) PRIMARY KEY,
    product_id INT NOT NULL,
    price DECIMAL(18,2) NOT NULL,
    effective_date DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Bảng Quản lý hàng tồn kho
CREATE TABLE stock_levels (
    id INT IDENTITY(1,1) PRIMARY KEY,
    product_id INT NOT NULL,
    warehouse_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    min_quantity INT NOT NULL DEFAULT 20,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE
);

-- Bảng Lô hàng
CREATE TABLE batch (
    id INT IDENTITY(1,1) PRIMARY KEY,
    warehouse_id INT NOT NULL,
    received_date DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE
);

-- Bảng Chi tiết Lô hàng
CREATE TABLE batch_details (
    id INT IDENTITY(1,1) PRIMARY KEY,
    batch_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    expiration_date DATE NOT NULL,
    FOREIGN KEY (batch_id) REFERENCES batch(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
-- Bảng Phiếu mua hàng
CREATE TABLE purchase_orders (
    id INT IDENTITY(1,1) PRIMARY KEY,
    supplier_id INT NULL,
    order_date DATETIME not null,
    expected_arrival DATETIME, -- Ngày dự kiến nhận hàng
	--thiếu total cost
    status NVARCHAR(50) CHECK (status IN ('pending', 'partially_received', 'completed', 'cancelled')),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
);

-- Bảng Chi tiết Phiếu mua hàng
CREATE TABLE purchase_order_items (
    id INT IDENTITY(1,1) PRIMARY KEY,
    purchase_order_id INT NOT NULL,
    product_id INT NOT NULL,
    batch_id INT NOT NULL,
    quantity_ordered INT NOT NULL, -- Số lượng đặt mua theo đơn vị nhỏ nhất
    quantity_received INT DEFAULT 0, -- Số lượng thực nhận theo đơn vị nhỏ nhất
    price DECIMAL(10,2) NOT NULL, -- Giá nhập
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (batch_id) REFERENCES batch(id) ON DELETE CASCADE
);
-- Bảng Phiếu kiểm kho
CREATE TABLE stock_audit_records (
    id INT IDENTITY(1,1) PRIMARY KEY,
    warehouse_id INT NOT NULL,
    audit_date DATETIME not null,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE
);

-- Bảng Chi tiết Phiếu kiểm kho
CREATE TABLE stock_audit_details (
    id INT IDENTITY(1,1) PRIMARY KEY,
    audit_id INT NOT NULL,
    product_id INT NOT NULL,
    recorded_quantity INT NOT NULL, -- Số lượng kiểm thực tế
    FOREIGN KEY (audit_id) REFERENCES stock_audit_records(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Bảng Phiếu điều chỉnh kho
CREATE TABLE stock_adjustments (
    id INT IDENTITY(1,1) PRIMARY KEY,
    warehouse_id INT NOT NULL,
    adjustment_date DATETIME not null,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE
);

-- Bảng Chi tiết Phiếu điều chỉnh kho
CREATE TABLE stock_adjustment_details (
    id INT IDENTITY(1,1) PRIMARY KEY,
    adjustment_id INT NOT NULL,
    product_id INT NOT NULL,
    adjusted_quantity INT NOT NULL, -- Số lượng điều chỉnh
    FOREIGN KEY (adjustment_id) REFERENCES stock_adjustments(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);


-- Bảng Đơn hàng
CREATE TABLE "Order" (
    [id] INT IDENTITY(1,1) PRIMARY KEY,
    [created_date] DATETIME NOT NULL ,
    "shop_id" INT NOT NULL,
	EmployeeId int not null,
    "total_amount" DECIMAL(18,2) NOT NULL,
    "discount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "final_amount" DECIMAL(18,2) NOT NULL,
	payment_method int not null,
    FOREIGN KEY (shop_id) REFERENCES warehouses(id) ON DELETE CASCADE,
	FOREIGN KEY (EmployeeId) REFERENCES Employee(Id) ON DELETE CASCADE
);

-- Bảng Chi tiết đơn hàng
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

-- Bảng lưu thông tin hoàn tiền
CREATE TABLE "Refund" (
    "id" INT PRIMARY KEY NOT NULL,
    "order_id" INT NOT NULL,
    "refund_date" date NOT NULL ,
    "refund_amount" DECIMAL(18,2) NOT NULL,
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


CREATE TABLE Account (
    Id INT IDENTITY(1,1) PRIMARY KEY,
	EmployeeId int not null,
    Username VARCHAR(50) UNIQUE NOT NULL,
    PasswordHash VARCHAR(255) NOT NULL,  -- Store hashed password securely
	[role] TINYINT CHECK (role IN (1, 2, 3)),
	FOREIGN KEY (EmployeeId) REFERENCES Employee(Id) ON DELETE CASCADE
);

--bảng lịch sử chấm công
CREATE TABLE AttendanceHis (
    Id INT IDENTITY(1,1) PRIMARY KEY,
	EmployeeId int not null,
    [Date] datetime NOT NULL,           
    [Shift] NVARCHAR(50) NOT NULL, 
	OnTime int ,
    FOREIGN KEY (EmployeeId) REFERENCES Employee(Id)
);
-- Bảng lương
CREATE TABLE Salary (
    Id INT IDENTITY(1,1) PRIMARY KEY,
	EmployeeId int not null,
	FixedSalary int,
	StartDate date,
	EndDate date,
	BonusSalary int,
	Penalty int,
	FinalSalary int,
    FOREIGN KEY (EmployeeId) REFERENCES Employee(Id) ON DELETE CASCADE
);

CREATE TABLE CASH (
    Id INT IDENTITY(1,1) PRIMARY KEY,
	EmployeeId int not null,
	BranchId INT not null,
	payment_method INT not null,
	[Type] BIT,
	Amount int not null,
	[Date] date,
	note nvarchar(255),
	FOREIGN KEY (EmployeeId) REFERENCES Employee(Id) ON DELETE CASCADE,
    FOREIGN KEY (BranchId) REFERENCES warehouses(id)
);
GO