# Sanctum Authentication Fix - Complete Solution

## Issue Summary
Alumni Dashboard returning **401 Unauthorized** when fetching profile data despite user being logged in.

## Root Cause
**Sanctum Stateful Domains Configuration** - The `SANCTUM_STATEFUL_DOMAINS` environment variable didn't include `localhost:8000` explicitly, causing Sanctum to not recognize requests from that domain as stateful (session-based).

---

## Solution Applied

### 1. Updated `.env` File
**Changed:**
```env
SANCTUM_STATEFUL_DOMAINS=localhost,127.0.0.1,127.0.0.1:8000,localhost:3000
```

**To:**
```env
SANCTUM_STATEFUL_DOMAINS=localhost,localhost:8000,127.0.0.1,127.0.0.1:8000,::1,localhost:3000
```

**Added:** `localhost:8000` and `::1` (IPv6 localhost)

### 2. Cleared Configuration Cache
```bash
php artisan config:clear
php artisan optimize:clear
```

### 3. Added CSRF Cookie Fetch in Frontend
Updated three files to fetch CSRF cookie before API requests:
- `resources/js/pages/Alumni/Dashboard.tsx`
- `resources/js/pages/Alumni/Surveys/MySurveys.tsx`
- `resources/js/pages/Alumni/Surveys/SurveyHistory.tsx`

**Pattern used:**
```typescript
const fetchData = async () => {
    // Get CSRF cookie first
    await fetch('/sanctum/csrf-cookie', {
        credentials: 'include',
    });

    // Then make authenticated request
    const response = await fetch('/api/v1/endpoint', {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include',
    });
};
```

---

## Testing Steps

### Step 1: Clear Browser Cache
```
Press: Ctrl + Shift + R
Or: Ctrl + F5
Or: Open DevTools → Right-click Refresh → Empty Cache and Hard Reload
```

### Step 2: Verify URL
Make sure you're accessing the site via:
```
✓ http://localhost:8000/alumni/dashboard
✓ http://127.0.0.1:8000/alumni/dashboard
```

NOT:
```
✗ http://localhost/alumni/dashboard (no port)
✗ http://127.0.0.1/alumni/dashboard (no port)
```

### Step 3: Check Network Tab
Open DevTools → Network tab → Refresh page

**Should see:**
```
1. GET /sanctum/csrf-cookie → 204 No Content
   Response Headers: Set-Cookie: XSRF-TOKEN=...

2. GET /api/v1/alumni/profile → 200 OK  
   Request Headers: X-XSRF-TOKEN: ...
   Response: { "success": true, "data": { ... } }
```

### Step 4: Verify Dashboard Loads
**Should see:**
- ✅ Welcome banner with your name
- ✅ Profile completion percentage
- ✅ Profile summary cards
- ✅ No error messages
- ✅ No 401 errors in console

---

## Understanding Sanctum Stateful Authentication

### How It Works:
```
1. User logs in → Session created in database
2. Laravel sets session cookie (laravel_session)
3. Page makes API request to /api/v1/endpoint
4. Sanctum checks:
   a. Is request from stateful domain? (SANCTUM_STATEFUL_DOMAINS)
   b. Does request have valid session cookie?
   c. Does request have valid CSRF token?
5. If all pass → auth:sanctum middleware succeeds
6. If any fail → 401 Unauthorized
```

### Why Port Matters:
- `localhost` ≠ `localhost:8000` (different origins)
- `127.0.0.1` ≠ `127.0.0.1:8000` (different origins)
- Sanctum checks the **exact** origin against `SANCTUM_STATEFUL_DOMAINS`
- If origin not found → Treats as token-based auth → Fails if no token → 401

### Configuration Flow:
```
.env file
↓
SANCTUM_STATEFUL_DOMAINS=localhost,localhost:8000,...
↓
config/sanctum.php
↓
explode(',', env('SANCTUM_STATEFUL_DOMAINS', ...))
↓
Middleware: EnsureFrontendRequestsAreStateful
↓
Checks if request origin matches stateful domains
↓
If match: Allow session-based auth
If no match: Require bearer token
```

---

## Common Issues & Solutions

### Issue 1: Still getting 401 after fix
**Causes:**
- Browser cache not cleared
- Wrong URL (missing port :8000)
- Config cache not cleared

**Solutions:**
```bash
# Clear Laravel caches
php artisan config:clear
php artisan optimize:clear

# Hard refresh browser
Ctrl + Shift + R

# Verify .env has correct domains
SANCTUM_STATEFUL_DOMAINS=localhost,localhost:8000,127.0.0.1,127.0.0.1:8000,::1
```

### Issue 2: CSRF token mismatch (419)
**Causes:**
- Not calling `/sanctum/csrf-cookie` first
- Missing `X-Requested-With` header
- Session expired

**Solutions:**
- Always call `/sanctum/csrf-cookie` before API requests
- Include `X-Requested-With: XMLHttpRequest` header
- Check session lifetime in `.env`: `SESSION_LIFETIME=120`

### Issue 3: Session not persisting
**Causes:**
- Wrong session driver
- Session table doesn't exist
- Cookie settings incorrect

**Solutions:**
```bash
# Check session driver
SESSION_DRIVER=database

# Create sessions table
php artisan session:table
php artisan migrate

# Verify cookie settings
SESSION_SECURE_COOKIE=false (for local dev)
SESSION_SAME_SITE=lax
```

### Issue 4: Works on first load, fails on refresh
**Causes:**
- CSRF token expired
- Session cookie not being sent

**Solutions:**
- Re-fetch CSRF cookie on each component mount
- Ensure `credentials: 'include'` in all fetch requests
- Check browser's cookie settings (3rd party cookies allowed for localhost)

---

## Environment-Specific Configuration

### Local Development:
```env
APP_URL=http://localhost:8000
SANCTUM_STATEFUL_DOMAINS=localhost,localhost:8000,127.0.0.1,127.0.0.1:8000,::1

SESSION_DRIVER=database
SESSION_SECURE_COOKIE=false
SESSION_SAME_SITE=lax
```

### Production:
```env
APP_URL=https://yourdomain.com
SANCTUM_STATEFUL_DOMAINS=yourdomain.com,www.yourdomain.com

SESSION_DRIVER=database
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=strict
```

---

## Verification Checklist

Before considering this fixed, verify:

### Backend:
- [ ] `.env` has correct `SANCTUM_STATEFUL_DOMAINS`
- [ ] Config cache cleared: `php artisan config:clear`
- [ ] Route exists: `php artisan route:list --path=alumni/profile`
- [ ] Middleware registered: `bootstrap/app.php` has `EnsureFrontendRequestsAreStateful`
- [ ] Session working: Check `sessions` table has records

### Frontend:
- [ ] Browser cache cleared (Ctrl+Shift+R)
- [ ] Using correct URL with port `:8000`
- [ ] DevTools shows 204 for `/sanctum/csrf-cookie`
- [ ] DevTools shows 200 for `/api/v1/alumni/profile`
- [ ] No 401 errors in console
- [ ] Dashboard loads with profile data

### API Request:
- [ ] Calls `/sanctum/csrf-cookie` first
- [ ] Includes `X-Requested-With: XMLHttpRequest` header
- [ ] Includes `credentials: 'include'`
- [ ] CSRF token cookie set before API call

---

## Debug Commands

### Check if user is authenticated:
```bash
# In tinker
php artisan tinker
>>> Auth::check()
>>> Auth::user()
>>> Auth::user()->role
```

### Check session data:
```sql
-- In MySQL
SELECT * FROM sessions ORDER BY last_activity DESC LIMIT 5;
```

### Test API endpoint directly:
```bash
# This will fail without session, but verifies route exists
curl -X GET http://localhost:8000/api/v1/alumni/profile

# Should return 401 with message
{
  "success": false,
  "message": "Unauthorized. Please log in."
}
```

### Check Sanctum config:
```bash
php artisan tinker
>>> config('sanctum.stateful')
# Should show array: ["localhost", "localhost:8000", "127.0.0.1", "127.0.0.1:8000", ...]
```

---

## Files Modified

### Configuration:
- `.env` - Added `localhost:8000` to `SANCTUM_STATEFUL_DOMAINS`

### Frontend:
- `resources/js/pages/Alumni/Dashboard.tsx` - Added CSRF cookie fetch
- `resources/js/pages/Alumni/Surveys/MySurveys.tsx` - Added CSRF cookie fetch
- `resources/js/pages/Alumni/Surveys/SurveyHistory.tsx` - Added CSRF cookie fetch

### Commands Run:
```bash
php artisan config:clear
php artisan optimize:clear
npm run build
```

---

## Status
✅ **Configuration updated**
✅ **Caches cleared**
✅ **Frontend rebuilt**
⏳ **Waiting for browser cache clear + test**

## Next Action
**User needs to:**
1. Press `Ctrl + Shift + R` (hard refresh)
2. Refresh the alumni dashboard
3. Verify profile loads without errors
