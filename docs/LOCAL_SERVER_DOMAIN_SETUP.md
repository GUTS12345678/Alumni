# Local Server with Custom Domain Setup Guide

## Overview
This guide explains how to run a Laravel application on a local XAMPP server while using a custom domain (like `akndev.tech`) instead of `localhost`.

---

## Current Setup
- **Local Server**: XAMPP (Apache + MySQL)
- **Domain**: `akndev.tech`
- **Application**: Alumni Tracer System (Laravel 11 + React + Inertia.js)
- **Access**: Same PC hosts both server and accesses via browser

---

## Step-by-Step Setup

### 1. Install and Configure XAMPP

#### Installation
1. Download XAMPP from [https://www.apachefriends.org](https://www.apachefriends.org)
2. Install to `C:\xampp` (default location)
3. Start Apache and MySQL services from XAMPP Control Panel

#### Verify Installation
- Apache should run on port **80** (HTTP) and **443** (HTTPS)
- MySQL should run on port **3306**
- Test by visiting: `http://localhost` - should show XAMPP welcome page

---

### 2. Configure Virtual Host for Custom Domain

#### Edit Apache Configuration
Open `C:\xampp\apache\conf\extra\httpd-vhosts.conf` and add:

```apache
# Local development virtual host for akndev.tech
<VirtualHost *:80>
    ServerName akndev.tech
    ServerAlias www.akndev.tech
    DocumentRoot "C:/xampp/htdocs/public"
    
    <Directory "C:/xampp/htdocs/public">
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    
    ErrorLog "logs/akndev.tech-error.log"
    CustomLog "logs/akndev.tech-access.log" common
</VirtualHost>

# Keep default localhost
<VirtualHost *:80>
    ServerName localhost
    DocumentRoot "C:/xampp/htdocs"
    
    <Directory "C:/xampp/htdocs">
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

#### Enable Virtual Hosts in Apache
Edit `C:\xampp\apache\conf\httpd.conf` and ensure this line is **uncommented**:

```apache
Include conf/extra/httpd-vhosts.conf
```

Also ensure `mod_rewrite` is enabled:

```apache
LoadModule rewrite_module modules/mod_rewrite.so
```

---

### 3. Configure Windows Hosts File

#### Edit Hosts File
1. Open Notepad as **Administrator**
2. File → Open → Navigate to: `C:\Windows\System32\drivers\etc\hosts`
3. Add these lines at the end:

```
127.0.0.1       akndev.tech
127.0.0.1       www.akndev.tech
```

4. Save the file
5. Flush DNS cache:
   ```cmd
   ipconfig /flushdns
   ```

---

### 4. Configure Laravel Application

#### Update `.env` File
Set your domain in the `.env` file:

```env
APP_NAME="Alumni Tracer System"
APP_ENV=local
APP_KEY=base64:YOUR_APP_KEY_HERE
APP_DEBUG=true
APP_URL=http://akndev.tech

# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=alumni_tracer_system
DB_USERNAME=root
DB_PASSWORD=

# Session
SESSION_DRIVER=database
SESSION_DOMAIN=.akndev.tech

# Sanctum
SANCTUM_STATEFUL_DOMAINS=akndev.tech,www.akndev.tech
```

#### Update CORS Configuration
Edit `config/cors.php`:

```php
'allowed_origins' => ['http://akndev.tech', 'http://www.akndev.tech'],
'supports_credentials' => true,
```

#### Update Session Configuration
Edit `config/session.php`:

```php
'domain' => env('SESSION_DOMAIN', '.akndev.tech'),
'secure' => env('SESSION_SECURE_COOKIE', false),
'same_site' => 'lax',
```

---

### 5. Restart Services

1. Stop Apache in XAMPP Control Panel
2. Start Apache again
3. Clear Laravel caches:
   ```bash
   php artisan config:clear
   php artisan cache:clear
   php artisan route:clear
   php artisan view:clear
   ```

---

### 6. Test the Setup

1. Open browser and navigate to: `http://akndev.tech`
2. You should see the Alumni Tracer System homepage
3. Test login and registration
4. Verify database connections work

---

## Using Cloudflare Tunnel (Optional - For External Access)

If you want to access your local server from the internet using a real domain:

### Install Cloudflare Tunnel

1. **Install cloudflared**
   - Download from: [https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation)
   - Install to a folder (e.g., `C:\cloudflared\`)

2. **Login to Cloudflare**
   ```cmd
   cloudflared tunnel login
   ```

3. **Create a Tunnel**
   ```cmd
   cloudflared tunnel create alumni-tracer
   ```

4. **Configure the Tunnel**
   Create `config.yml`:
   ```yaml
   tunnel: <YOUR_TUNNEL_ID>
   credentials-file: C:\cloudflared\<YOUR_TUNNEL_ID>.json

   ingress:
     - hostname: akndev.tech
       service: http://localhost:80
     - service: http_status:404
   ```

5. **Route DNS**
   ```cmd
   cloudflared tunnel route dns alumni-tracer akndev.tech
   ```

6. **Run the Tunnel**
   ```cmd
   cloudflared tunnel run alumni-tracer
   ```

### Make Tunnel Run on Startup (Windows)

1. Create a batch file: `C:\cloudflared\start-tunnel.bat`
   ```batch
   @echo off
   cd C:\cloudflared
   cloudflared tunnel run alumni-tracer
   ```

2. Create a Windows Task Scheduler task:
   - Open Task Scheduler
   - Create Basic Task
   - Name: "Cloudflare Tunnel - Alumni Tracer"
   - Trigger: "When the computer starts"
   - Action: "Start a program"
   - Program: `C:\cloudflared\start-tunnel.bat`
   - Check: "Run with highest privileges"

---

## Troubleshooting

### Apache Won't Start
- **Port 80 in use**: Another service (IIS, Skype) is using port 80
  - Solution: Stop conflicting service or change Apache port in `httpd.conf`
  
- **Permission denied**: Run XAMPP as Administrator

### Domain Not Resolving
- **DNS cache**: Run `ipconfig /flushdns` in Command Prompt
- **Hosts file not saved**: Make sure you saved as Administrator
- **Wrong path**: Verify hosts file is at `C:\Windows\System32\drivers\etc\hosts`

### Laravel Routes Not Working (404 Errors)
- **mod_rewrite not enabled**: Check `httpd.conf` has `LoadModule rewrite_module` uncommented
- **AllowOverride not set**: Ensure `AllowOverride All` in virtual host config
- **.htaccess missing**: Check `public/.htaccess` exists

### CSRF Token Mismatch
- **Domain mismatch**: Ensure `SESSION_DOMAIN` in `.env` matches your domain
- **Clear sessions**: Run `php artisan session:clear`
- **Browser cookies**: Clear browser cookies for the domain

### Database Connection Failed
- **MySQL not running**: Start MySQL in XAMPP Control Panel
- **Wrong credentials**: Check `.env` database settings
- **Database doesn't exist**: Create database in phpMyAdmin

---

## File Structure Reference

```
C:\xampp\
├── apache\
│   └── conf\
│       ├── httpd.conf              # Main Apache config
│       └── extra\
│           └── httpd-vhosts.conf   # Virtual hosts config
├── htdocs\
│   └── (Your Laravel Project)
│       ├── public\                 # DocumentRoot
│       │   ├── index.php
│       │   └── .htaccess
│       ├── .env                    # Environment config
│       └── ...
├── mysql\
│   └── data\                       # Database files
└── phpMyAdmin\                     # Database management

C:\Windows\System32\drivers\etc\
└── hosts                           # Local DNS entries
```

---

## Production Deployment Notes

When deploying to a real server:

1. **Change APP_ENV to production**
   ```env
   APP_ENV=production
   APP_DEBUG=false
   ```

2. **Generate new APP_KEY**
   ```bash
   php artisan key:generate
   ```

3. **Enable HTTPS**
   - Get SSL certificate (Let's Encrypt)
   - Update virtual host for port 443
   - Update `.env`: `APP_URL=https://yourdomain.com`

4. **Optimize Laravel**
   ```bash
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   composer install --optimize-autoloader --no-dev
   ```

5. **Secure MySQL**
   - Set strong root password
   - Create dedicated database user with limited permissions

6. **Configure Firewall**
   - Allow ports 80 (HTTP) and 443 (HTTPS)
   - Block direct MySQL port 3306 from external access

---

## Useful Commands

### Apache
```bash
# Restart Apache (XAMPP)
# Use XAMPP Control Panel Stop/Start buttons

# Test Apache config
C:\xampp\apache\bin\httpd.exe -t

# View error logs
C:\xampp\apache\logs\error.log
```

### Laravel
```bash
# Clear all caches
php artisan optimize:clear

# View routes
php artisan route:list

# Run migrations
php artisan migrate

# Seed database
php artisan db:seed

# Create database backup
php artisan backup:run
```

### Database
```bash
# Access MySQL CLI
C:\xampp\mysql\bin\mysql.exe -u root -p

# Export database
C:\xampp\mysql\bin\mysqldump.exe -u root alumni_tracer_system > backup.sql

# Import database
C:\xampp\mysql\bin\mysql.exe -u root alumni_tracer_system < backup.sql
```

---

## Additional Resources

- **XAMPP Documentation**: [https://www.apachefriends.org/docs/](https://www.apachefriends.org/docs/)
- **Laravel Documentation**: [https://laravel.com/docs](https://laravel.com/docs)
- **Apache Virtual Hosts**: [https://httpd.apache.org/docs/current/vhosts/](https://httpd.apache.org/docs/current/vhosts/)
- **Cloudflare Tunnel Docs**: [https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)

---

## Support & Maintenance

### Regular Maintenance Tasks
- Weekly database backups
- Monthly Laravel dependency updates: `composer update`
- Monitor error logs: `storage/logs/laravel.log`
- Clean up old sessions: `php artisan session:gc`

### Getting Help
- Check Laravel logs: `storage/logs/`
- Check Apache logs: `C:\xampp\apache\logs\`
- Check browser console (F12) for frontend errors

---

**Last Updated**: November 12, 2025  
**System Version**: Alumni Tracer System v1.0  
**Laravel Version**: 11.x  
**PHP Version**: 8.2+
