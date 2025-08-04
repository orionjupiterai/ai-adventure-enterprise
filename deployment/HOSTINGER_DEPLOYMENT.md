# Hostinger Deployment Guide for AI Adventure Platform

## Overview
This guide helps you deploy the AI Adventure Platform to Hostinger shared hosting.

## Pre-Deployment Security Fixes

### 1. Create Secure Environment File
Create `.env.production` with strong secrets:

```bash
# Generate secure secrets
JWT_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)

# Database (use Hostinger's MySQL)
DATABASE_URL=mysql://your_db_user:your_db_pass@localhost:3306/your_db_name

# API Keys
OPENAI_API_KEY=your_actual_openai_key

# Production URLs
CORS_ORIGIN=https://seagreen-wombat-500044.hostingersite.com
API_URL=https://seagreen-wombat-500044.hostingersite.com/api
```

### 2. Build Frontend for Production

```bash
cd immersive-ai-rpg/frontend

# Update API endpoint in your frontend config
# Edit src/services/api/client.js to use your production URL

# Build
npm run build
```

### 3. Prepare Backend for Shared Hosting

Since Hostinger shared hosting doesn't support Node.js apps directly, you have options:

#### Option A: Use Hostinger VPS (Recommended)
- Upgrade to VPS hosting for full Node.js support
- Use the VPS deployment scripts we created

#### Option B: Static Frontend + External API
- Deploy frontend only to Hostinger
- Use a service like Vercel/Railway for the backend API
- Or use your existing VPS (31.220.18.189) for the API

#### Option C: PHP Backend Adapter
- Create a PHP proxy for your Node.js API
- Limited functionality but works on shared hosting

## Deployment Steps for Static Frontend + External API

### 1. Configure Frontend for External API

```javascript
// src/config/api.js
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-api-backend.com'  // Your VPS or external service
  : 'http://localhost:3001';
```

### 2. Build Production Frontend

```bash
cd immersive-ai-rpg/frontend
npm run build
# This creates a 'dist' folder with static files
```

### 3. Upload to Hostinger

1. Log into Hostinger control panel
2. Go to File Manager
3. Navigate to public_html
4. Upload contents of `dist` folder
5. Create `.htaccess` for SPA routing:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

### 4. Deploy Backend to Your VPS

Use the secure deployment scripts on your VPS (31.220.18.189):

```bash
ssh root@31.220.18.189
cd /opt/adventure-platform
./deployment/deploy.sh
```

### 5. Configure CORS

Update backend to allow your Hostinger domain:

```javascript
// backend/.env
CORS_ORIGIN=https://seagreen-wombat-500044.hostingersite.com
```

## Security Checklist

- [ ] Strong JWT and session secrets generated
- [ ] Database passwords changed from defaults
- [ ] HTTPS enabled on both frontend and backend
- [ ] CORS restricted to production domains only
- [ ] API keys stored securely (not in code)
- [ ] Input validation enabled
- [ ] Rate limiting configured
- [ ] Security headers added
- [ ] File upload restrictions in place
- [ ] SQL injection prevention verified

## SSL/HTTPS Setup

### For Hostinger (Frontend)
1. Go to Hostinger panel → SSL
2. Enable free SSL certificate
3. Force HTTPS redirect

### For VPS (Backend API)
```bash
sudo apt install certbot
sudo certbot --nginx -d your-api-domain.com
```

## Testing

1. **Frontend**: Visit https://seagreen-wombat-500044.hostingersite.com
2. **API Health**: https://your-api-backend.com/health
3. **Full Integration**: Try creating an account and playing

## Monitoring

- Set up Hostinger's built-in analytics
- Configure error logging
- Monitor API response times
- Set up uptime monitoring

## Support

For issues:
1. Check browser console for frontend errors
2. Check API logs: `pm2 logs` on VPS
3. Verify CORS settings if getting cross-origin errors
4. Ensure all environment variables are set correctly