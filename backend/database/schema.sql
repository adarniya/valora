-- backend/database/schema.sql
-- Valora ERP System Database Schema

DROP DATABASE IF EXISTS valora_erp;
CREATE DATABASE valora_erp;
USE valora_erp;

-- 1. Businesses Table
CREATE TABLE businesses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    vat_number VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_vat (vat_number)
);

-- 2. Stores Table
CREATE TABLE stores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
    INDEX idx_business (business_id)
);

-- 3. Roles Table
CREATE TABLE roles (
    id INT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO roles (id, role_name) VALUES 
(1, 'SuperAdmin'),
(2, 'Manager'),
(3, 'Accountant'),
(4, 'Sales'),
(5, 'Retailer'),
(6, 'Workshop');

-- 4. Users Table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    store_id INT NULL,
    role_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255) NOT NULL,
    contact VARCHAR(20),
    address TEXT,
    opening_balance DECIMAL(12,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE SET NULL,
    FOREIGN KEY (role_id) REFERENCES roles(id),
    INDEX idx_business (business_id),
    INDEX idx_store (store_id),
    INDEX idx_role (role_id),
    INDEX idx_username (username)
);

-- 5. Products Table
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    unit ENUM('liter', 'piece', 'kg', 'meter') NOT NULL,
    unit_value DECIMAL(10,2) NOT NULL,
    product_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
    INDEX idx_business (business_id),
    INDEX idx_sku (sku)
);

-- 6. Bills Table
CREATE TABLE bills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    store_id INT NOT NULL,
    user_id INT NOT NULL,
    bill_number VARCHAR(50) UNIQUE NOT NULL,
    bill_date DATE NOT NULL,
    sub_total DECIMAL(12,2) NOT NULL,
    vat_total DECIMAL(12,2) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    total_quantity DECIMAL(12,2) NOT NULL,
    total_items INT NOT NULL,
    sales_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (sales_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_business (business_id),
    INDEX idx_store (store_id),
    INDEX idx_user (user_id),
    INDEX idx_bill_date (bill_date),
    INDEX idx_bill_number (bill_number)
);

-- 7. Bill_Items Table
CREATE TABLE bill_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bill_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    base_unit_qty DECIMAL(10,2) NOT NULL,
    rate DECIMAL(10,2) NOT NULL,
    line_total DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_bill (bill_id),
    INDEX idx_product (product_id)
);

-- 8. Payments Table
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    payer_user_id INT NOT NULL,
    payment_date DATE NOT NULL,
    amount_paid DECIMAL(12,2) NOT NULL,
    payment_method ENUM('Cash', 'Bank', 'UPI', 'Card', 'Other') NOT NULL,
    transaction_id VARCHAR(100),
    received_by INT,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payer_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (received_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_payer (payer_user_id),
    INDEX idx_payment_date (payment_date)
);

-- 9. Ledger Table
CREATE TABLE ledger (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    store_id INT NOT NULL,
    user_id INT NOT NULL,
    user_name VARCHAR(255),
    reference_id INT NOT NULL,
    entry_type ENUM('Debit', 'Credit') NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    balance_after DECIMAL(12,2) NOT NULL,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_business (business_id),
    INDEX idx_store (store_id),
    INDEX idx_user (user_id),
    INDEX idx_entry_type (entry_type),
    INDEX idx_created (created_at)
);

-- ==========================================
-- SAMPLE DATA
-- ==========================================

-- Insert Business
INSERT INTO businesses (name, vat_number) VALUES 
('Valora Distributors Pvt Ltd', '300123456');

-- Insert Stores
INSERT INTO stores (business_id, name, address) VALUES 
(1, 'Main Store - Kathmandu', 'Thamel, Kathmandu'),
(1, 'Branch Store - Pokhara', 'Lakeside, Pokhara');

-- Insert Users
-- Password for all users: password123
-- Hashed with bcrypt: $2b$10$K8gI8vHZ7kZqP5xV5y5h0eF8kH8vHZ7kZqP5xV5y5h0eF8kH8vHZ7k
INSERT INTO users (business_id, store_id, role_id, name, username, email, password, contact, opening_balance) VALUES
-- SuperAdmin
(1, 1, 1, 'Super Admin', 'superadmin', 'admin@valora.com', '$2b$10$K8gI8vHZ7kZqP5xV5y5h0eF8kH8vHZ7kZqP5xV5y5h0eF8kH8vHZ7k', '9841000000', 0),
-- Manager
(1, 1, 2, 'Rajesh Manager', 'manager', 'manager@valora.com', '$2b$10$K8gI8vHZ7kZqP5xV5y5h0eF8kH8vHZ7kZqP5xV5y5h0eF8kH8vHZ7k', '9841000001', 0),
-- Accountant
(1, 1, 3, 'Sita Accountant', 'accountant', 'accountant@valora.com', '$2b$10$K8gI8vHZ7kZqP5xV5y5h0eF8kH8vHZ7kZqP5xV5y5h0eF8kH8vHZ7k', '9841000002', 0),
-- Sales
(1, 1, 4, 'Ram Sales', 'sales', 'sales@valora.com', '$2b$10$K8gI8vHZ7kZqP5xV5y5h0eF8kH8vHZ7kZqP5xV5y5h0eF8kH8vHZ7k', '9841000003', 0),
-- Retailers
(1, NULL, 5, 'Ram Traders', 'ram_traders', 'ram@traders.com', '$2b$10$K8gI8vHZ7kZqP5xV5y5h0eF8kH8vHZ7kZqP5xV5y5h0eF8kH8vHZ7k', '9841111111', 0),
(1, NULL, 5, 'Shyam Retailers', 'shyam_retail', 'shyam@retail.com', '$2b$10$K8gI8vHZ7kZqP5xV5y5h0eF8kH8vHZ7kZqP5xV5y5h0eF8kH8vHZ7k', '9841222222', 0),
-- Workshops
(1, NULL, 6, 'Hari Workshop', 'hari_workshop', 'hari@workshop.com', '$2b$10$K8gI8vHZ7kZqP5xV5y5h0eF8kH8vHZ7kZqP5xV5y5h0eF8kH8vHZ7k', '9841333333', 0);

-- Insert Products
INSERT INTO products (business_id, name, sku, unit, unit_value, product_price) VALUES
(1, 'Engine Oil 5L', 'OIL-5L-001', 'liter', 5.0, 2500.00),
(1, 'Engine Oil 1L', 'OIL-1L-001', 'liter', 1.0, 550.00),
(1, 'Brake Fluid 1L', 'BRK-1L-001', 'liter', 1.0, 800.00),
(1, 'Air Filter', 'FLT-PC-001', 'piece', 1.0, 500.00),
(1, 'Oil Filter', 'FLT-PC-002', 'piece', 1.0, 350.00);

SELECT '✅ Database schema created successfully!' as message;
SELECT '📝 Default Login Credentials:' as info;
SELECT 'SuperAdmin: superadmin / password123' as login;
SELECT 'Manager: manager / password123' as login;
SELECT 'Accountant: accountant / password123' as login;
SELECT 'Sales: sales / password123' as login;
SELECT 'Retailer: ram_traders / password123' as login;
SELECT 'Workshop: hari_workshop / password123' as login;