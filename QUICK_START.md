# KCO Properties - Quick Start Guide

## What's Included

This package contains the complete source code for your KCO Properties rental website, including:

- ✅ Modern responsive website with property listings
- ✅ 6-step rental application form
- ✅ Tour scheduling system with email confirmations
- ✅ Admin dashboard for managing properties, applications, and tours
- ✅ Real-time unit availability checker
- ✅ Automated 24-hour tour reminder emails
- ✅ SendGrid email integration
- ✅ Amenities showcase page
- ✅ Contact form with notifications
- ✅ Privacy Policy and Terms of Service pages

## Quick Deployment Steps

### 1. Prerequisites

You need:
- Ubuntu/Debian Linux server
- Node.js 22.x
- MySQL 8.0+
- Domain name pointing to your server
- SendGrid API key (for emails)

### 2. Install Required Software

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 22.x
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm
npm install -g pnpm

# Install MySQL
sudo apt install -y mysql-server

# Install Nginx
sudo apt install -y nginx

# Install PM2
npm install -g pm2
```

### 3. Setup Database

```bash
# Login to MySQL
sudo mysql -u root -p

# Create database and user
CREATE DATABASE kco_properties CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'kco_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON kco_properties.* TO 'kco_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 4. Deploy Application

```bash
# Create application directory
sudo mkdir -p /var/www/kco-properties
sudo chown -R $USER:$USER /var/www/kco-properties

# Extract source code
unzip kco-properties-source.zip
cd kco-properties

# Install dependencies
pnpm install
```

### 5. Configure Environment

Create `.env` file:

```bash
nano .env
```

Add these variables (replace with your actual values):

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=mysql://kco_user:your_password@localhost:3306/kco_properties
JWT_SECRET=your_random_32_char_secret_here
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=apply@kcoproperties.com
SENDGRID_FROM_NAME=KCO Properties
VITE_APP_TITLE=KCO Properties - Rental Property Management
VITE_APP_LOGO=/KCOLogo&Name_white-Copy.png
```

**Important:** Generate JWT_SECRET with: `openssl rand -base64 32`

### 6. Initialize Database

```bash
# Push database schema
pnpm db:push

# This creates all necessary tables
```

### 7. Build and Start

```bash
# Build the application
pnpm build

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Follow the command it outputs
```

### 8. Configure Nginx

Create Nginx config:

```bash
sudo nano /etc/nginx/sites-available/kco-properties
```

Add:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and reload:

```bash
sudo ln -s /etc/nginx/sites-available/kco-properties /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 9. Setup SSL (Free with Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

### 10. Configure Firewall

```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

## Verify Deployment

1. Visit your domain: `https://your-domain.com`
2. Check PM2 status: `pm2 status`
3. View logs: `pm2 logs kco-properties`

## Default Admin Access

The website uses Manus OAuth for authentication. The first user to log in with the OWNER_OPEN_ID will automatically be set as admin.

## SendGrid Setup

1. Sign up at [SendGrid](https://sendgrid.com)
2. Verify sender email: `apply@kcoproperties.com`
3. Create API key with "Mail Send" permissions
4. Add API key to `.env` file

## Stripe Payment Setup

1. Sign up at [Stripe](https://stripe.com)
2. Get your API keys from Stripe Dashboard → Developers → API keys
3. Set up webhook endpoint (see `STRIPE_SETUP.md` for detailed instructions)
4. Add keys to `.env` file

**For detailed Stripe configuration, see `STRIPE_SETUP.md`**

## Common Commands

```bash
# View application status
pm2 status

# View logs
pm2 logs kco-properties

# Restart application
pm2 restart kco-properties

# Stop application
pm2 stop kco-properties

# Database backup
mysqldump -u kco_user -p kco_properties > backup.sql
```

## Need Help?

- **Full Documentation**: See `DEPLOYMENT_GUIDE.md` for detailed instructions
- **User Guide**: See `userGuide.md` for feature documentation
- **Troubleshooting**: Check the Troubleshooting section in DEPLOYMENT_GUIDE.md

## File Structure

```
kco-properties/
├── client/              # Frontend React application
│   ├── src/
│   │   ├── pages/      # Page components
│   │   ├── components/ # Reusable components
│   │   └── lib/        # Utilities
│   └── public/         # Static assets (logos, images)
├── server/             # Backend Node.js/Express
│   ├── routers.ts      # API routes
│   ├── db.ts           # Database queries
│   └── lib/            # Email service, etc.
├── drizzle/            # Database schema
│   └── schema.ts       # Table definitions
├── .env                # Environment variables (create this)
├── package.json        # Dependencies
└── DEPLOYMENT_GUIDE.md # Full deployment guide
```

## Support

For technical issues:
- Check logs: `pm2 logs kco-properties`
- Review DEPLOYMENT_GUIDE.md
- Verify all environment variables are set correctly

---

**Your KCO Properties website is ready to deploy!** 🚀
