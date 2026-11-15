CREATE DATABASE IF NOT EXISTS rentease;
USE rentease;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  phone VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('tenant','landlord','admin') NOT NULL DEFAULT 'tenant',
  status ENUM('active','suspended') NOT NULL DEFAULT 'active',
  theme ENUM('light','dark') NOT NULL DEFAULT 'light',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE sessions (
  id VARCHAR(128) PRIMARY KEY,
  user_id INT NOT NULL,
  ip_address VARCHAR(45),
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE security_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  event_type VARCHAR(50) NOT NULL,
  ip_address VARCHAR(45),
  details TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type VARCHAR(50),
  message VARCHAR(255) NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE properties (
  id INT AUTO_INCREMENT PRIMARY KEY,
  landlord_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  address VARCHAR(255) NOT NULL,
  city VARCHAR(60) NOT NULL,
  district VARCHAR(60) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (landlord_id) REFERENCES users(id),
  INDEX (city)
);

CREATE TABLE units (
  id INT AUTO_INCREMENT PRIMARY KEY,
  property_id INT NOT NULL,
  unit_number VARCHAR(20) NOT NULL,
  bedrooms TINYINT NOT NULL CHECK (bedrooms >= 0),
  bathrooms TINYINT NOT NULL CHECK (bathrooms >= 0),
  area_sqm INT CHECK (area_sqm > 0),
  furnished BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (property_id, unit_number),
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

CREATE TABLE listings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  unit_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT,
  monthly_rent DECIMAL(10,2) NOT NULL CHECK (monthly_rent > 0),
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  rejection_reason VARCHAR(255),
  approved_by INT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX (status, monthly_rent)
);

CREATE TABLE listing_photos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  listing_id INT NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
);

CREATE TABLE favourites (
  tenant_id INT NOT NULL,
  listing_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (tenant_id, listing_id),
  FOREIGN KEY (tenant_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
);

CREATE TABLE applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  listing_id INT NOT NULL,
  tenant_id INT NOT NULL,
  message TEXT,
  status ENUM('pending','accepted','rejected','withdrawn') NOT NULL DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (listing_id, tenant_id),
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE leases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  application_id INT NOT NULL UNIQUE,
  unit_id INT NOT NULL,
  tenant_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  monthly_rent DECIMAL(10,2) NOT NULL CHECK (monthly_rent > 0),
  status ENUM('active','ended') NOT NULL DEFAULT 'active',
  CHECK (end_date > start_date),
  FOREIGN KEY (application_id) REFERENCES applications(id),
  FOREIGN KEY (unit_id) REFERENCES units(id),
  FOREIGN KEY (tenant_id) REFERENCES users(id)
);

CREATE TABLE payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lease_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  paid_on DATE NOT NULL,
  method ENUM('cash','bank_transfer','wallet'),
  note VARCHAR(255),
  FOREIGN KEY (lease_id) REFERENCES leases(id)
);

CREATE TABLE service_staff (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  trade ENUM('plumbing','electrical','appliance','general')
);

CREATE TABLE maintenance_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  unit_id INT NOT NULL,
  tenant_id INT NOT NULL,
  category ENUM('plumbing','electrical','appliance','other') NOT NULL,
  priority ENUM('low','medium','urgent') NOT NULL DEFAULT 'medium',
  status ENUM('open','assigned','in_progress','resolved','cancelled') NOT NULL DEFAULT 'open',
  description TEXT NOT NULL,
  photo_path VARCHAR(255),
  assigned_staff_id INT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (unit_id) REFERENCES units(id),
  FOREIGN KEY (tenant_id) REFERENCES users(id),
  FOREIGN KEY (assigned_staff_id) REFERENCES service_staff(id) ON DELETE SET NULL
);

CREATE TABLE request_updates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_id INT NOT NULL,
  changed_by INT NOT NULL,
  new_status VARCHAR(20) NOT NULL,
  note VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES maintenance_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id)
);

SHOW TABLES;