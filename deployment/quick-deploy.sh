#!/bin/bash

# Quick Deploy Script - Run this on your VPS!

set -e

echo "======================================"
echo "AI Adventure Platform - Quick Deploy"
echo "======================================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
   echo "Please run as root (use sudo)"
   exit 1
fi

# Clone repository
echo "📦 Cloning repository..."
cd /opt
git clone https://github.com/orionjupiterai/ai-adventure-enterprise.git adventure-platform
cd adventure-platform

# Make scripts executable
chmod +x deployment/*.sh

# Run main deployment
echo "🚀 Running deployment script..."
./deployment/deploy.sh

# Setup database
echo "🗄️ Setting up database..."
./deployment/setup-database.sh > db-credentials.txt

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Check database credentials in: /opt/adventure-platform/db-credentials.txt"
echo "2. Update .env files with your configuration"
echo "3. Run: pm2 restart all"
echo "4. Visit: http://$(curl -s ifconfig.me)"
echo ""
echo "📊 Monitor with: pm2 monit"
echo "📜 View logs with: pm2 logs"