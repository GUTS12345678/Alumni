# Two-Factor Authentication (2FA) Implementation Guide

## Overview
This document describes the complete implementation of Two-Factor Authentication (2FA) for the Alumni Tracer System, including both Gmail OTP and Google Authenticator options.

## Features Implemented

### 1. **Gmail OTP Authentication**
- 6-digit OTP code generation
- Email delivery with professional template
- 5-minute expiration
- One-time use only
- Automatic cleanup after verification

### 2. **Google Authenticator**
- TOTP (Time-based One-Time Password) support
- QR code generation for easy setup
- Compatible with Google Authenticator, Authy, Microsoft Authenticator, etc.
- Secret key management

### 3. **Admin-Only 2FA**
- 2FA is only available for admin and super_admin roles
- Alumni users cannot enable 2FA (as per requirements)
- Toggle switches on login page for easy activation

## Database Schema

### New Fields Added to `users` Table
```sql
gmail_otp_enabled        BOOLEAN DEFAULT FALSE
google_auth_enabled      BOOLEAN DEFAULT FALSE
google_auth_secret       VARCHAR(255) NULLABLE
otp_code                 VARCHAR(6) NULLABLE
otp_expires_at           TIMESTAMP NULLABLE
```

### Migration File
- `2025_11_12_012809_add_two_factor_auth_to_users_table.php`
- Run with: `php artisan migrate --path=database/migrations/2025_11_12_012809_add_two_factor_auth_to_users_table.php`

## Backend Implementation

### 1. User Model Updates (`app/Models/User.php`)

#### Added to $fillable:
```php
'gmail_otp_enabled',
'google_auth_enabled',
'google_auth_secret',
```

#### Added to $hidden:
```php
'google_auth_secret',
'otp_code',
```

#### Added to casts():
```php
'gmail_otp_enabled' => 'boolean',
'google_auth_enabled' => 'boolean',
'otp_expires_at' => 'datetime',
'last_login_at' => 'datetime',
```

#### New Helper Methods:
- `hasTwoFactorEnabled()` - Check if any 2FA method is enabled
- `generateOTP()` - Generate and save 6-digit OTP
- `verifyOTP($code)` - Verify OTP code and expiration
- `clearOTP()` - Clear OTP data after successful login
- `setupGoogleAuth()` - Generate Google Authenticator secret
- `verifyGoogleAuth($code)` - Verify Google Authenticator TOTP code

### 2. LoginRequest Updates (`app/Http/Requests/Auth/LoginRequest.php`)

#### New Validation Rules:
```php
'use_gmail_otp' => ['sometimes', 'boolean'],
'use_google_authenticator' => ['sometimes', 'boolean'],
'otp_code' => ['sometimes', 'nullable', 'string', 'size:6'],
```

#### Authentication Flow:
1. Verify email and password
2. Check if user wants to enable 2FA for this login
3. Enable 2FA method if requested and not already enabled
4. For Gmail OTP:
   - If no OTP code provided, generate and send OTP via email
   - Logout user and throw ValidationException with status 202
   - If OTP code provided, verify it
   - Clear OTP after successful verification
5. For Google Authenticator:
   - Check if secret is set up (throw error if not)
   - If no code provided, request it with status 202
   - If code provided, verify it using Google2FA package
6. Update last_login_at timestamp
7. Complete authentication with remember token if requested

### 3. OTP Email Service

#### Mailable Class (`app/Mail/OTPMail.php`)
- Subject: "Your Login OTP Code"
- View: `emails.otp`
- Properties: `$otp`, `$userName`

#### Email Template (`resources/views/emails/otp.blade.php`)
Professional HTML email with:
- Gradient maroon header
- Large, prominent 6-digit OTP code display
- 5-minute expiration notice
- Security warnings (never share OTP)
- Security tips section
- Responsive design
- Professional footer with copyright

## Frontend Implementation

### Login Page Updates (`resources/js/Pages/Auth/login.tsx`)

#### New Form Fields:
```typescript
use_gmail_otp: boolean
use_google_authenticator: boolean
otp_code: string
```

#### New State Variables:
```typescript
show2FAInput: boolean // Shows OTP input field when 2FA is enabled
```

#### 2FA UI Components:
1. **Admin-Only 2FA Section** (only shown for admin user type)
   - Gmail OTP toggle switch with Smartphone icon
   - Google Authenticator toggle switch with Key icon
   - Maroon-themed background box
   
2. **OTP Input Field** (shown when any toggle is enabled)
   - 6-character input
   - Monospace font, centered text
   - Wide letter spacing for readability
   - Helper text explaining which app to use
   - Error display for invalid/expired codes

#### Enhanced Form Handling:
- `handleInputChange()` - Shows 2FA input when toggles are enabled
- `validateForm()` - Only requires OTP if 2FA input is visible
- `handleSubmit()` - Improved error handling:
  - Detects OTP sent message (status 202)
  - Shows 2FA input and displays message
  - Clears OTP field for new code entry
  - Preserves form state to keep toggles enabled

## Authentication Flow Diagrams

### Gmail OTP Flow:
```
1. User enters email/password + enables Gmail OTP toggle
2. Click "Sign In"
3. Backend verifies email/password
4. Backend generates 6-digit OTP
5. Backend sends OTP email
6. Backend responds with error status 202: "OTP has been sent"
7. Frontend shows OTP input field
8. User checks email and enters OTP
9. Click "Sign In" again
10. Backend verifies OTP and expiration
11. Backend clears OTP data
12. Authentication successful
```

### Google Authenticator Flow:
```
1. User sets up Google Authenticator in account settings (future feature)
2. User enters email/password + enables Google Auth toggle
3. Click "Sign In"
4. Backend verifies email/password
5. Backend checks if google_auth_secret exists
6. Backend responds with error status 202: "Enter your Google Authenticator code"
7. Frontend shows OTP input field
8. User opens Google Authenticator app and gets current code
9. User enters 6-digit TOTP code
10. Click "Sign In" again
11. Backend verifies TOTP code using Google2FA library
12. Authentication successful
```

## Security Features

### 1. OTP Security
- **Random Generation**: Uses `random_int(0, 999999)` with STR_PAD_LEFT
- **Expiration**: 5-minute timeout from generation
- **One-Time Use**: OTP is cleared immediately after successful verification
- **Storage**: Stored in database, not in session/cookie
- **Validation**: Exact match required, checked against expiration time

### 2. Google Authenticator Security
- **Secret Storage**: Encrypted in database, hidden from API responses
- **TOTP Standard**: RFC 6238 compliant (30-second window)
- **No Server Time Sync Required**: Uses standardized TOTP algorithm
- **Multiple App Support**: Works with any TOTP-compatible app

### 3. General Security
- **Rate Limiting**: Existing Laravel rate limiting applies (5 attempts)
- **Session Logout**: User is logged out if OTP verification fails
- **CSRF Protection**: All forms use CSRF tokens
- **Email Verification**: OTP sent only to registered email address
- **Admin-Only**: 2FA restricted to admin/super_admin roles

## Email Configuration

### Required `.env` Settings:
```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=your-email@gmail.com
MAIL_FROM_NAME="Alumni Tracer System"
```

### Gmail App Password Setup:
1. Go to Google Account settings
2. Enable 2-Step Verification
3. Generate App Password for "Mail"
4. Use the 16-character password in `.env`

## Testing Guide

### Testing Gmail OTP:

1. **Test OTP Generation and Email Delivery**
   ```
   - Log in as admin user
   - Enable "Gmail OTP" toggle
   - Click "Sign In"
   - Expected: "OTP has been sent to your email" message
   - Check email for OTP code (expires in 5 minutes)
   ```

2. **Test OTP Verification**
   ```
   - Enter the 6-digit OTP from email
   - Click "Sign In"
   - Expected: Successful login to admin dashboard
   ```

3. **Test OTP Expiration**
   ```
   - Request OTP but wait 6+ minutes
   - Enter the expired OTP
   - Expected: "Invalid or expired OTP code" error
   ```

4. **Test Invalid OTP**
   ```
   - Enter incorrect 6-digit code (e.g., 000000)
   - Click "Sign In"
   - Expected: "Invalid or expired OTP code" error
   ```

5. **Test OTP Reuse Prevention**
   ```
   - Successfully log in with OTP
   - Log out
   - Try to use the same OTP again
   - Expected: Error (OTP was cleared after first use)
   ```

### Testing Google Authenticator:

1. **Test Without Setup (Error Case)**
   ```
   - Log in as new admin user (no google_auth_secret)
   - Enable "Google Authenticator" toggle
   - Click "Sign In"
   - Expected: "Please set up Google Authenticator in your account settings first"
   ```

2. **Test After Setup** (requires account settings feature)
   ```
   - Set up Google Authenticator in account settings
   - Scan QR code with authenticator app
   - Enable "Google Authenticator" toggle on login
   - Enter current 6-digit TOTP from app
   - Click "Sign In"
   - Expected: Successful login
   ```

3. **Test Invalid TOTP**
   ```
   - Enter incorrect 6-digit code
   - Expected: "Invalid Google Authenticator code" error
   ```

### Testing UI/UX:

1. **Test Toggle Visibility**
   ```
   - Select "Alumni" user type
   - Expected: No 2FA toggles visible
   - Go back and select "Administrator"
   - Expected: 2FA section with both toggles visible
   ```

2. **Test OTP Input Display**
   ```
   - Enable Gmail OTP toggle
   - Expected: OTP input field appears
   - Disable toggle
   - Expected: OTP input field disappears
   ```

3. **Test Error Messages**
   ```
   - Try various error scenarios
   - Verify all error messages display correctly with AlertCircle icon
   - Verify error styling (red text, red border)
   ```

## Future Enhancements

### 1. Account Settings Page for 2FA Management
- Enable/disable 2FA methods
- Set up Google Authenticator (QR code display)
- View backup codes
- Download backup codes as PDF

### 2. Backup Codes
- Generate 10 one-time backup codes
- Use if phone is lost/unavailable
- Regenerate after use

### 3. 2FA Enforcement Policies
- Require 2FA for super_admins
- Grace period before enforcement
- Warning notifications

### 4. 2FA Recovery Options
- Security questions
- SMS backup (requires phone number)
- Admin override for account recovery

### 5. Activity Logging
- Log all 2FA setup/changes
- Log failed OTP attempts
- Display in activity logs table

### 6. Multi-Device Support
- Remember trusted devices for 30 days
- Device fingerprinting
- Revoke device access

## Troubleshooting

### Issue: OTP Email Not Received
**Solutions:**
1. Check spam/junk folder
2. Verify `.env` email settings
3. Test email configuration: `php artisan tinker` → `Mail::raw('Test', fn($m) => $m->to('test@example.com')->subject('Test'))`
4. Check Gmail App Password is correct
5. Verify SMTP port 587 is not blocked by firewall

### Issue: "Please set up Google Authenticator first"
**Solution:**
- This is expected if user hasn't set up Google Authenticator
- Need to implement account settings page to generate QR code
- Or manually insert `google_auth_secret` in database for testing

### Issue: Google Authenticator Code Always Invalid
**Solutions:**
1. Check server time is synchronized (TOTP requires accurate time)
2. Verify secret key is correct in database
3. Try codes from different time windows (±30 seconds)
4. Regenerate secret and re-scan QR code

### Issue: OTP Expired Immediately
**Solution:**
- Check server timezone in `config/app.php`
- Verify database timezone matches server timezone
- Check `otp_expires_at` timestamp is 5 minutes in the future

### Issue: Session Expired Error (419)
**Solution:**
- Clear browser cache and cookies
- Refresh the page to get new CSRF token
- Check session configuration in `config/session.php`

## Dependencies

### PHP Packages:
- **pragmarx/google2fa-laravel** (already installed)
  - Version: ^2.0 or higher
  - Used for: Google Authenticator TOTP generation and verification

### JavaScript Packages:
- **@radix-ui/react-switch** (already installed)
  - Used for: 2FA toggle switches

### Laravel Components:
- **Laravel Mail** - Email sending
- **Laravel Validation** - Form validation
- **Laravel Sanctum** - API authentication (existing)

## Files Modified/Created

### New Files:
1. `database/migrations/2025_11_12_012809_add_two_factor_auth_to_users_table.php`
2. `app/Mail/OTPMail.php`
3. `resources/views/emails/otp.blade.php`
4. `docs/TWO_FACTOR_AUTHENTICATION_GUIDE.md`

### Modified Files:
1. `app/Models/User.php` - Added 2FA fields and helper methods
2. `app/Http/Requests/Auth/LoginRequest.php` - Complete 2FA authentication flow
3. `resources/js/Pages/Auth/login.tsx` - Added 2FA UI and handling

## Code Examples

### Manually Enable Gmail OTP for User:
```php
$user = User::find(1);
$user->gmail_otp_enabled = true;
$user->save();
```

### Manually Generate Google Authenticator Secret:
```php
$user = User::find(1);
$secret = $user->setupGoogleAuth();
echo "Secret: " . $secret;

// Generate QR code URL
$google2fa = app(\PragmaRX\Google2FA\Google2FA::class);
$qrCodeUrl = $google2fa->getQRCodeUrl(
    'Alumni Tracer System',
    $user->email,
    $secret
);
echo "QR Code URL: " . $qrCodeUrl;
```

### Test OTP Generation:
```php
$user = User::find(1);
$otp = $user->generateOTP();
echo "OTP: " . $otp;
echo "Expires at: " . $user->otp_expires_at;
```

### Verify OTP:
```php
$user = User::find(1);
$isValid = $user->verifyOTP('123456');
echo $isValid ? 'Valid' : 'Invalid';
```

## Conclusion

This comprehensive 2FA implementation provides:
- ✅ Dual authentication methods (Gmail OTP + Google Authenticator)
- ✅ Professional email templates
- ✅ Secure OTP generation and storage
- ✅ User-friendly toggle interface
- ✅ Proper error handling and validation
- ✅ Admin-only access control
- ✅ Complete documentation

The system is production-ready for Gmail OTP. Google Authenticator setup requires additional UI (QR code display page) which should be implemented in the account settings section.

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review Laravel logs: `storage/logs/laravel.log`
3. Check browser console for JavaScript errors
4. Verify database schema with: `php artisan migrate:status`
5. Test email configuration separately from 2FA flow
