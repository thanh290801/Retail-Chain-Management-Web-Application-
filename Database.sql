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
);

-- Bảng Quản lý nhân sự
CREATE TABLE Employee (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Image NVARCHAR(255),
    FullName NVARCHAR(100) NOT NULL,
    Gender CHAR(1) CHECK (Gender IN ('M', 'F')), -- Male, Female
    BirthDate DATE NOT NULL,
    IdentityNumber VARCHAR(20) UNIQUE NOT NULL,
    Hometown NVARCHAR(100),
    CurrentAddress NVARCHAR(255),
    PhoneNumber VARCHAR(15) UNIQUE NOT NULL,
    WorkShiftId INT,
    FixedSalary INT,
    ActiveStatus BIT DEFAULT 1,
    StartDate DATE NOT NULL,
    BranchId INT,
    FOREIGN KEY (BranchId) REFERENCES warehouses(id)
);

-- Bảng Tài khoản
CREATE TABLE Account (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    EmployeeId INT NOT NULL,
    Username VARCHAR(50) UNIQUE NOT NULL,
    PasswordHash VARCHAR(255) NOT NULL,
    Role TINYINT CHECK (Role IN (1, 2, 3)), -- 1: Admin, 2: Manager, 3: Staff
    FOREIGN KEY (EmployeeId) REFERENCES Employee(Id) ON DELETE CASCADE
);

-- Bảng Nhà cung cấp
CREATE TABLE suppliers (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    contact_person NVARCHAR(255),
    phone VARCHAR(50),
    email NVARCHAR(255),
    address NVARCHAR(255)
);

-- Bảng Sản phẩm
CREATE TABLE products (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    barcode NVARCHAR(50) UNIQUE NOT NULL,
    unit NVARCHAR(20) NOT NULL,
    quantity_per_unit SMALLINT NOT NULL,
    base_unit NVARCHAR(20) NOT NULL,
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
    effective_date DATE DEFAULT GETDATE(),
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

-- Bảng Lô hàng và Chi tiết lô hàng
CREATE TABLE batch (
    id INT IDENTITY(1,1) PRIMARY KEY,
    warehouse_id INT NOT NULL,
    received_date DATE DEFAULT GETDATE(),
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE
);

CREATE TABLE batch_details (
    id INT IDENTITY(1,1) PRIMARY KEY,
    batch_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    expiration_date DATE NOT NULL,
    FOREIGN KEY (batch_id) REFERENCES batch(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Bảng Đơn hàng và Chi tiết đơn hàng
CREATE TABLE orders (
    id INT IDENTITY(1,1) PRIMARY KEY,
    created_date DATETIME NOT NULL,
    shop_id INT NOT NULL,
    employee_id INT NOT NULL,
    total_amount DECIMAL(18,2) NOT NULL,
    discount DECIMAL(18,2) DEFAULT 0,
    final_amount DECIMAL(18,2) NOT NULL,
    payment_method TINYINT CHECK (payment_method IN (1, 2, 3)), -- 1: Cash, 2: Card, 3: Online
    FOREIGN KEY (shop_id) REFERENCES warehouses(id) ON DELETE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES Employee(Id) ON DELETE CASCADE
);

CREATE TABLE order_details (
    id INT IDENTITY(1,1) PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(18,2) NOT NULL,
    total_price AS (quantity * unit_price),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Bảng Hoàn tiền và Chi tiết hoàn tiền
CREATE TABLE refunds (
    id INT IDENTITY(1,1) PRIMARY KEY,
    order_id INT NOT NULL,
    refund_date DATE NOT NULL,
    refund_amount DECIMAL(18,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Bảng Lịch sử chấm công
CREATE TABLE attendance_history (
    id INT IDENTITY(1,1) PRIMARY KEY,
    employee_id INT NOT NULL,
    date DATE NOT NULL,
    shift TINYINT CHECK (shift IN (1, 2, 3)), -- 1: Morning, 2: Afternoon, 3: Night
    on_time BIT,
    FOREIGN KEY (employee_id) REFERENCES Employee(Id) ON DELETE CASCADE
);

-- Bảng Lương nhân viên
CREATE TABLE Salary (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    EmployeeId INT NOT NULL,
    FixedSalary INT,
    StartDate DATE,
    EndDate DATE,
    BonusSalary INT DEFAULT 0,
    Penalty INT DEFAULT 0,
    FinalSalary AS (FixedSalary + BonusSalary - Penalty),
    FOREIGN KEY (EmployeeId) REFERENCES Employee(Id) ON DELETE CASCADE
);

-- Bảng Giao dịch tiền mặt
CREATE TABLE CASH (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    EmployeeId INT NOT NULL,
    BranchId INT NOT NULL,
    payment_method TINYINT CHECK (payment_method IN (1, 2, 3)),
    Type BIT,
    Amount INT NOT NULL,
    Date DATE,
    note NVARCHAR(255),
    FOREIGN KEY (EmployeeId) REFERENCES Employee(Id) ON DELETE CASCADE,
    FOREIGN KEY (BranchId) REFERENCES warehouses(id)
);
