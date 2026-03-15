-- MySQL schema for FarmGenius, matching SQLAlchemy models in models.py

CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  hashed_password VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE profiles (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL DEFAULT '',
  phone VARCHAR(20),
  email VARCHAR(255),
  village_city VARCHAR(255),
  avatar_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE user_roles (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  role ENUM('farmer', 'dealer', 'admin') NOT NULL DEFAULT 'farmer',
  CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE crop_scans (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  image_url TEXT NOT NULL,
  disease_name VARCHAR(255),
  confidence DECIMAL(5,2),
  description TEXT,
  recommendations JSON,
  severity VARCHAR(20),
  affected_parts TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_crop_scans_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE yield_predictions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  crop_type VARCHAR(100) NOT NULL,
  soil_type VARCHAR(100) NOT NULL,
  area_acres DECIMAL(10,2) NOT NULL,
  sowing_date DATE NOT NULL,
  irrigation_type VARCHAR(100) NOT NULL,
  fertilizer_used VARCHAR(100) NOT NULL,
  estimated_yield DECIMAL(10,2),
  harvest_days INT,
  estimated_revenue DECIMAL(12,2),
  comparison_to_avg VARCHAR(20),
  recommendations JSON,
  risk_factors JSON,
  optimal_harvest_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_yield_predictions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE market_prices (
  id VARCHAR(36) PRIMARY KEY,
  crop VARCHAR(100) NOT NULL,
  variety VARCHAR(100) NOT NULL,
  market VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  price_per_quintal DECIMAL(10,2) NOT NULL,
  trend_percentage DECIMAL(5,2),
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE nearby_markets (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  phone VARCHAR(20),
  opening_hours VARCHAR(100),
  available_crops JSON,
  rating DECIMAL(2,1),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE government_policies (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  published_date DATE NOT NULL,
  link TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE chat_messages (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  conversation_id VARCHAR(36) NOT NULL,
  role VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_chat_messages_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE agricultural_tips (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  is_alert TINYINT(1) DEFAULT 0,
  published_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE dealer_buy_offers (
  id VARCHAR(36) PRIMARY KEY,
  dealer_id VARCHAR(36) NOT NULL,
  crop_type VARCHAR(100) NOT NULL,
  variety VARCHAR(100),
  quantity_quintals DECIMAL(10,2) NOT NULL,
  price_per_quintal DECIMAL(10,2) NOT NULL,
  quality_requirements TEXT,
  location VARCHAR(255),
  valid_until DATE,
  status VARCHAR(20) DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_dealer_buy_offers_user FOREIGN KEY (dealer_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE dealer_inventory (
  id VARCHAR(36) PRIMARY KEY,
  dealer_id VARCHAR(36) NOT NULL,
  crop_type VARCHAR(100) NOT NULL,
  variety VARCHAR(100),
  quantity_quintals DECIMAL(10,2) NOT NULL,
  purchase_price DECIMAL(10,2),
  selling_price DECIMAL(10,2),
  storage_location VARCHAR(255),
  purchase_date DATE,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_dealer_inventory_user FOREIGN KEY (dealer_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE dealer_orders (
  id VARCHAR(36) PRIMARY KEY,
  dealer_id VARCHAR(36) NOT NULL,
  farmer_id VARCHAR(36),
  crop_type VARCHAR(100) NOT NULL,
  variety VARCHAR(100),
  quantity_quintals DECIMAL(10,2) NOT NULL,
  price_per_quintal DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(12,2),
  status VARCHAR(30) DEFAULT 'pending',
  farmer_name VARCHAR(255),
  farmer_village VARCHAR(255),
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_dealer_orders_dealer FOREIGN KEY (dealer_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_dealer_orders_farmer FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

