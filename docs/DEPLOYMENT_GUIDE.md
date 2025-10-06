# Alumni Tracer System - Deployment Guide

## Pre-Deployment Checklist

Before uploading your system to a production domain, follow this guide to ensure everything works properly.

---

## 1. Email Configuration (SendGrid Setup)

### Why SendGrid?
- ✅ Free tier: 100 emails/day forever
- ✅ Professional delivery
- ✅ Easy setup
- ✅ Great deliverability rates
- ✅ Detailed analytics

### Step-by-Step SendGrid Setup:

#### A. Create SendGrid Account
1. Go to https://sendgrid.com/
2. Sign up for a free account
3. Verify your email address
4. Complete the setup wizard

#### B. Create API Key
1. In SendGrid dashboard, go to **Settings** → **API Keys**
2. Click **Create API Key**
3. Name it: `Alumni Tracer System Production`
4. Choose **Full Access** or **Restricted Access** (with Mail Send permission)
5. Click **Create & View**
6. **IMPORTANT**: Copy the API key immediately (you won't see it again!)

#### C. Verify Sender Identity
You have two options:

**Option 1: Single Sender Verification** (Easiest)
1. Go to **Settings** → **Sender Authentication** → **Single Sender Verification**
2. Click **Create New Sender**
3. Fill in:
   - From Name: `Alumni Tracer System`
   - From Email: `noreply@yourdomain.com` (use your actual domain)
   - Reply To: `support@yourdomain.com`
   - Company: Your institution name
   - Address: Your institution address
4. Verify the email SendGrid sends you

**Option 2: Domain Authentication** (Recommended for production)
1. Go to **Settings** → **Sender Authentication** → **Authenticate Your Domain**
2. Follow the wizard to add DNS records to your domain
3. This improves deliverability and removes "via sendgrid.net" from emails

#### D. Update Production .env File
On your production server, update `.env`:

```env
# Email Configuration (SendGrid)
MAIL_MAILER=smtp
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USERNAME=apikey
MAIL_PASSWORD=your-sendgrid-api-key-here
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@yourdomain.com
MAIL_FROM_NAME="Alumni Tracer System"
```

**SECURITY NOTE**: Never commit your API key to Git! Keep it only in the production `.env` file.

---

## 2. Environment Configuration

### Update Production .env File

```env
# Application
APP_NAME="Alumni Tracer System"
APP_ENV=production
APP_KEY=base64:your-production-key-here
APP_DEBUG=false
APP_URL=https://yourdomain.com

# Database
DB_CONNECTION=mysql
DB_HOST=localhost  # or your database host
DB_PORT=3306
DB_DATABASE=your_production_database
DB_USERNAME=your_production_db_user
DB_PASSWORD=your_secure_db_password

# Session
SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_DOMAIN=yourdomain.com

# Cache
CACHE_STORE=database
QUEUE_CONNECTION=database

# Sanctum
SANCTUM_STATEFUL_DOMAINS=yourdomain.com,www.yourdomain.com

# Email (SendGrid - see above)
MAIL_MAILER=smtp
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USERNAME=apikey
MAIL_PASSWORD=your-sendgrid-api-key
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@yourdomain.com
MAIL_FROM_NAME="${APP_NAME}"

# Security
APP_DEBUG=false  # CRITICAL: Must be false in production!
```

---

## 3. Server Requirements

### Minimum Requirements:
- PHP >= 8.2
- MySQL >= 5.7 or MariaDB >= 10.3
- Composer
- Node.js >= 18 (for building assets)
- SSL Certificate (HTTPS)

### PHP Extensions Required:
- BCMath
- Ctype
- cURL
- DOM
- Fileinfo
- JSON
- Mbstring
- OpenSSL
- PDO
- PDO_MySQL
- Tokenizer
- XML

### Recommended Hosting Providers:
1. **DigitalOcean** (App Platform or Droplet)
2. **AWS** (Lightsail or EC2)
3. **Vultr**
4. **Linode**
5. **Shared Hosting** with Laravel support (e.g., SiteGround, A2 Hosting)

---

## 4. Deployment Steps

### Step 1: Prepare Your Code
```bash
# On your local machine

# 1. Build production assets
npm run build

# 2. Optimize Laravel
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 3. Clear any development cache
php artisan cache:clear
```

### Step 2: Upload Files
Upload these files/folders to your server:
```
✅ /app
✅ /bootstrap
✅ /config
✅ /database
✅ /public
✅ /resources
✅ /routes
✅ /storage
✅ /vendor (or run composer install on server)
✅ artisan
✅ composer.json
✅ composer.lock
✅ package.json
```

**DO NOT UPLOAD:**
```
❌ /node_modules (build locally, upload /public/build)
❌ .env (create new one on server)
❌ .git
❌ tests/
```

### Step 3: Server Setup
```bash
# SSH into your server

# 1. Install Composer dependencies
composer install --no-dev --optimize-autoloader

# 2. Set up .env file
cp .env.example .env
nano .env  # Edit with your production settings

# 3. Generate application key
php artisan key:generate

# 4. Set proper permissions
chmod -R 755 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache

# 5. Run migrations
php artisan migrate --force

# 6. Seed essential data (if needed)
php artisan db:seed --force

# 7. Create symbolic link for storage
php artisan storage:link

# 8. Cache configuration
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### Step 4: Web Server Configuration

#### Apache (.htaccess)
Point your domain to `/public` directory. Add this to your Apache config or `.htaccess`:

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteRule ^(.*)$ public/$1 [L]
</IfModule>
```

#### Nginx
Add this to your Nginx config:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    root /path/to/your-project/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

### Step 5: SSL Certificate (HTTPS)
```bash
# Using Let's Encrypt (Free)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 5. Database Migration

### Export from Local
```bash
# On your local machine (XAMPP)
mysqldump -u root alumni_tracer_system > alumni_tracer_backup.sql
```

### Import to Production
```bash
# On production server
mysql -u your_production_user -p your_production_database < alumni_tracer_backup.sql
```

**OR** use phpMyAdmin if available on your hosting.

---

## 6. Post-Deployment Tasks

### A. Test Email Functionality
1. Log into your admin panel
2. Go to User Management
3. Try "Reset Password" on a test user
4. Check if email is received
5. Check SendGrid dashboard for delivery stats

### B. Update Email Templates (Optional)
Create custom email templates in `resources/views/emails/` for:
- Password reset
- Welcome emails
- Survey invitations

### C. Set Up Monitoring
1. **SendGrid**: Monitor email delivery in SendGrid dashboard
2. **Server**: Set up uptime monitoring (e.g., UptimeRobot)
3. **Logs**: Regularly check `storage/logs/laravel.log`

### D. Backup Strategy
Set up automated backups:
```bash
# Create backup script
#!/bin/bash
mysqldump -u user -p password database > backup_$(date +%Y%m%d).sql
tar -czf files_$(date +%Y%m%d).tar.gz /path/to/project
```

Schedule with cron:
```bash
# Run daily at 2 AM
0 2 * * * /path/to/backup.sh
```

---

## 7. Security Checklist

### Before Going Live:
- [ ] Set `APP_DEBUG=false` in production `.env`
- [ ] Set `APP_ENV=production`
- [ ] Use strong database passwords
- [ ] Enable HTTPS/SSL certificate
- [ ] Keep your SendGrid API key secret
- [ ] Set proper file permissions (755 for directories, 644 for files)
- [ ] Disable directory listing in Apache/Nginx
- [ ] Keep Laravel and dependencies updated
- [ ] Set up regular backups
- [ ] Configure firewall rules
- [ ] Use secure session configuration
- [ ] Enable CSRF protection (already enabled)
- [ ] Sanitize user inputs (already implemented)

---

## 8. Testing Checklist

### Before Announcement:
- [ ] User registration works
- [ ] User login works
- [ ] Password reset emails are sent and received
- [ ] Admin can create users
- [ ] Admin can manage batches
- [ ] Surveys can be created and published
- [ ] Alumni can submit survey responses
- [ ] Analytics dashboard loads correctly
- [ ] Alumni Bank displays profiles
- [ ] All CRUD operations work
- [ ] Mobile responsive design works
- [ ] Email notifications are delivered
- [ ] File uploads work (if applicable)
- [ ] Search and filter functions work

---

## 9. Performance Optimization

### Production Performance Tips:
```bash
# Enable OPcache in php.ini
opcache.enable=1
opcache.memory_consumption=128
opcache.max_accelerated_files=10000

# Use Redis for caching (if available)
CACHE_DRIVER=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis

# Optimize Composer autoloader
composer dump-autoload --optimize

# Use queue workers for emails
php artisan queue:work --daemon
```

---

## 10. Maintenance Mode

### When Updating the System:
```bash
# Put site in maintenance mode
php artisan down --message="System maintenance in progress"

# Update code
git pull origin main  # if using Git

# Update dependencies
composer install --no-dev --optimize-autoloader

# Run migrations
php artisan migrate --force

# Clear and rebuild cache
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Bring site back online
php artisan up
```

---

## 11. Troubleshooting Common Issues

### Email Not Sending
1. Check SendGrid API key is correct
2. Verify sender email is verified in SendGrid
3. Check `storage/logs/laravel.log` for errors
4. Test SendGrid API key: `curl --request POST --url https://api.sendgrid.com/v3/mail/send --header "Authorization: Bearer YOUR_API_KEY"`

### 500 Internal Server Error
1. Check `storage/logs/laravel.log`
2. Verify file permissions
3. Make sure `.env` file exists and is configured
4. Run `php artisan config:clear`

### Database Connection Failed
1. Verify database credentials in `.env`
2. Check if database exists
3. Verify database user has proper permissions
4. Check if MySQL service is running

### Assets Not Loading
1. Run `npm run build` before deployment
2. Verify `/public/build` folder exists
3. Check file permissions
4. Clear browser cache

---

## 12. Quick Reference - Production URLs

After deployment, your system will be accessible at:

- **Main Site**: https://yourdomain.com
- **Admin Login**: https://yourdomain.com/login
- **Admin Dashboard**: https://yourdomain.com/admin/dashboard
- **Alumni Registration**: https://yourdomain.com/register
- **API Endpoint**: https://yourdomain.com/api/v1/

---

## 13. Support Resources

### SendGrid Resources:
- Dashboard: https://app.sendgrid.com/
- Documentation: https://docs.sendgrid.com/
- API Status: https://status.sendgrid.com/

### Laravel Resources:
- Documentation: https://laravel.com/docs
- Deployment Guide: https://laravel.com/docs/deployment
- Forge (Managed Hosting): https://forge.laravel.com/

### Need Help?
- Check `storage/logs/laravel.log` for detailed error messages
- Review SendGrid email logs for delivery issues
- Test email delivery using SendGrid's test tool

---

## 14. Cost Estimate

### Estimated Monthly Costs:
- **Domain Name**: $10-15/year (~$1.25/month)
- **SSL Certificate**: FREE (Let's Encrypt)
- **SendGrid**: FREE (up to 100 emails/day)
- **Hosting**: 
  - Shared: $3-10/month
  - VPS: $5-20/month
  - Cloud: $10-50/month

**Total**: As low as $4-12/month for a small to medium deployment

---

## 15. Final Notes

### Before Going Live:
1. **Test everything thoroughly** in a staging environment first
2. **Backup your local database** before importing to production
3. **Keep your API keys secure** - never commit them to Git
4. **Set APP_DEBUG=false** - this is critical for security
5. **Monitor the system** for the first few days after launch

### When Ready to Deploy:
1. Follow this guide step by step
2. Don't skip the security checklist
3. Test email functionality immediately after deployment
4. Set up automated backups
5. Monitor error logs regularly

### Need More Help?
Refer to the documentation files in your project:
- `DATABASE_SCHEMA.md` - Database structure
- `API_ENDPOINTS_REFERENCE.docx` - API documentation
- `USER_MANAGEMENT_FEATURES.md` - User management guide
- `ADD_USER_AND_PERMISSIONS_FIX.md` - User & permissions setup

---

**Good luck with your deployment! 🚀**

Last Updated: October 1, 2025
