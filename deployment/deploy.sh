#!/bin/bash

# AI Adventure Platform Deployment Script
# For Ubuntu 24.04 VPS

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="31.220.18.189"  # Replace with your domain when you have one
APP_DIR="/opt/adventure-platform"
REPO_URL="https://github.com/orionjupiterai/ai-adventure-enterprise.git"
NODE_VERSION="20"

echo -e "${GREEN}AI Adventure Platform Deployment Script${NC}"
echo "========================================"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Update system
echo -e "${YELLOW}Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y

# Install essential packages
echo -e "${YELLOW}Installing essential packages...${NC}"
sudo apt install -y curl git build-essential nginx postgresql postgresql-contrib redis-server certbot python3-certbot-nginx

# Install Node.js
if ! command_exists node; then
    echo -e "${YELLOW}Installing Node.js ${NODE_VERSION}...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
    sudo apt install -y nodejs
else
    echo -e "${GREEN}Node.js already installed${NC}"
fi

# Install PM2 globally
if ! command_exists pm2; then
    echo -e "${YELLOW}Installing PM2...${NC}"
    sudo npm install -g pm2
else
    echo -e "${GREEN}PM2 already installed${NC}"
fi

# Create application directory
echo -e "${YELLOW}Setting up application directory...${NC}"
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR

# Clone or update repository
if [ -d "$APP_DIR/.git" ]; then
    echo -e "${YELLOW}Updating repository...${NC}"
    cd $APP_DIR
    git pull origin main
else
    echo -e "${YELLOW}Cloning repository...${NC}"
    git clone $REPO_URL $APP_DIR
    cd $APP_DIR
fi

# Install dependencies for main backend
echo -e "${YELLOW}Installing backend dependencies...${NC}"
cd $APP_DIR/backend
npm install --production

# Install dependencies for immersive-ai-rpg backend
echo -e "${YELLOW}Installing immersive-ai-rpg backend dependencies...${NC}"
cd $APP_DIR/immersive-ai-rpg/backend
npm install --production

# Build frontend
echo -e "${YELLOW}Building frontend...${NC}"
cd $APP_DIR/frontend
npm install
npm run build

# Build immersive-ai-rpg frontend
echo -e "${YELLOW}Building immersive-ai-rpg frontend...${NC}"
cd $APP_DIR/immersive-ai-rpg/frontend
npm install
npm run build

# Copy environment files
echo -e "${YELLOW}Setting up environment files...${NC}"
if [ ! -f "$APP_DIR/backend/.env" ]; then
    cp $APP_DIR/backend/.env.example $APP_DIR/backend/.env
    echo -e "${RED}Please edit $APP_DIR/backend/.env with your configuration${NC}"
fi

if [ ! -f "$APP_DIR/immersive-ai-rpg/backend/.env" ]; then
    cp $APP_DIR/immersive-ai-rpg/backend/.env.example $APP_DIR/immersive-ai-rpg/backend/.env
    echo -e "${RED}Please edit $APP_DIR/immersive-ai-rpg/backend/.env with your configuration${NC}"
fi

# Setup PostgreSQL database
echo -e "${YELLOW}Setting up PostgreSQL database...${NC}"
sudo -u postgres psql <<EOF
CREATE DATABASE IF NOT EXISTS adventure_platform;
CREATE USER IF NOT EXISTS adventure_user WITH ENCRYPTED PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE adventure_platform TO adventure_user;
EOF

# Run database migrations
echo -e "${YELLOW}Running database migrations...${NC}"
cd $APP_DIR/backend
NODE_ENV=production npm run migrate || echo "Migration command not found, skipping..."

# Setup PM2
echo -e "${YELLOW}Setting up PM2 processes...${NC}"
pm2 delete all || true  # Delete existing processes if any

# Start backend services
cd $APP_DIR
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save
pm2 startup systemd -u $USER --hp /home/$USER

# Setup nginx
echo -e "${YELLOW}Configuring Nginx...${NC}"
sudo cp $APP_DIR/deployment/nginx.conf /etc/nginx/sites-available/adventure-platform
sudo ln -sf /etc/nginx/sites-available/adventure-platform /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# Setup firewall
echo -e "${YELLOW}Configuring firewall...${NC}"
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp  # Backend API
sudo ufw allow 3001/tcp  # Immersive RPG API
sudo ufw --force enable

echo -e "${GREEN}Deployment complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Edit environment files:"
echo "   - $APP_DIR/backend/.env"
echo "   - $APP_DIR/immersive-ai-rpg/backend/.env"
echo "2. Update PostgreSQL password in the .env files"
echo "3. Run: pm2 restart all"
echo "4. Access your site at: http://$DOMAIN"
echo ""
echo "To monitor processes: pm2 monit"
echo "To view logs: pm2 logs"