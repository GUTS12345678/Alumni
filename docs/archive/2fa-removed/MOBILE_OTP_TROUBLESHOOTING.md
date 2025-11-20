# Mobile OTP/2FA Troubleshooting Guide

## Issue Description
Login works on PC (localhost/local network) but OTP/2FA verification fails on mobile devices accessing via Cloudflare Tunnel (akndev.tech).

---

## Root Cause
The issue is related to **session management across different network contexts**:

1. **Session cookies not shared properly** between PC and mobile
2. **Domain mismatch** - localhost vs external domain (akndev.tech)
3. **CORS and Sanctum configuration** not allowing cross-origin authenticated requests
4. **Session domain restrictions** preventing cookies from being set on mobile browsers

---

## Solution Applied

### 1. Updated `.env` File

**Session Configuration:**
```env
SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_ENCRYPT=false
SESSION_PATH=/
SESSION_DOMAIN=.akndev.tech          # Changed from null - enables subdomain sharing
SESSION_SECURE_COOKIE=false          # Added - allows HTTP for local dev
SESSION_SAME_SITE=lax                # Added - permits cross-site requests
```

**Sanctum Configuration:**
```env
SANCTUM_STATEFUL_DOMAINS=localhost,localhost:8000,127.0.0.1,127.0.0.1:8000,::1,localhost:3000,akndev.tech,www.akndev.tech,*.akndev.tech
```

### Key Changes Explained:

- **SESSION_DOMAIN=.akndev.tech**: The leading dot (.) allows cookies to be shared across all subdomains
- **SESSION_SECURE_COOKIE=false**: Allows cookies over HTTP (for local dev with Cloudflare Tunnel)
- **SESSION_SAME_SITE=lax**: Permits cookies to be sent with cross-site GET requests
- **SANCTUM_STATEFUL_DOMAINS**: Added wildcard `*.akndev.tech` to match all subdomains

---

## How Session-Based 2FA Works

### Login Flow:
1. User enters credentials → Server validates → Creates session
2. If 2FA is enabled → Store `two_factor_pending` in session
3. Redirect to 2FA challenge page
4. User enters OTP → Server verifies from session data
5. Session upgraded to fully authenticated → Redirect to dashboard

### Why It Failed on Mobile:
- Session created on initial login page load
- When redirected to 2FA page, session cookie not sent from mobile browser
- Server sees "no session" → Cannot find `two_factor_pending` data
- OTP verification fails because session context is lost

---

## Testing Steps

### 1. Clear All Sessions (Server)
```bash
# Clear Laravel cache
php artisan optimize:clear

# Manually clear sessions table (if using database sessions)
php artisan tinker
>>> DB::table('sessions')->delete();
>>> exit
```

### 2. Clear Browser Data (Mobile)

**On Android (Chrome):**
1. Open Chrome → Three dots → Settings
2. Privacy and security → Clear browsing data
3. Select: Cookies and site data, Cached images and files
4. Time range: All time
5. Tap "Clear data"

**On iOS (Safari):**
1. Settings → Safari
2. Clear History and Website Data
3. Confirm deletion

### 3. Test Login Flow

**On Mobile Device:**
1. Open browser → Go to: `https://akndev.tech` (or your Cloudflare domain)
2. Click Login
3. Enter valid credentials
4. Should redirect to 2FA page
5. Check if session persists (page should show user context)
6. Enter OTP code
7. Should successfully login and redirect to dashboard

**What to Check:**
- Does the 2FA page load with user info?
- Can you see the session cookie in browser dev tools? (Mobile Chrome: `chrome://inspect/#devices`)
- Are there any CORS errors in browser console?

### 4. Verify Session Cookies

**Desktop Browser (for debugging):**
1. Open Developer Tools (F12)
2. Go to Application tab → Cookies
3. Check for cookie named: `alumni_tracer_system_session`
4. Verify domain is: `.akndev.tech`
5. SameSite should be: `Lax`

---

## Common Issues & Solutions

### Issue 1: "Session expired" on 2FA page
**Cause:** Session cookie not being sent with redirect

**Solution:**
- Ensure `SESSION_DOMAIN=.akndev.tech` (with leading dot)
- Check `SESSION_SAME_SITE=lax` in config
- Clear browser cookies and try again

### Issue 2: OTP verification fails with "Invalid code"
**Cause:** Time synchronization issue or session data lost

**Solution:**
```bash
# Check if session data exists
php artisan tinker
>>> session()->get('two_factor_pending')
>>> exit
```

If `null`, session is not persisting. Check:
- Database sessions table has entries: `SELECT * FROM sessions;`
- Session cookie is being set: Check browser dev tools
- Session lifetime not too short: `SESSION_LIFETIME=120` (2 hours)

### Issue 3: Infinite redirect loop
**Cause:** Middleware blocking unauthenticated access to 2FA page

**Solution:**
Check `routes/web.php` - 2FA routes should NOT require `auth` middleware:
```php
// Should be accessible without full authentication
Route::get('/two-factor-challenge', [TwoFactorChallengeController::class, 'create'])
    ->name('two-factor.login');
```

### Issue 4: CORS errors on mobile
**Cause:** Sanctum not recognizing mobile domain as stateful

**Solution:**
- Add domain to `SANCTUM_STATEFUL_DOMAINS` in `.env`
- Clear config: `php artisan config:clear`
- Restart browser completely

### Issue 5: Works on WiFi but not on mobile data
**Cause:** Different network contexts, IP-based session binding

**Solution:**
- Don't bind sessions to IP addresses
- Use database session driver (not file-based)
- Ensure SESSION_DOMAIN is domain-based, not IP-based

---

## Production Recommendations

When deploying to production with HTTPS:

### 1. Enable Secure Cookies
```env
APP_URL=https://akndev.tech
SESSION_SECURE_COOKIE=true    # Only send over HTTPS
SESSION_SAME_SITE=strict      # Strict CSRF protection
```

### 2. Use HTTPS Everywhere
- Get SSL certificate (Let's Encrypt)
- Force HTTPS redirects in Apache/Nginx
- Update Cloudflare SSL mode to "Full (strict)"

### 3. Update Session Configuration
```php
// config/session.php
'secure' => env('SESSION_SECURE_COOKIE', true),  // Force HTTPS
'same_site' => 'strict',                         // Strict mode for production
```

### 4. Sanctum Configuration
```env
SANCTUM_STATEFUL_DOMAINS=akndev.tech,www.akndev.tech
# Remove localhost entries in production
```

---

## Debugging Commands

### Check Session Configuration
```bash
php artisan tinker
>>> config('session.domain')
>>> config('session.driver')
>>> config('sanctum.stateful')
>>> exit
```

### View Active Sessions
```bash
# If using database sessions
php artisan tinker
>>> DB::table('sessions')->select('id', 'user_id', 'ip_address', 'user_agent')->get()
>>> exit
```

### Monitor Session in Real-Time
```bash
# Tail Laravel logs while testing
tail -f storage/logs/laravel.log

# Or on Windows
Get-Content storage/logs/laravel.log -Wait
```

### Test from Mobile via Command Line
```bash
# From mobile browser console (if accessible)
console.log(document.cookie);
console.log(navigator.userAgent);
```

---

## Architecture Overview

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────┐
│   Mobile    │         │  Cloudflare      │         │   XAMPP     │
│   Device    │◄───────►│    Tunnel        │◄───────►│   Server    │
│  (akndev)   │  HTTPS  │  (Proxy/CDN)     │  HTTP   │ (localhost) │
└─────────────┘         └──────────────────┘         └─────────────┘
      │                                                      │
      │                                                      │
      └──────────── Session Cookie Exchange ────────────────┘
           (Requires matching SESSION_DOMAIN)
```

**Session Flow:**
1. Mobile requests `https://akndev.tech/login`
2. Cloudflare Tunnel forwards to `http://localhost:80`
3. Laravel creates session in database
4. Response includes `Set-Cookie: alumni_tracer_system_session=...; domain=.akndev.tech`
5. Mobile browser stores cookie
6. Subsequent requests include cookie
7. Laravel reads session from database using cookie ID

---

## Verification Checklist

After applying fixes, verify:

- [ ] `.env` has `SESSION_DOMAIN=.akndev.tech`
- [ ] `.env` has `SESSION_SECURE_COOKIE=false` (for HTTP dev)
- [ ] `.env` has `SESSION_SAME_SITE=lax`
- [ ] `SANCTUM_STATEFUL_DOMAINS` includes `akndev.tech,*.akndev.tech`
- [ ] Ran `php artisan optimize:clear`
- [ ] Cleared mobile browser cookies
- [ ] Cleared database sessions table (if needed)
- [ ] Can login on PC successfully
- [ ] Can login on mobile successfully
- [ ] 2FA OTP works on PC
- [ ] 2FA OTP works on mobile
- [ ] Session persists across pages on mobile
- [ ] No CORS errors in browser console

---

## Alternative Solutions

If the above doesn't work, consider:

### Option 1: Use Token-Based Authentication Instead
- Switch from session-based to Sanctum API tokens
- Store token in localStorage on mobile
- Send token in Authorization header
- More suitable for SPA/mobile apps

### Option 2: Separate Mobile API
- Create dedicated API endpoints for mobile
- Use different authentication flow
- Return JWT tokens instead of cookies
- Better control over mobile-specific logic

### Option 3: Use Email OTP Instead of TOTP
- Send OTP via email (already implemented)
- No time-sync issues
- Works regardless of session persistence
- Enable with: `gmail_otp_enabled = true` in user settings

---

## Support & Further Help

### Check Laravel Logs
```bash
# Location: storage/logs/laravel.log
# Look for session-related errors
grep -i "session" storage/logs/laravel.log
grep -i "csrf" storage/logs/laravel.log
```

### Enable Debug Mode (Development Only)
```env
APP_DEBUG=true
LOG_LEVEL=debug
```

### Network Inspection
Use browser dev tools to inspect:
- Request headers (Cookie header present?)
- Response headers (Set-Cookie header present?)
- Network timing (delays might indicate network issues)

---

**Last Updated:** November 12, 2025  
**Related Files:**
- `.env` - Environment configuration
- `config/session.php` - Session settings
- `config/sanctum.php` - Sanctum/CORS settings
- `app/Http/Controllers/Auth/TwoFactorChallengeController.php` - 2FA logic
