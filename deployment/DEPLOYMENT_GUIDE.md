# AI Adventure Platform - Deployment Guide

This guide will help you deploy the AI Adventure Platform to your Ubuntu 24.04 VPS.

## Prerequisites

- Ubuntu 24.04 VPS with at least:
  - 2 CPU cores
  - 4GB RAM (8GB recommended)
  - 50GB storage
- Root or sudo access
- Domain name (optional, can use IP initially)

## Quick Deployment

1. **SSH into your VPS:**
   ```bash
   ssh root@31.220.18.189
   ```

2. **Clone the repository:**
   ```bash
   git clone https://github.com/orionjupiterai/ai-adventure-enterprise.git
   cd ai-adventure-enterprise
   ```

3. **Run the deployment script:**
   ```bash
   chmod +x deployment/deploy.sh
   chmod +x deployment/setup-database.sh
   ./deployment/deploy.sh
   ```

4. **Set up the database:**
   ```bash
   ./deployment/setup-database.sh
   ```
   Save the generated password!

5. **Configure environment variables:**
   ```bash
   # Edit main backend configuration
   nano /opt/adventure-platform/backend/.env
   
   # Edit RPG backend configuration
   nano /opt/adventure-platform/immersive-ai-rpg/backend/.env
   ```

   Update these values:
   - `DATABASE_URL` with the password from step 4
   - `JWT_SECRET` (generate with: `openssl rand -base64 32`)
   - `OPENAI_API_KEY` (your OpenAI API key)

6. **Restart services:**
   ```bash
   pm2 restart all
   pm2 save
   ```

7. **Access your site:**
   - Main site: http://31.220.18.189
   - RPG game: http://31.220.18.189/rpg
   - API: http://31.220.18.189/api
   - GraphQL: http://31.220.18.189/graphql

## Manual Setup Steps

### 1. System Updates
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Install Dependencies
```bash
# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Other dependencies
sudo apt install -y git nginx postgresql postgresql-contrib redis-server build-essential

# PM2
sudo npm install -g pm2
```

### 3. PostgreSQL Setup
```bash
sudo -u postgres psql
CREATE DATABASE adventure_platform;
CREATE USER adventure_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE adventure_platform TO adventure_user;
\q
```

### 4. Application Setup
```bash
# Create directory
sudo mkdir -p /opt/adventure-platform
sudo chown $USER:$USER /opt/adventure-platform

# Clone repository
git clone https://github.com/orionjupiterai/ai-adventure-enterprise.git /opt/adventure-platform
cd /opt/adventure-platform

# Install dependencies
cd backend && npm install
cd ../immersive-ai-rpg/backend && npm install

# Build frontends
cd ../../frontend && npm install && npm run build
cd ../immersive-ai-rpg/frontend && npm install && npm run build
```

### 5. Configure Nginx
```bash
sudo cp deployment/nginx.conf /etc/nginx/sites-available/adventure-platform
sudo ln -s /etc/nginx/sites-available/adventure-platform /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

### 6. Start Services with PM2
```bash
cd /opt/adventure-platform
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Monitoring & Maintenance

### View logs:
```bash
pm2 logs                  # All logs
pm2 logs adventure-backend # Specific app logs
pm2 monit                 # Real-time monitoring
```

### Restart services:
```bash
pm2 restart all          # Restart all services
pm2 restart adventure-backend  # Restart specific service
```

### Update application:
```bash
cd /opt/adventure-platform
git pull origin main
npm install --prefix backend
npm install --prefix immersive-ai-rpg/backend
npm run build --prefix frontend
npm run build --prefix immersive-ai-rpg/frontend
pm2 restart all
```

## SSL/HTTPS Setup (with domain)

Once you have a domain pointing to your VPS:

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is set up automatically
```

## Troubleshooting

### Check service status:
```bash
pm2 status
sudo systemctl status nginx
sudo systemctl status postgresql
sudo systemctl status redis
```

### Check ports:
```bash
sudo netstat -tlnp
```

### View error logs:
```bash
# PM2 logs
pm2 logs --err

# Nginx logs
sudo tail -f /var/log/nginx/error.log

# System logs
sudo journalctl -xe
```

### Database connection issues:
1. Check PostgreSQL is running: `sudo systemctl status postgresql`
2. Verify credentials in .env files
3. Test connection: `psql -U adventure_user -d adventure_platform -h localhost`

### Permission issues:
```bash
# Fix file permissions
sudo chown -R $USER:$USER /opt/adventure-platform
chmod -R 755 /opt/adventure-platform
```

## Security Recommendations

1. **Change default passwords** immediately
2. **Set up UFW firewall** (done by deploy script)
3. **Use strong passwords** for database and JWT secrets
4. **Regular updates**: `sudo apt update && sudo apt upgrade`
5. **Set up fail2ban** for SSH protection:
   ```bash
   sudo apt install fail2ban
   sudo systemctl enable fail2ban
   ```
6. **Disable root SSH** and use key-based authentication

## Performance Optimization

1. **Enable Nginx caching** for static assets (already configured)
2. **Set up Redis** for session management (already installed)
3. **Monitor resource usage**: `htop` or `pm2 monit`
4. **Database indexing**: Run migrations regularly
5. **CDN setup**: Consider Cloudflare for static assets

## Backup Strategy

1. **Database backups**:
   ```bash
   # Create backup script
   pg_dump -U adventure_user adventure_platform > backup_$(date +%Y%m%d).sql
   ```

2. **Application backups**:
   ```bash
   tar -czf adventure_backup_$(date +%Y%m%d).tar.gz /opt/adventure-platform
   ```

3. **Automated backups**: Set up cron jobs for regular backups

## Support

- Repository: https://github.com/orionjupiterai/ai-adventure-enterprise
- Issues: https://github.com/orionjupiterai/ai-adventure-enterprise/issues