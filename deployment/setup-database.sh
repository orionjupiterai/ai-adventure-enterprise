#!/bin/bash

# Database Setup Script for AI Adventure Platform

set -e

echo "Setting up PostgreSQL database for AI Adventure Platform..."

# Generate secure password
DB_PASSWORD=$(openssl rand -base64 32)
DB_NAME="adventure_platform"
DB_USER="adventure_user"

# Create database and user
sudo -u postgres psql <<EOF
-- Create database
CREATE DATABASE ${DB_NAME};

-- Create user with password
CREATE USER ${DB_USER} WITH ENCRYPTED PASSWORD '${DB_PASSWORD}';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};

-- Connect to the database and set up permissions
\c ${DB_NAME};
GRANT ALL ON SCHEMA public TO ${DB_USER};
EOF

echo "Database setup complete!"
echo ""
echo "Database Details:"
echo "=================="
echo "Database Name: ${DB_NAME}"
echo "Database User: ${DB_USER}"
echo "Database Password: ${DB_PASSWORD}"
echo ""
echo "IMPORTANT: Save this password securely and update your .env files!"
echo ""
echo "Connection string for .env files:"
echo "DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}"