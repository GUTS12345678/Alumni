# 2FA Setup Guide - Email OTP & Google Authenticator

## 🎯 Complete Setup Instructions

This guide will show you how to set up Two-Factor Authentication for your admin account using both Email OTP and Google Authenticator methods.

---

## 📧 Part 1: Email OTP Setup

### What You Need:
- Admin account access
- Access to your email inbox
- Gmail SMTP configuration (for sending emails)

### Step 1: Configure Email Settings (One-time Setup)

Edit your `.env` file:

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-gmail-app-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=your-email@gmail.com
MAIL_FROM_NAME="Alumni Tracer System"
```

### Step 2: Get Gmail App Password

1. Go to your **Google Account** → https://myaccount.google.com/
2. Click **Security** (left sidebar)
3. Under "How you sign in to Google", enable **2-Step Verification**
4. After enabling 2FA, go back to **Security**
5. Click **App passwords** (appears after 2FA is enabled)
6. Select:
   - **App**: Mail
   - **Device**: Select your computer or "Other" and name it "Alumni Tracer"
7. Click **Generate**
8. Copy the **16-character password** (e.g., `abcd efgh ijkl mnop`)
9. Paste it in `.env` as `MAIL_PASSWORD` (remove spaces: `abcdefghijklmnop`)

### Step 3: Test Email Configuration

```bash
php artisan tinker

# Send test email
Mail::raw('Test Email from Alumni Tracer', function($message) {
    $message->to('your-email@example.com')
            ->subject('Test Email');
});

# Check if any errors appeared
# Then check your inbox
exit
```

### Step 4: Enable Email OTP for Your Account

**Option A: Via Web Interface (Recommended)**

1. Log in to admin panel
2. Go to **System** → **2FA Settings** in the sidebar
3. Find the **Email OTP** section
4. Toggle the switch **ON**
5. ✅ Done! You'll see a green success message

**Option B: Via Command Line**

```bash
php artisan tinker

$user = User::where('email', 'your-admin-email@example.com')->first();
$user->gmail_otp_enabled = true;
$user->save();
echo "Email OTP enabled for: " . $user->email;

exit
```

### Step 5: Test Email OTP Login

1. Log out of admin panel
2. Go to login page
3. Select "Administrator"
4. Enter your email and password
5. Toggle **"Email OTP"** ON
6. Click **"Send OTP to Email"** button
7. Check your email inbox (may take 10-30 seconds)
8. Open the email and copy the **6-digit code**
9. Enter the code in the OTP input field
10. It will auto-submit when you enter the 6th digit
11. ✅ Successfully logged in with Email OTP!

---

## 🔐 Part 2: Google Authenticator Setup

### What You Need:
- Admin account access
- A smartphone with one of these apps:
  - **Google Authenticator** (iOS/Android)
  - **Microsoft Authenticator** (iOS/Android)
  - **Authy** (iOS/Android/Desktop)
  - **1Password** (cross-platform)

### Step 1: Install Authenticator App

Download one of these apps on your smartphone:

**iOS (App Store):**
- Google Authenticator
- Microsoft Authenticator
- Authy

**Android (Play Store):**
- Google Authenticator
- Microsoft Authenticator
- Authy

### Step 2: Set Up Google Authenticator via Web Interface

1. Log in to admin panel
2. Go to **System** → **2FA Settings** in the sidebar
3. Find the **Google Authenticator** section
4. Click **"Set Up Google Authenticator"** button
5. You'll see:
   - A **QR Code** (large square code)
   - A **Secret Key** (text string like `ABCD1234EFGH5678`)

### Step 3: Scan QR Code with Your App

1. Open your authenticator app on your phone
2. Tap **"+"** or **"Add account"**
3. Select **"Scan QR code"** or **"Scan barcode"**
4. Point your camera at the QR code on screen
5. The app will add "Alumni Tracer System (your-email@example.com)"
6. You'll see a **6-digit code** that changes every 30 seconds

**Alternative: Manual Entry**
If you can't scan the QR code:
1. Click **"Show"** to reveal the secret key
2. Tap **"Enter setup key"** in your app
3. Enter:
   - **Account name**: Alumni Tracer System
   - **Your email**: your-email@example.com
   - **Key**: The secret key from the screen
4. Tap **"Add"**

### Step 4: Verify Setup

1. Look at your authenticator app
2. Copy the current **6-digit code** (e.g., `123456`)
3. Enter it in the "Enter the 6-digit code from your app to verify" field
4. Click **"Verify & Enable"** button
5. ✅ Success! Google Authenticator is now enabled

**You'll also see 10 backup codes** - copy or download these! You can use them if you lose your phone.

### Step 5: Test Google Authenticator Login

1. Log out of admin panel
2. Go to login page
3. Select "Administrator"
4. Enter your email and password
5. Toggle **"Google Authenticator"** ON
6. OTP input field appears immediately
7. Open your authenticator app
8. Look at the current 6-digit code for "Alumni Tracer System"
9. Enter the code quickly (it expires every 30 seconds!)
10. It will auto-submit when you enter the 6th digit
11. ✅ Successfully logged in with Google Authenticator!

---

## 🔄 Managing Your 2FA Settings

### Accessing 2FA Settings Page

1. Log in to admin panel
2. Click **"System"** in the left sidebar
3. Click **"2FA Settings"**
4. You'll see both Email OTP and Google Authenticator sections

### Disable Email OTP

1. Go to **2FA Settings** page
2. Find **Email OTP** section
3. Toggle the switch **OFF**
4. Confirm the action
5. ✅ Email OTP is now disabled

### Disable Google Authenticator

1. Go to **2FA Settings** page
2. Find **Google Authenticator** section
3. Toggle the switch **OFF**
4. Confirm "Are you sure?"
5. ✅ Google Authenticator is now disabled
6. Your authenticator app still has the entry, but it won't work for login

### Re-enable Google Authenticator

If you disabled Google Auth but didn't delete the app entry:
1. Go to **2FA Settings** page
2. Toggle **Google Authenticator** switch **ON**
3. ✅ Re-enabled! Use the same code from your app

If you need to set up from scratch:
1. Delete the old entry from your authenticator app
2. Click **"Set Up Google Authenticator"** again
3. Scan the new QR code
4. Verify with a new code

---

## 📱 Using 2FA at Login

### Rule: Only ONE 2FA method at a time!

When you toggle one method ON, the other automatically turns OFF.

### Login with Email OTP:

```
1. Select "Administrator" on login page
2. Enter email and password
3. Toggle "Email OTP" ON
4. Click "Send OTP to Email" button
5. Wait for email (10-30 seconds)
6. Open email and copy 6-digit code
7. Enter code in OTP field
8. Auto-submits on 6th digit
9. ✅ Logged in!
```

### Login with Google Authenticator:

```
1. Select "Administrator" on login page
2. Enter email and password
3. Toggle "Google Authenticator" ON
4. OTP input appears immediately
5. Open authenticator app on phone
6. Copy the current 6-digit code
7. Enter code in OTP field
8. Auto-submits on 6th digit
9. ✅ Logged in!
```

---

## 🆘 Troubleshooting

### Email OTP Issues

**Problem: OTP email not received**

Solutions:
1. Check spam/junk folder
2. Verify SMTP settings in `.env`
3. Test email config: `php artisan tinker` → Send test mail
4. Check if Gmail App Password is correct (16 characters, no spaces)
5. Verify SMTP port 587 is not blocked by firewall

**Problem: OTP expired**

- OTP codes expire after **5 minutes**
- Click "Resend OTP" to get a new code
- Check server timezone matches database timezone

**Problem: OTP always invalid**

- Make sure you're entering the latest code
- Don't reuse old codes (one-time use only)
- Clear browser cache and cookies

### Google Authenticator Issues

**Problem: Code always invalid**

Solutions:
1. **Check time sync**:
   - Android: Settings → System → Date & time → Use network-provided time
   - iOS: Settings → General → Date & Time → Set Automatically
2. Server time must be accurate
3. Try the next code (wait 30 seconds)
4. Re-scan QR code

**Problem: Lost phone / Can't access authenticator app**

Solutions:
1. Use **backup codes** (if you saved them)
2. Contact system administrator to disable 2FA
3. Manual database reset: `php artisan tinker`
   ```php
   $user = User::find(YOUR_ID);
   $user->google_auth_enabled = false;
   $user->save();
   ```

**Problem: QR code not displaying**

- Check if bacon/bacon-qr-code package is installed: `composer require bacon/bacon-qr-code`
- Clear cache: `php artisan config:clear`
- Check browser console for JavaScript errors

---

## 💾 Backup Codes

When you set up Google Authenticator, you receive **10 backup codes**. These are important!

### What are backup codes?
- One-time use codes you can use instead of the authenticator app
- Use them if you lose your phone
- Each code can only be used once

### How to save backup codes:
1. **Copy to clipboard**: Click "Copy Codes" button
2. **Download as file**: Click "Download" button → saves as `alumni-tracer-backup-codes.txt`
3. **Screenshot**: Take a screenshot and store securely
4. **Print**: Print and store in a safe place

### Using a backup code:
1. On login page, toggle "Google Authenticator" ON
2. Instead of app code, enter one of your backup codes
3. Login successful!
4. ⚠️ That code is now used and won't work again

---

## 🔒 Security Best Practices

### For Email OTP:
✅ Use a secure email account with strong password  
✅ Enable 2FA on your email account itself  
✅ Don't share OTP codes with anyone  
✅ Check "From" address before trusting OTP emails  
✅ Report suspicious emails to administrator  

### For Google Authenticator:
✅ Keep your phone locked with PIN/biometric  
✅ Back up your authenticator to cloud (if app supports it)  
✅ Save backup codes in a safe place  
✅ Don't screenshot QR codes and share them  
✅ Set up on multiple devices if possible  

### General:
✅ Use strong, unique passwords  
✅ Log out from shared computers  
✅ Don't save login credentials in browser on public PCs  
✅ Regularly review activity logs  
✅ Update email/phone if they change  

---

## 📊 Quick Reference

| Feature | Email OTP | Google Authenticator |
|---------|-----------|---------------------|
| **Setup Time** | 5 minutes | 5 minutes |
| **Requires** | Email access | Smartphone |
| **Code Delivery** | Email (30 sec) | Instant (app) |
| **Code Expires** | 5 minutes | 30 seconds |
| **Works Offline** | No | Yes |
| **Backup Codes** | No | Yes (10 codes) |
| **Lost Access** | Request new OTP | Use backup code |

---

## 🎯 Admin Commands Reference

### Enable Email OTP for User:
```bash
php artisan tinker
$user = User::where('email', 'admin@example.com')->first();
$user->gmail_otp_enabled = true;
$user->save();
exit
```

### Enable Google Auth for User:
```bash
php artisan tinker
$user = User::where('email', 'admin@example.com')->first();
$secret = $user->setupGoogleAuth();
echo "Secret: $secret\n";
$user->google_auth_enabled = true;
$user->save();
exit
```

### Check User's 2FA Status:
```bash
php artisan tinker
$user = User::where('email', 'admin@example.com')->first();
echo "Email OTP: " . ($user->gmail_otp_enabled ? 'ON' : 'OFF') . "\n";
echo "Google Auth: " . ($user->google_auth_enabled ? 'ON' : 'OFF') . "\n";
echo "Has Secret: " . ($user->google_auth_secret ? 'YES' : 'NO') . "\n";
exit
```

### Disable All 2FA for User (Emergency):
```bash
php artisan tinker
$user = User::where('email', 'admin@example.com')->first();
$user->gmail_otp_enabled = false;
$user->google_auth_enabled = false;
$user->google_auth_secret = null;
$user->clearOTP();
$user->save();
echo "All 2FA disabled\n";
exit
```

---

## 🎬 Video Tutorial Outline

If you need to create a tutorial, follow this flow:

1. **Introduction** (30 sec)
   - What is 2FA and why it's important
   
2. **Email OTP Setup** (2 min)
   - Configure Gmail App Password
   - Enable via 2FA Settings page
   - Test login flow
   
3. **Google Authenticator Setup** (2 min)
   - Install app on phone
   - Scan QR code
   - Verify and save backup codes
   - Test login flow
   
4. **Managing 2FA** (1 min)
   - Toggle on/off
   - Switch between methods
   - View backup codes
   
5. **Troubleshooting** (1 min)
   - Time sync issues
   - Lost phone scenario
   - Using backup codes

---

## ✅ Setup Checklist

### Email OTP Setup:
- [ ] Gmail App Password obtained
- [ ] `.env` configured with SMTP settings
- [ ] Test email sent successfully
- [ ] Email OTP enabled for account
- [ ] Test login with OTP successful

### Google Authenticator Setup:
- [ ] Authenticator app installed on phone
- [ ] QR code scanned successfully
- [ ] Account added to app
- [ ] Verification code tested
- [ ] Backup codes saved securely
- [ ] Test login with authenticator successful

### Post-Setup:
- [ ] Backup codes stored safely
- [ ] Email and phone number updated
- [ ] 2FA preferences saved
- [ ] Other admins notified of 2FA requirement
- [ ] Emergency access procedure documented

---

**Questions?** Contact your system administrator or refer to:
- `docs/TWO_FACTOR_AUTHENTICATION_GUIDE.md` - Technical documentation
- `docs/2FA_UX_IMPROVEMENTS.md` - UI/UX details
- `docs/2FA_QUICK_TEST_GUIDE.md` - Testing procedures

**Last Updated**: November 12, 2025  
**Version**: 1.0.0
