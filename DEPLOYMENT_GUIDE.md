# KCO Properties - Linux Server Deployment Guide

This guide provides step-by-step instructions for deploying the KCO Properties website on a Linux server (Ubuntu/Debian recommended).

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Server Requirements](#server-requirements)
3. [Initial Server Setup](#initial-server-setup)
4. [Database Setup](#database-setup)
5. [Application Deployment](#application-deployment)
6. [Environment Configuration](#environment-configuration)
7. [Running the Application](#running-the-application)
8. [Process Management with PM2](#process-management-with-pm2)
9. [Nginx Reverse Proxy Setup](#nginx-reverse-proxy-setup)
10. [SSL Certificate Setup](#ssl-certificate-setup)
11. [Maintenance and Updates](#maintenance-and-updates)
12. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

- A Linux server (Ubuntu 20.04+ or Debian 11+ recommended)
- Root or sudo access to the server
- A domain name pointing to your server's IP address
- MySQL database (local or remote)
- SendGrid API key for email functionality

---

## Server Requirements

### Minimum Hardware

- **CPU**: 2 cores
- **RAM**: 2 GB
- **Storage**: 20 GB SSD
- **Bandwidth**: Unmetered or at least 1 TB/month

### Software Requirements

- **Operating System**: Ubuntu 20.04 LTS or newer
- **Node.js**: Version 22.x
- **MySQL**: Version 8.0 or newer
- **Nginx**: Latest stable version
- **PM2**: Process manager for Node.js

---

## Initial Server Setup

### 1. Update System Packages

```bash
sudo apt update
sudo apt upgrade -y
```

### 2. Install Node.js 22.x

```bash
# Install Node.js 22.x using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v22.x.x
npm --version
```

### 3. Install pnpm Package Manager

```bash
# Install pnpm globally
npm install -g pnpm

# Verify installation
pnpm --version
```

### 4. Install MySQL Server (if not using remote database)

```bash
# Install MySQL
sudo apt install -y mysql-server

# Secure MySQL installation
sudo mysql_secure_installation

# Follow the prompts:
# - Set root password
# - Remove anonymous users: Yes
# - Disallow root login remotely: Yes
# - Remove test database: Yes
# - Reload privilege tables: Yes
```

### 5. Install Nginx

```bash
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 6. Install PM2 Process Manager

```bash
sudo npm install -g pm2

# Verify installation
pm2 --version
```

---

## Database Setup

### 1. Create Database and User

```bash
# Login to MySQL as root
sudo mysql -u root -p

# Create database
CREATE DATABASE kco_properties CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Create database user
CREATE USER 'kco_user'@'localhost' IDENTIFIED BY 'your_secure_password_here';

# Grant privileges
GRANT ALL PRIVILEGES ON kco_properties.* TO 'kco_user'@'localhost';

# Flush privileges
FLUSH PRIVILEGES;

# Exit MySQL
EXIT;
```

### 2. Note Your Database Connection String

Your `DATABASE_URL` will be:

```
mysql://kco_user:your_secure_password_here@localhost:3306/kco_properties
```

---

## Application Deployment

### 1. Create Application Directory

```bash
# Create directory for the application
sudo mkdir -p /var/www/kco-properties
sudo chown -R $USER:$USER /var/www/kco-properties
cd /var/www/kco-properties
```

### 2. Upload Source Code

Upload the `kco-properties.zip` file to your server using SCP, SFTP, or any file transfer method:

```bash
# Example using SCP from your local machine
scp kco-properties.zip username@your-server-ip:/var/www/kco-properties/

# On the server, extract the zip file
cd /var/www/kco-properties
unzip kco-properties.zip
```

### 3. Install Dependencies

```bash
cd /var/www/kco-properties
pnpm install
```

---

## Environment Configuration

### 1. Create Production Environment File

Create a `.env` file in the project root:

```bash
nano .env
```

### 2. Add Required Environment Variables

```env
# Node Environment
NODE_ENV=production
PORT=3000

# Database Configuration
DATABASE_URL=mysql://kco_user:your_secure_password_here@localhost:3306/kco_properties

# JWT Secret (generate a random secure string)
JWT_SECRET=your_random_jwt_secret_here_min_32_characters

# SendGrid Email Configuration
SENDGRID_API_KEY=your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=apply@kcoproperties.com
SENDGRID_FROM_NAME=KCO Properties

# Application Configuration
VITE_APP_TITLE=KCO Properties - Rental Property Management
VITE_APP_LOGO=/KCOLogo&Name_white-Copy.png

# OAuth Configuration (if using Manus OAuth, otherwise can be removed)
VITE_APP_ID=your_app_id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
OWNER_OPEN_ID=your_owner_open_id
OWNER_NAME=Your Name

# Built-in Forge API (if using Manus services, otherwise can be removed)
BUILT_IN_FORGE_API_URL=https://forge.manus.im
BUILT_IN_FORGE_API_KEY=your_forge_api_key

# Analytics (optional)
VITE_ANALYTICS_ENDPOINT=your_analytics_endpoint
VITE_ANALYTICS_WEBSITE_ID=your_website_id

# Stripe Payment Configuration
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_signing_secret_here
```

**Important Notes:**

- Replace all placeholder values with your actual credentials
- Generate a secure JWT_SECRET: `openssl rand -base64 32`
- Keep this file secure and never commit it to version control
- Ensure SENDGRID_FROM_EMAIL matches your verified sender in SendGrid
- For Stripe setup, see `STRIPE_SETUP.md` for detailed instructions
- Use test keys (`sk_test_...`) for development, live keys (`sk_live_...`) for production

### 3. Set File Permissions

```bash
chmod 600 .env
```

### 4. Push Database Schema

```bash
# Run database migrations
pnpm db:push
```

This will create all necessary tables in your MySQL database.

---

## Running the Application

### 1. Build the Application

```bash
cd /var/www/kco-properties
pnpm build
```

### 2. Test the Application

```bash
# Start the application in production mode
NODE_ENV=production pnpm start

# Test if it's working
curl http://localhost:3000
```

If you see HTML output, the application is running correctly. Press `Ctrl+C` to stop it.

---

## Process Management with PM2

PM2 will keep your application running, restart it if it crashes, and start it automatically on server reboot.

### 1. Create PM2 Ecosystem File

```bash
nano ecosystem.config.js
```

Add the following content:

```javascript
module.exports = {
  apps: [{
    name: 'kco-properties',
    script: 'server/_core/index.ts',
    interpreter: 'node',
    interpreter_args: '--loader tsx',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '500M',
    watch: false,
    autorestart: true
  }]
};
```

### 2. Create Logs Directory

```bash
mkdir -p logs
```

### 3. Start Application with PM2

```bash
# Start the application
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Follow the command it outputs (usually requires sudo)
```

### 4. Useful PM2 Commands

```bash
# View application status
pm2 status

# View logs
pm2 logs kco-properties

# Restart application
pm2 restart kco-properties

# Stop application
pm2 stop kco-properties

# Monitor application
pm2 monit
```

---

## Nginx Reverse Proxy Setup

Configure Nginx to serve your application on port 80/443 and proxy requests to Node.js.

### 1. Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/kco-properties
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name kcoproperties.com www.kcoproperties.com;

    # Increase client body size for file uploads
    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
}
```

### 2. Enable the Site

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/kco-properties /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### 3. Configure Firewall

```bash
# Allow Nginx through firewall
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

---

## SSL Certificate Setup

Use Let's Encrypt to get a free SSL certificate.

### 1. Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Obtain SSL Certificate

```bash
sudo certbot --nginx -d kcoproperties.com -d www.kcoproperties.com
```

Follow the prompts:
- Enter your email address
- Agree to terms of service
- Choose whether to redirect HTTP to HTTPS (recommended: Yes)

### 3. Auto-Renewal

Certbot automatically sets up a cron job for renewal. Test it:

```bash
sudo certbot renew --dry-run
```

---

## Maintenance and Updates

### Updating the Application

```bash
# Navigate to application directory
cd /var/www/kco-properties

# Stop the application
pm2 stop kco-properties

# Pull latest code or upload new files
# ... (upload new files) ...

# Install dependencies
pnpm install

# Run database migrations if schema changed
pnpm db:push

# Build the application
pnpm build

# Restart the application
pm2 restart kco-properties

# Check status
pm2 status
```

### Database Backup

Create a backup script:

```bash
nano /home/ubuntu/backup-db.sh
```

Add:

```bash
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

mysqldump -u kco_user -p'your_password' kco_properties > $BACKUP_DIR/kco_properties_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "kco_properties_*.sql" -mtime +7 -delete
```

Make it executable:

```bash
chmod +x /home/ubuntu/backup-db.sh
```

Add to crontab for daily backups:

```bash
crontab -e

# Add this line for daily backup at 2 AM
0 2 * * * /home/ubuntu/backup-db.sh
```

---

## Troubleshooting

### Application Won't Start

1. Check PM2 logs:
   ```bash
   pm2 logs kco-properties --lines 100
   ```

2. Check environment variables:
   ```bash
   cat .env
   ```

3. Verify database connection:
   ```bash
   mysql -u kco_user -p -e "SHOW DATABASES;"
   ```

### Database Connection Errors

1. Verify MySQL is running:
   ```bash
   sudo systemctl status mysql
   ```

2. Test database connection:
   ```bash
   mysql -u kco_user -p'your_password' kco_properties -e "SELECT 1;"
   ```

3. Check DATABASE_URL format in .env file

### Email Not Sending

1. Verify SendGrid API key is correct
2. Check that sender email is verified in SendGrid
3. View application logs for email errors:
   ```bash
   pm2 logs kco-properties | grep Email
   ```

### Nginx 502 Bad Gateway

1. Check if Node.js application is running:
   ```bash
   pm2 status
   ```

2. Verify application is listening on correct port:
   ```bash
   netstat -tlnp | grep 3000
   ```

3. Check Nginx error logs:
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

### High Memory Usage

1. Check PM2 memory usage:
   ```bash
   pm2 monit
   ```

2. Restart application if needed:
   ```bash
   pm2 restart kco-properties
   ```

### Port Already in Use

```bash
# Find process using port 3000
sudo lsof -i :3000

# Kill the process if needed
sudo kill -9 <PID>
```

---

## Security Best Practices

1. **Keep System Updated**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Use Strong Passwords**
   - Database passwords should be at least 16 characters
   - Use a password manager

3. **Restrict Database Access**
   - Only allow localhost connections if database is on same server
   - Use firewall rules to restrict access

4. **Regular Backups**
   - Automate database backups
   - Store backups in a separate location

5. **Monitor Logs**
   ```bash
   # Check application logs regularly
   pm2 logs kco-properties
   
   # Check Nginx access logs
   sudo tail -f /var/log/nginx/access.log
   ```

6. **File Permissions**
   ```bash
   # Ensure .env file is not readable by others
   chmod 600 .env
   
   # Set proper ownership
   sudo chown -R $USER:$USER /var/www/kco-properties
   ```

---

## Support

For technical issues or questions:

- Email: support@kcoproperties.com
- Documentation: Check README.md in the project root

---

## Summary Checklist

- [ ] Server setup complete (Node.js, MySQL, Nginx, PM2)
- [ ] Database created and configured
- [ ] Source code uploaded and dependencies installed
- [ ] Environment variables configured in .env file
- [ ] Database schema pushed (pnpm db:push)
- [ ] Application built (pnpm build)
- [ ] PM2 configured and application running
- [ ] Nginx reverse proxy configured
- [ ] SSL certificate installed
- [ ] Firewall configured
- [ ] Database backup script created
- [ ] Application tested and accessible via domain

---

**Congratulations!** Your KCO Properties website should now be live and running on your Linux server.
