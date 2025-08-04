# Complete Deployment Guide - AI Adventure Platform

## Your Infrastructure

### 1. Hostinger Shared Hosting
- **Domain**: https://imout.fun (and www.imout.fun)
- **IP**: 82.29.87.14
- **Storage**: 50 GB
- **Location**: North America (USA AZ)
- **FTP Access**: ftp://imout.fun (username: u630036661)

### 2. VPS Server
- **IP**: 31.220.18.189
- **OS**: Ubuntu 24.04
- **RAM**: 8 GB
- **Storage**: 100 GB
- **Location**: Phoenix, USA

## Recommended Architecture

### Option A: Full VPS Deployment (Recommended)
Deploy everything on your VPS and point imout.fun domain to it.

### Option B: Hybrid Deployment
- Frontend on Hostinger (fast CDN)
- Backend API on VPS (Node.js support)

## Step-by-Step Deployment

### Phase 1: Secure the Backend (VPS)

1. **SSH into your VPS**:
```bash
ssh root@31.220.18.189
```

2. **Create secure environment file**:
```bash
cd /opt/adventure-platform
nano backend/.env
```

Add these secure values:
```env
NODE_ENV=production
PORT=3000

# Generate secure secrets
JWT_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)

# Database (use the password from setup-database.sh)
DATABASE_URL=postgresql://adventure_user:2BB8KvkyMumIkDftF1WxKlk53x8VN0eGIWB6zaQQRYo=@localhost:5432/adventure_platform

# Your OpenAI key
OPENAI_API_KEY=your_actual_openai_key_here

# CORS - Allow your domain
CORS_ORIGIN=https://imout.fun,https://www.imout.fun

# Other settings
LOG_LEVEL=info
RATE_LIMIT_MAX_REQUESTS=100
```

3. **Update Nginx for your domain**:
```bash
nano /etc/nginx/sites-available/adventure-platform
```

Replace with:
```nginx
server {
    listen 80;
    server_name imout.fun www.imout.fun 31.220.18.189;

    # Frontend (we'll build this)
    location / {
        root /opt/adventure-platform/frontend-dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # RPG API
    location /rpg-api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

4. **Install SSL certificate**:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d imout.fun -d www.imout.fun
```

5. **Build and deploy frontend**:
```bash
cd /opt/adventure-platform/immersive-ai-rpg/frontend
npm install
npm run build
cp -r dist /opt/adventure-platform/frontend-dist
```

6. **Restart services**:
```bash
nginx -t
systemctl reload nginx
pm2 restart all
pm2 save
```

### Phase 2: Point Domain to VPS

1. **Update Hostinger DNS**:
   - Log into Hostinger control panel
   - Go to Domains → imout.fun → DNS
   - Change nameservers to Hostinger's (if not already)
   - Add A records:
     - Type: A, Name: @, Points to: 31.220.18.189
     - Type: A, Name: www, Points to: 31.220.18.189

2. **Or use Hostinger DNS Zone Editor**:
   - Remove any existing A records
   - Add new A record pointing to 31.220.18.189

### Phase 3: Security Hardening

1. **Firewall rules**:
```bash
# Remove direct backend access
sudo ufw delete allow 3000
sudo ufw delete allow 3001
sudo ufw status
```

2. **Create database backup script**:
```bash
cat > /opt/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups"
mkdir -p $BACKUP_DIR
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U adventure_user adventure_platform > $BACKUP_DIR/backup_$DATE.sql
# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
EOF

chmod +x /opt/backup-db.sh
# Add to crontab: 0 2 * * * /opt/backup-db.sh
```

3. **Security headers in Nginx**:
```nginx
# Add to server block
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

### Phase 4: Testing

1. **Check DNS propagation**:
```bash
nslookup imout.fun
dig imout.fun
```

2. **Test endpoints**:
```bash
# From VPS
curl -I https://imout.fun
curl https://imout.fun/api/health
```

3. **Browser testing**:
   - Visit https://imout.fun
   - Check SSL certificate (padlock)
   - Test game functionality
   - Monitor browser console for errors

### Phase 5: Monitoring

1. **Set up monitoring**:
```bash
# Install monitoring
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

2. **Health check endpoint**:
```bash
# Add to crontab
*/5 * * * * curl -f https://imout.fun/api/health || echo "Site down" | mail -s "Alert" your@email.com
```

## Quick Commands

### Start everything:
```bash
cd /opt/adventure-platform
pm2 start ecosystem.config.js
```

### View logs:
```bash
pm2 logs
pm2 monit
```

### Restart after changes:
```bash
pm2 restart all
nginx -t && systemctl reload nginx
```

### Update code:
```bash
cd /opt/adventure-platform
git pull
npm install --prefix backend
npm install --prefix immersive-ai-rpg/backend
npm run build --prefix immersive-ai-rpg/frontend
cp -r immersive-ai-rpg/frontend/dist/* /opt/adventure-platform/frontend-dist/
pm2 restart all
```

## Troubleshooting

1. **Site not loading**: Check DNS propagation (can take up to 24h)
2. **502 Bad Gateway**: Backend not running, check `pm2 status`
3. **CORS errors**: Update CORS_ORIGIN in .env
4. **SSL issues**: Re-run certbot
5. **Database errors**: Check connection string and PostgreSQL status

## Success Checklist

- [ ] VPS secured with firewall
- [ ] Strong passwords and secrets set
- [ ] SSL certificate active
- [ ] Domain pointing to VPS
- [ ] Frontend accessible at https://imout.fun
- [ ] API responding at https://imout.fun/api/health
- [ ] Game fully playable
- [ ] Backups configured
- [ ] Monitoring active

Your game will be live at https://imout.fun once DNS updates!