# Edit Profile Save Issue - Troubleshooting Guide

## Issue Summary
Edit Profile page returns 419 CSRF token mismatch error when trying to save changes.

## Changes Made

### 1. ✅ Updated `.env` File
**Changed SESSION_DOMAIN:**
```env
# Before:
SESSION_DOMAIN=null

# After:
SESSION_DOMAIN=localhost
```

### 2. ✅ Cleared Laravel Caches
```bash
php artisan config:clear
php artisan cache:clear
php artisan route:clear
```

### 3. ✅ Added Console Logging
Added diagnostic logs to see exactly what's happening:
- Logs when form is submitted
- Logs response status
- Logs response data
- Logs CSRF errors specifically

## How to Test

### Step 1: Clear Browser Completely
**Option A - Hard Refresh:**
```
Press: Ctrl + Shift + R
```

**Option B - Clear All Data:**
1. Press `Ctrl + Shift + Delete`
2. Select "All time"
3. Check:
   - ✅ Cookies and other site data
   - ✅ Cached images and files
4. Click "Clear data"

**Option C - Incognito Mode:**
```
Press: Ctrl + Shift + N
```

### Step 2: Logout and Login Again
1. Click "Logout" in sidebar
2. Close ALL browser tabs
3. Open new tab
4. Go to `http://localhost:8000/login`
5. Login with alumni credentials

### Step 3: Test Profile Update
1. Go to "My Profile"
2. Click "Edit Profile"
3. Open DevTools (F12)
4. Go to **Console** tab
5. Make a small change (e.g., phone number)
6. Click "Save Profile"
7. **Check console logs** - you should see:
   ```
   Submitting profile update... {data object}
   Response status: 200
   Response data: {success: true, ...}
   ```

### Step 4: Check Network Tab
1. Keep DevTools open (F12)
2. Go to **Network** tab
3. Click "Save Profile" again
4. Look for these requests:

**Request 1: CSRF Cookie**
```
GET /sanctum/csrf-cookie
Status: 204 No Content
```

**Request 2: Profile Update**
```
PUT /api/v1/alumni/profile
Status: 200 OK (if successful)
Status: 419 (if CSRF issue)
```

5. Click on the PUT request
6. Go to **Headers** tab
7. Check:
   - Request Headers should have: `X-Requested-With: XMLHttpRequest`
   - Request Headers should have: `X-XSRF-TOKEN: <some value>`
   - Cookies should include: `XSRF-TOKEN`

## Common Causes & Solutions

### Cause 1: Browser Cache
**Symptom:** Old JavaScript still running
**Solution:** Hard refresh with `Ctrl + Shift + R`

### Cause 2: Session Cookie Domain Mismatch
**Symptom:** CSRF cookie not being sent with request
**Solution:** We fixed this by setting `SESSION_DOMAIN=localhost` in `.env`

### Cause 3: Mixed URL Access
**Symptom:** Accessing via different URLs (localhost vs 127.0.0.1)
**Solution:** **ALWAYS** use `http://localhost:8000` (NOT 127.0.0.1)

### Cause 4: Stale Session
**Symptom:** Session expired or corrupt
**Solution:** Logout, close browser, login again

### Cause 5: Laravel Session Driver
**Symptom:** Session not persisting
**Check:** Run this command to verify database sessions table exists:
```bash
php artisan migrate:status
```

## What to Check in Console

### ✅ Successful Save
```javascript
Submitting profile update... {first_name: "John", ...}
Response status: 200
Response data: {success: true, message: "Profile updated successfully", ...}
```

### ❌ CSRF Error
```javascript
Submitting profile update... {first_name: "John", ...}
Response status: 419
CSRF token mismatch error
```

### ❌ Validation Error
```javascript
Submitting profile update... {first_name: "John", ...}
Response status: 422
Response data: {success: false, message: "Validation error", errors: {...}}
```

## If Still Not Working

### Check 1: Verify You're Logged In
```
1. Go to /alumni/dashboard
2. Check if you see your profile data
3. If redirected to login, your session expired
```

### Check 2: Check Database Connection
```bash
php artisan tinker
>>> \DB::connection()->getPdo();
# Should return PDO object, not error
```

### Check 3: Check Sessions Table
```bash
php artisan tinker
>>> \DB::table('sessions')->count();
# Should return number of sessions
```

### Check 4: Test with Simple Data
1. Only change ONE field (e.g., phone number)
2. Don't touch skills or certifications
3. Try saving
4. If this works, there's a data format issue

### Check 5: Check Laravel Logs
```
Check: storage/logs/laravel.log
Look for: Recent errors when you tried to save
```

## Emergency Workaround

If nothing else works, you can bypass the API and use a direct form submission:

**Option 1: Use Web Route Instead**
We can create a web route that handles the form POST directly without API.

**Option 2: Use Inertia Form Helper**
We can switch to using Inertia's built-in form handling which automatically handles CSRF.

Let me know if you want me to implement either of these!

## What We Changed

**Files Modified:**
1. `.env` - Set SESSION_DOMAIN=localhost
2. `resources/js/pages/Alumni/Profile/Edit.tsx` - Added console logs

**Commands Run:**
```bash
php artisan config:clear
php artisan cache:clear  
php artisan route:clear
npm run build
```

## Next Steps

1. **Clear browser cache** (Ctrl + Shift + R)
2. **Logout and login again**
3. **Check DevTools Console** when saving
4. **Report what you see** in the console logs
5. If still 419 error, we'll implement the Inertia form workaround

---

**Date:** October 16, 2025  
**Status:** Awaiting user testing with diagnostic logs
