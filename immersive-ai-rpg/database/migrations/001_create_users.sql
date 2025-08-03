-- Migration: Create users table
-- Version: 001
-- Description: Initial users table creation

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('player', 'admin', 'moderator') DEFAULT 'player',
    status ENUM('active', 'suspended', 'banned') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    settings JSON,
    INDEX idx_email (email),
    INDEX idx_username (username)
);

-- Add initial admin user (password: admin123 - CHANGE IN PRODUCTION!)
INSERT INTO users (email, username, password_hash, role) 
VALUES (
    'admin@immersive-rpg.com',
    'admin',
    '$2a$10$YourHashedPasswordHere',
    'admin'
) ON DUPLICATE KEY UPDATE email=email;