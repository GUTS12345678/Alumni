# 2FA Quick Test Guide

## 🚀 Quick Start Testing

### Prerequisites:
```bash
# 1. Ensure migration is run
php artisan migrate:status

# 2. Build frontend
npm run build

# 3. Start server
php artisan serve
```

---

## 📧 Testing Gmail OTP (End-to-End)

### Step 1: Configure Email (First Time Only)
Edit `.env`:
```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-16-char-app-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=your-email@gmail.com
MAIL_FROM_NAME="Alumni Tracer System"
```

### Step 2: Test Email Configuration
```bash
php artisan tinker
Mail::raw('Test OTP System', function($m) {
    $m->to('your-test-email@gmail.com')
      ->subject('Test Email');
});
# Check if email received
exit
```

### Step 3: Enable 2FA for Test User
```bash
php artisan tinker
$user = User::where('role', 'admin')->first();
$user->gmail_otp_enabled = true;
$user->save();
echo "2FA enabled for: " . $user->email;
exit
```

### Step 4: Test Login Flow
1. Visit: `http://localhost:8000/login`
2. Click "Administrator"
3. Enter admin credentials
4. Toggle "Gmail OTP" ON
5. Click "Sign In"
6. Wait for message: "An OTP code has been sent to your email"
7. Check email inbox (may take 10-30 seconds)
8. Copy 6-digit OTP from email
9. Paste into "OTP Code" field
10. Click "Sign In" again
11. ✅ Successfully logged in!

---

## 🔐 Testing Google Authenticator

### Step 1: Generate Secret for User
```bash
php artisan tinker
$user = User::where('role', 'admin')->first();
$secret = $user->setupGoogleAuth();
echo "Secret: " . $secret;

# Generate QR code URL
$google2fa = app(\PragmaRX\Google2FA\Google2FA::class);
$qrUrl = $google2fa->getQRCodeUrl(
    'Alumni Tracer System',
    $user->email,
    $secret
);
echo "\nQR Code URL: " . $qrUrl;
exit
```

### Step 2: Set Up Authenticator App
1. Copy the QR Code URL from terminal
2. Paste in browser to see QR code
3. Open Google Authenticator app on phone
4. Tap "+" → "Scan QR Code"
5. Scan the displayed QR code
6. App will show 6-digit TOTP code

### Step 3: Enable and Test
```bash
php artisan tinker
$user = User::where('role', 'admin')->first();
$user->google_auth_enabled = true;
$user->save();
echo "Google Auth enabled for: " . $user->email;
exit
```

### Step 4: Login with TOTP
1. Visit: `http://localhost:8000/login`
2. Click "Administrator"
3. Enter admin credentials
4. Toggle "Google Authenticator" ON
5. Click "Sign In"
6. Wait for message: "Please enter your Google Authenticator code"
7. Open Google Authenticator app
8. Copy current 6-digit code
9. Paste into "OTP Code" field
10. Click "Sign In" again
11. ✅ Successfully logged in!

---

## 🧪 Quick Tests

### Test 1: Invalid OTP
```
1. Request OTP via email
2. Enter wrong code (e.g., 000000)
3. Expected: "Invalid or expired OTP code"
```

### Test 2: Expired OTP
```
1. Request OTP via email
2. Wait 6 minutes
3. Enter the OTP code
4. Expected: "Invalid or expired OTP code"
```

### Test 3: Alumni Cannot Use 2FA
```
1. Select "Alumni" user type
2. Expected: No 2FA toggles visible
```

### Test 4: Admin Sees 2FA
```
1. Select "Administrator" user type
2. Expected: 2FA section with both toggles visible
```

### Test 5: OTP Input Toggle
```
1. Enable Gmail OTP toggle
2. Expected: OTP input field appears
3. Disable toggle
4. Expected: OTP input field disappears
```

---

## 🔍 Debugging Commands

### Check User's 2FA Status
```bash
php artisan tinker
$user = User::find(1);
echo "Gmail OTP: " . ($user->gmail_otp_enabled ? 'ON' : 'OFF');
echo "\nGoogle Auth: " . ($user->google_auth_enabled ? 'ON' : 'OFF');
echo "\nHas Secret: " . ($user->google_auth_secret ? 'YES' : 'NO');
exit
```

### Manually Generate OTP
```bash
php artisan tinker
$user = User::find(1);
$otp = $user->generateOTP();
echo "OTP: " . $otp;
echo "\nExpires: " . $user->otp_expires_at;
exit
```

### Verify OTP Code
```bash
php artisan tinker
$user = User::find(1);
$isValid = $user->verifyOTP('123456');
echo $isValid ? 'VALID' : 'INVALID';
exit
```

### Clear OTP Data
```bash
php artisan tinker
$user = User::find(1);
$user->clearOTP();
echo "OTP cleared";
exit
```

### Check Email Queue
```bash
# If using queue for emails
php artisan queue:work --once

# Check failed jobs
php artisan queue:failed
```

---

## 🐛 Common Issues & Fixes

### Issue: Email Not Received
```bash
# Test SMTP connection
php artisan tinker
Mail::raw('Test', fn($m) => $m->to('test@example.com')->subject('Test'));

# Check logs
tail -f storage/logs/laravel.log
```
**Fix**: 
- Verify SMTP settings in `.env`
- Check spam folder
- Ensure Gmail App Password is correct

### Issue: "Please set up Google Authenticator first"
```bash
# Generate secret
php artisan tinker
$user = User::find(1);
$user->setupGoogleAuth();
echo "Secret set!";
exit
```

### Issue: Google Auth Code Always Invalid
**Fix**:
- Check server time: `date`
- Sync phone time
- Verify secret in database
- Regenerate secret and re-scan QR

### Issue: OTP Expired Immediately
**Fix**:
- Check timezone in `config/app.php`
- Verify database timezone matches server
- Run: `php artisan config:clear`

---

## 📊 Test Results Template

```
✅ PASSED | ❌ FAILED | ⏭️ SKIPPED

[ ] Email configuration
[ ] Email sending test
[ ] Gmail OTP generation
[ ] Gmail OTP email delivery
[ ] Gmail OTP verification (valid)
[ ] Gmail OTP verification (invalid)
[ ] Gmail OTP expiration (6+ min)
[ ] Google Auth secret generation
[ ] Google Auth QR code display
[ ] Google Auth TOTP verification (valid)
[ ] Google Auth TOTP verification (invalid)
[ ] 2FA toggles (admin only)
[ ] OTP input show/hide
[ ] Alumni cannot access 2FA
[ ] Admin can access 2FA
[ ] Error messages display
[ ] Loading states work
[ ] Session management
[ ] Rate limiting
[ ] CSRF protection
```

---

## 🎯 One-Command Tests

### Reset 2FA for User
```bash
php artisan tinker
$user = User::find(1);
$user->gmail_otp_enabled = false;
$user->google_auth_enabled = false;
$user->google_auth_secret = null;
$user->clearOTP();
$user->save();
echo "2FA reset complete!";
exit
```

### Enable All 2FA for User
```bash
php artisan tinker
$user = User::find(1);
$user->gmail_otp_enabled = true;
$secret = $user->setupGoogleAuth();
$user->google_auth_enabled = true;
$user->save();
echo "2FA fully enabled!\nSecret: " . $secret;
exit
```

### Get QR Code for User
```bash
php artisan tinker
$user = User::find(1);
if (!$user->google_auth_secret) $user->setupGoogleAuth();
$g2fa = app(\PragmaRX\Google2FA\Google2FA::class);
echo $g2fa->getQRCodeUrl('Alumni Tracer', $user->email, $user->google_auth_secret);
exit
```

---

## 💾 Database Queries

### Check 2FA-Enabled Users
```sql
SELECT id, name, email, gmail_otp_enabled, google_auth_enabled 
FROM users 
WHERE gmail_otp_enabled = 1 OR google_auth_enabled = 1;
```

### Users with Active OTP
```sql
SELECT id, name, email, otp_code, otp_expires_at 
FROM users 
WHERE otp_code IS NOT NULL 
AND otp_expires_at > NOW();
```

### Clear All OTPs
```sql
UPDATE users 
SET otp_code = NULL, otp_expires_at = NULL 
WHERE otp_code IS NOT NULL;
```

---

## 📱 Mobile Testing

### Test on Phone Browser
1. Get local IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. Update `.env`: `APP_URL=http://192.168.x.x:8000`
3. Restart server: `php artisan serve --host=0.0.0.0`
4. Visit on phone: `http://192.168.x.x:8000/login`
5. Test responsive design and touch interactions

---

## 🎬 Demo Script

```
1. "Let me show you the 2FA system..."
2. Navigate to login page
3. "We have Alumni and Admin options"
4. Click Administrator
5. "Notice the 2FA section - only admins see this"
6. Enter credentials
7. Toggle Gmail OTP
8. "Watch how the OTP field appears"
9. Click Sign In
10. "Email is being sent... let's check"
11. Open email, show beautiful template
12. Copy OTP code
13. Paste into field
14. Click Sign In again
15. "And we're in! Secure and easy."
```

---

**Quick Reference**: Keep this file open while testing!  
**Documentation**: See `TWO_FACTOR_AUTHENTICATION_GUIDE.md` for full details  
**Support**: Check Laravel logs in `storage/logs/laravel.log`
