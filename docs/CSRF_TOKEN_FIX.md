# CSRF Token Error (419) Fix

## Problem
When trying to log in as Alumni or Admin, users encountered a **419 PAGE EXPIRED** error. This error occurs when the CSRF (Cross-Site Request Forgery) token expires or becomes invalid.

## Root Cause
The 419 error happens in the following scenarios:
1. **Session Expiration**: The login page was left open for more than 2 hours (the default session lifetime)
2. **Browser Cache**: The page was loaded from cache with an old CSRF token
3. **Multiple Tabs**: Having multiple tabs open can sometimes cause token conflicts
4. **Server Restart**: If the Laravel server restarts, existing sessions become invalid

## Solutions Implemented

### 1. Global Error Handler (app.tsx)
Added a global event listener that catches 419 errors and automatically prompts the user to reload the page:

```tsx
document.addEventListener('inertia:error', (event: any) => {
    const response = event.detail.response;
    
    // Handle 419 CSRF token mismatch
    if (response?.status === 419) {
        event.preventDefault();
        
        if (confirm('Your session has expired. The page will now reload.')) {
            window.location.reload();
        } else {
            window.location.reload();
        }
    }
});
```

### 2. Login Form Handler (login.tsx)
Enhanced the login form's error handling to detect 419 errors and show a user-friendly message:

```tsx
onError: (errors: any) => {
    // Handle 419 CSRF token mismatch error
    if (errors?.message && errors.message.includes('419')) {
        setErrors({
            general: 'Your session has expired. Please refresh the page and try again.'
        });
        // Optionally auto-refresh after showing message
        setTimeout(() => {
            window.location.reload();
        }, 3000);
    } else {
        setErrors(errors);
    }
    setIsSubmitting(false);
}
```

## How It Works

### Normal Flow
1. User visits `/login`
2. Laravel generates a fresh CSRF token
3. Token is embedded in the page's `<meta name="csrf-token">` tag
4. Inertia.js automatically reads and includes this token in all POST requests
5. Login succeeds

### Error Flow (Before Fix)
1. User visits `/login` and leaves the page open
2. 2+ hours pass (session expires)
3. User tries to login
4. Laravel rejects the request with 419 error
5. User sees "419 PAGE EXPIRED" with no guidance

### Error Flow (After Fix)
1. User visits `/login` and leaves the page open
2. 2+ hours pass (session expires)
3. User tries to login
4. Laravel returns 419 error
5. **Global error handler catches it**
6. User sees friendly message: "Your session has expired. The page will now reload."
7. Page automatically refreshes with fresh CSRF token
8. User can now login successfully

## Quick Fixes for Users

If you encounter a 419 error:

### Method 1: Refresh the Page (Recommended)
Press `Ctrl + R` (Windows) or `Cmd + R` (Mac) to refresh the page before logging in.

### Method 2: Hard Refresh
Press `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac) to clear cache and refresh.

### Method 3: Close and Reopen
Close the tab and open a new one by navigating to the login page again.

### Method 4: Clear Browser Cache
If the problem persists:
1. Clear your browser's cache and cookies
2. Close all browser tabs
3. Open a fresh browser window
4. Navigate to the login page

## Configuration Details

### Session Configuration
Location: `config/session.php`

```php
'lifetime' => (int) env('SESSION_LIFETIME', 120), // 120 minutes = 2 hours
'expire_on_close' => env('SESSION_EXPIRE_ON_CLOSE', false),
'driver' => env('SESSION_DRIVER', 'database'),
```

### CSRF Token Setup
Location: `resources/views/app.blade.php`

```html
<meta name="csrf-token" content="{{ csrf_token() }}">
```

### Inertia Configuration
Inertia.js automatically:
- Reads the CSRF token from the meta tag
- Includes it in all POST, PUT, PATCH, DELETE requests
- Uses the `X-CSRF-TOKEN` header

## Testing the Fix

### Test Case 1: Fresh Login
1. Navigate to `/login`
2. Select Alumni or Admin login
3. Enter valid credentials
4. Click "Sign In"
5. **Expected**: Successful login and redirect to dashboard

### Test Case 2: Expired Session
1. Navigate to `/login`
2. Open browser DevTools → Console
3. Wait for session to expire (or manually delete session cookies)
4. Try to login
5. **Expected**: Alert showing "Your session has expired"
6. Page auto-reloads after 3 seconds
7. Try login again successfully

### Test Case 3: Invalid Credentials
1. Navigate to `/login`
2. Enter incorrect email/password
3. Click "Sign In"
4. **Expected**: Error message "These credentials do not match our records."
5. Form stays on same page (no reload)

## Prevention Tips

### For Users
- Don't leave the login page open for extended periods
- If you need to step away, close the browser tab
- Use the "Remember Me" option (when implemented) for convenience

### For Developers
- Consider implementing session timeout warnings
- Add a "Keep me logged in" feature for longer sessions
- Implement automatic token refresh for long-running sessions
- Add better error messages in production

## Additional Resources

- [Laravel CSRF Protection](https://laravel.com/docs/11.x/csrf)
- [Inertia.js CSRF Protection](https://inertiajs.com/csrf-protection)
- [Laravel Session Configuration](https://laravel.com/docs/11.x/session)

## Troubleshooting

### Issue: Still Getting 419 Errors
**Solution**: Clear all Laravel caches:
```bash
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

### Issue: Multiple Users Reporting 419
**Solution**: Check server configuration:
- Verify APP_KEY is set in `.env`
- Ensure sessions table exists: `php artisan migrate`
- Check session driver is working: `SESSION_DRIVER=database`

### Issue: 419 on Every Login Attempt
**Solution**: Verify setup:
1. Check `app.blade.php` has `<meta name="csrf-token">` tag
2. Verify Inertia is installed: `composer show inertiajs/inertia-laravel`
3. Check CSRF middleware is active in `bootstrap/app.php`

## Status
✅ **Fixed**: Global error handler implemented
✅ **Fixed**: User-friendly error messages added
✅ **Tested**: Login works for both Alumni and Admin
✅ **Deployed**: Build completed successfully

---

**Last Updated**: October 20, 2025
**Fixed By**: GitHub Copilot
**Build Status**: ✅ Successful (12.13s)
