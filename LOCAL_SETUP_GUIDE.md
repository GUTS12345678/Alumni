# 🏠 Local Setup Guide (XAMPP/WAMP Testing)

This guide helps you test the deployment package on your local machine before uploading to a server.

---

## ✅ Prerequisites
- XAMPP or WAMP installed
- Composer installed ([getcomposer.org](https://getcomposer.org))

---

## 📦 Step-by-Step Setup

### Step 1: Extract Files
1. Extract `alumni_tracer_deployment_XXXXXXXX.zip`
2. Move the extracted folder to: `C:\xampp\htdocs\alumni_tracer`

### Step 2: Install PHP Dependencies
Open PowerShell/Command Prompt:
```cmd
cd C:\xampp\htdocs\alumni_tracer
composer install
```
⏳ This will take 2-3 minutes to download all dependencies.

### Step 3: Create Database
1. Start XAMPP (Apache + MySQL)
2. Open browser: `http://localhost/phpmyadmin`
3. Click **"New"** in left sidebar
4. Database name: `alumni_tracer_local`
5. Collation: `utf8mb4_unicode_ci`
6. Click **"Create"**

### Step 4: Setup Environment File
In PowerShell/CMD (inside `C:\xampp\htdocs\alumni_tracer`):
```cmd
copy .env.example .env
```

Open `.env` file in any text editor and update these lines:
```env
APP_NAME="Alumni Tracer System"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost/alumni_tracer

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=alumni_tracer_local
DB_USERNAME=root
DB_PASSWORD=

MAIL_MAILER=log
```
💡 **Note:** Leave `DB_PASSWORD` empty for default XAMPP setup

### Step 5: Generate Application Key
```cmd
php artisan key:generate
```
✅ Expected output: `Application key set successfully.`

### Step 6: Run Database Migrations
```cmd
php artisan migrate
```
✅ Expected output: List of migrations with "DONE" status

### Step 7: Create Storage Link
```cmd
php artisan storage:link
```
✅ Expected output: `The [public/storage] link has been connected to [storage/app/public]`

### Step 8: Create Admin User
```cmd
php artisan tinker
```

Paste this code and press Enter:
```php
$user = new \App\Models\User();
$user->name = 'Admin User';
$user->email = 'admin@test.com';
$user->password = bcrypt('admin123');
$user->role_id = 1;
$user->status = 'active';
$user->email_verified_at = now();
$user->save();
exit;
```
✅ Expected output: User object details

### Step 9: Access the Application
1. Ensure XAMPP Apache is running
2. Open browser and visit: **http://localhost/alumni_tracer/public**
3. Login with:
   - **Email:** `admin@test.com`
   - **Password:** `admin123`

---

## 🎯 Quick Test Checklist
After logging in, verify these features work:
- [ ] Dashboard loads without errors
- [ ] Can navigate to Alumni Management
- [ ] Can view Surveys section
- [ ] Can access Settings
- [ ] Email logs appear in `storage/logs/laravel.log`

---

## ⚠️ Troubleshooting

### "Composer not found"
Download and install from: https://getcomposer.org/download/

### "Class 'App\Models\User' not found"
Run:
```cmd
composer dump-autoload
```

### "SQLSTATE[HY000] [1049] Unknown database"
- Check database name in `.env` matches the one you created in phpMyAdmin
- Ensure MySQL is running in XAMPP Control Panel

### "403 Forbidden" or blank page
Make sure you're accessing: `http://localhost/alumni_tracer/public` (not just `/alumni_tracer`)

### "The stream or file could not be opened"
Run:
```cmd
mkdir storage\logs
mkdir storage\framework\cache
mkdir storage\framework\sessions
mkdir storage\framework\views
```

### Migration errors
If you see "table already exists":
1. Drop database in phpMyAdmin
2. Create new database
3. Run `php artisan migrate` again

---

## 🚀 Alternative: Using Laravel's Built-in Server

Instead of XAMPP, you can use Laravel's development server:

```cmd
cd C:\xampp\htdocs\alumni_tracer
php artisan serve
```

Then visit: **http://127.0.0.1:8000**

💡 This method doesn't require configuring Apache virtual hosts.

---

## 📝 Default Login Credentials

**Email:** `admin@test.com`  
**Password:** `admin123`

⚠️ **Important:** Change these credentials after first login!

---

## 🔄 Reset Everything (Fresh Start)

If you want to start over:
```cmd
# Drop database in phpMyAdmin and recreate it
php artisan migrate:fresh
php artisan storage:link
# Then run Step 8 again to create admin user
```

---

## ✅ Success Indicators

Your setup is successful when:
1. ✅ No errors during `composer install`
2. ✅ Migrations run without "table exists" errors
3. ✅ Login page loads at `/public`
4. ✅ Can login with admin credentials
5. ✅ Dashboard displays without console errors

---

## 📚 Next Steps

Once local testing is successful:
- Use the same package for server deployment
- Follow **DEPLOYMENT_GUIDE.md** for production server setup
- Main differences: production uses real domain, HTTPS, and proper email server
