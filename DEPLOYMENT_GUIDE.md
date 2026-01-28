# Alumni Tracer System - Deployment Guide

## 📋 Prerequisites
- PHP 8.2 or higher
- MySQL 5.7 or higher
- Composer installed
- Web server (Apache/Nginx)

---

## 🚀 Fresh Installation Steps

### 1. Extract Files
Extract the zip file to your desired location (e.g., `C:\xampp\htdocs\alumni_tracer`)

### 2. Install Dependencies
Open terminal/command prompt and navigate to the extracted folder:
```bash
cd path/to/alumni_tracer
composer install --no-dev --optimize-autoloader
```

### 3. Create Database
Create a new MySQL database using phpMyAdmin or command line:
```sql
CREATE DATABASE alumni_tracer CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Configure Environment
Copy the example environment file:
```bash
copy .env.example .env
```

Edit `.env` file and update these settings:
```env
APP_NAME="Alumni Tracer System"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-domain.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=alumni_tracer
DB_USERNAME=your_db_username
DB_PASSWORD=your_db_password

MAIL_MAILER=smtp
MAIL_HOST=smtp.your-provider.com
MAIL_PORT=587
MAIL_USERNAME=your_email@domain.com
MAIL_PASSWORD=your_email_password
MAIL_FROM_ADDRESS="noreply@your-domain.com"
MAIL_ENCRYPTION=tls
```

### 5. Generate Application Key
```bash
php artisan key:generate
```

### 6. Run Database Migrations
```bash
php artisan migrate --force
```

### 7. Create Storage Link
```bash
php artisan storage:link
```

### 8. Set Permissions (Linux/Mac)
```bash
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
```

For Windows (XAMPP), ensure the web server has write access to `storage/` and `bootstrap/cache/`

### 9. Create Super Admin User
Run tinker:
```bash
php artisan tinker
```

Then paste this code:
```php
$user = new \App\Models\User();
$user->name = 'Super Admin';
$user->email = 'admin@yourdomain.com';
$user->password = bcrypt('your_secure_password');
$user->role_id = 1;
$user->status = 'active';
$user->email_verified_at = now();
$user->save();
exit;
```

### 10. Optimize for Production
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### 11. Configure Web Server
Point your web server's document root to the `public/` directory.

**Apache (.htaccess already included)**

**Nginx example:**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/alumni_tracer/public;

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

### 12. Test the Application
Visit your domain and login with the admin credentials you created.

---

## 🔧 Local Development Setup (XAMPP/WAMP)

### 1. Extract to htdocs
Extract zip to: `C:\xampp\htdocs\alumni_tracer`

### 2. Install Dependencies
```cmd
cd C:\xampp\htdocs\alumni_tracer
composer install
```

### 3. Create Database
- Open phpMyAdmin: http://localhost/phpmyadmin
- Click "New" → Database name: `alumni_tracer` → Create

### 4. Configure .env
```cmd
copy .env.example .env
```

Edit `.env`:
```env
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost/alumni_tracer

DB_DATABASE=alumni_tracer
DB_USERNAME=root
DB_PASSWORD=

MAIL_MAILER=log
```

### 5. Setup Application
```cmd
php artisan key:generate
php artisan migrate
php artisan storage:link
```

### 6. Create Admin User
```cmd
php artisan tinker
```
```php
$user = new \App\Models\User();
$user->name = 'Admin';
$user->email = 'admin@test.com';
$user->password = bcrypt('password123');
$user->role_id = 1;
$user->status = 'active';
$user->email_verified_at = now();
$user->save();
exit;
```

### 7. Access Application
Visit: http://localhost/alumni_tracer/public
Login: `admin@test.com` / `password123`

---

## ⚠️ Troubleshooting

### "Class not found" errors
```bash
composer dump-autoload
```

### "Permission denied" errors
Ensure storage and cache folders are writable

### Database connection failed
- Check database credentials in `.env`
- Ensure MySQL service is running
- Verify database exists

### 500 Error
- Check `storage/logs/laravel.log`
- Ensure `.env` file exists
- Run `php artisan config:clear`

---

## 🔐 Security Checklist

- [ ] Change default admin password
- [ ] Set `APP_DEBUG=false` in production
- [ ] Use strong database password
- [ ] Configure HTTPS/SSL certificate
- [ ] Set up regular database backups
- [ ] Configure proper file permissions
- [ ] Enable CSRF protection (already enabled)
- [ ] Configure rate limiting (already enabled)

---

## 📧 Support

For issues or questions, check the logs in `storage/logs/laravel.log`
