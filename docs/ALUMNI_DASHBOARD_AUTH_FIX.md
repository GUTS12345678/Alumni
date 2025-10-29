# Alumni Dashboard Authentication Fix

## Issue Description
**Date:** October 16, 2025  
**Problem:** Alumni Dashboard showing "Failed to load profile data" error with 401 (Unauthorized) responses

**Error Details:**
- HTTP Status: 401 Unauthorized
- Endpoint: `/api/v1/alumni/profile`
- Symptom: Profile fetch error on alumni dashboard login
- Console Error: "Failed to fetch profile data"

---

## Root Cause

The issue was caused by **missing CSRF token** in API requests from the Alumni Dashboard and Survey pages. 

### Technical Explanation:
1. **Laravel Sanctum SPA Authentication** requires a CSRF token for authenticated requests
2. The Dashboard was making direct API calls to `/api/v1/alumni/profile` without first obtaining the CSRF cookie
3. Even though the user was authenticated via session (Inertia.js), the API middleware (`auth:sanctum`) couldn't validate the request without the CSRF token
4. This resulted in 401 Unauthorized responses

### Why This Happened:
- Inertia.js pages are server-rendered and have session authentication
- But when these pages make **fetch API calls** to `/api/v1/*` endpoints, they need to follow Sanctum's SPA authentication flow
- Sanctum requires: `GET /sanctum/csrf-cookie` → then API call with `X-Requested-With: XMLHttpRequest` header

---

## Solution Implemented

### Files Modified:
1. `resources/js/pages/Alumni/Dashboard.tsx`
2. `resources/js/pages/Alumni/Surveys/MySurveys.tsx`
3. `resources/js/pages/Alumni/Surveys/SurveyHistory.tsx`

### Changes Made:

#### Before (Broken Code):
```typescript
const fetchProfile = async () => {
    try {
        const response = await fetch('/api/v1/alumni/profile', {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });
        // ... rest of code
    }
};
```

**Problem:** No CSRF cookie obtained, missing `X-Requested-With` header

#### After (Fixed Code):
```typescript
const fetchProfile = async () => {
    try {
        // FIRST: Get CSRF cookie for SPA authentication
        await fetch('/sanctum/csrf-cookie', {
            credentials: 'include',
        });

        // THEN: Make the authenticated request with proper headers
        const response = await fetch('/api/v1/alumni/profile', {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest', // Required for CSRF verification
            },
            credentials: 'include',
        });
        // ... rest of code
    }
};
```

**Solution:** 
1. Call `/sanctum/csrf-cookie` first to set the CSRF cookie
2. Add `X-Requested-With: XMLHttpRequest` header to identify as AJAX request
3. Sanctum will now verify CSRF token from cookie

---

## Technical Details

### Sanctum SPA Authentication Flow:
```
1. User logs in via Inertia.js → Session created
2. Component loads (e.g., Dashboard)
3. Component makes API call:
   a. GET /sanctum/csrf-cookie → Sets XSRF-TOKEN cookie
   b. GET /api/v1/alumni/profile (with credentials + XMLHttpRequest header)
   c. Sanctum verifies:
      - Session authentication (user logged in)
      - CSRF token (from cookie matches request)
      - Role/permissions (alumni middleware)
   d. Returns profile data
```

### Key Headers:
- **`X-Requested-With: XMLHttpRequest`**: Tells Laravel this is an AJAX/API request
- **`credentials: 'include'`**: Sends cookies with request (including CSRF token)
- **`Accept: application/json`**: Ensures JSON responses

### Middleware Chain:
```
Route: GET /api/v1/alumni/profile
↓
auth:sanctum middleware → Checks session + CSRF token
↓
alumni middleware → Checks user.role === 'alumni'
↓
AuthController@alumniProfile → Returns profile data
```

---

## Verification Steps

### 1. Test Alumni Dashboard:
```bash
# Login as alumni user, then check browser console:
# Should see successful fetch without 401 errors
```

**Expected Result:**
- Dashboard loads without errors
- Profile data displays correctly
- Welcome banner shows user name
- Profile completion percentage visible

### 2. Test My Surveys Page:
```bash
# Navigate to /alumni/surveys
```

**Expected Result:**
- Surveys load successfully
- Stats cards show correct counts
- No 401 errors in console

### 3. Test Survey History:
```bash
# Navigate to /alumni/surveys/history
```

**Expected Result:**
- Survey responses load successfully
- History displays correctly
- No authentication errors

### 4. Browser Console Check:
Open DevTools → Console → Should see:
```
Alumni Dashboard - Auth state: { user: { ... } }
✓ No errors
✓ No 401 Unauthorized messages
```

### 5. Network Tab Verification:
Open DevTools → Network → Filter: XHR

**Successful Request Flow:**
1. `GET /sanctum/csrf-cookie` → Status: 204 No Content
   - Sets XSRF-TOKEN cookie
2. `GET /api/v1/alumni/profile` → Status: 200 OK
   - Returns profile JSON
   - Headers include: `X-Requested-With: XMLHttpRequest`

---

## Related Configuration

### Sanctum Config (`config/sanctum.php`):
```php
'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', sprintf(
    '%s%s',
    'localhost,localhost:3000,127.0.0.1,127.0.0.1:8000,::1',
    Sanctum::currentApplicationUrlWithPort(),
))),

'guard' => ['web'],
```

### API Routes (`routes/api.php`):
```php
// Alumni-only routes (authentication + alumni role required)
Route::prefix('v1/alumni')->middleware(['auth:sanctum', 'alumni'])->group(function () {
    Route::get('/profile', [AuthController::class, 'alumniProfile']);
    Route::put('/profile', [AuthController::class, 'updateAlumniProfile']);
});
```

### Alumni Middleware (`app/Http/Middleware/AlumniMiddleware.php`):
```php
public function handle(Request $request, Closure $next): Response
{
    $user = $request->user();

    if (!$user) {
        return response()->json([
            'success' => false,
            'message' => 'Unauthorized. Please log in.'
        ], 401);
    }

    if ($user->role !== 'alumni') {
        return response()->json([
            'success' => false,
            'message' => 'Access denied. Alumni access required.'
        ], 403);
    }

    return $next($request);
}
```

---

## Common Sanctum SPA Authentication Issues

### Issue 1: CORS Errors
**Symptom:** CORS policy blocking requests  
**Solution:** Ensure `SANCTUM_STATEFUL_DOMAINS` includes your frontend domain

### Issue 2: 419 CSRF Token Mismatch
**Symptom:** 419 Page Expired error  
**Solution:** Call `/sanctum/csrf-cookie` before API requests

### Issue 3: 401 Unauthenticated (This Issue)
**Symptom:** User logged in but API returns 401  
**Solution:** Add CSRF cookie fetch + `X-Requested-With` header

### Issue 4: Session Cookie Not Sent
**Symptom:** Request doesn't include session cookie  
**Solution:** Use `credentials: 'include'` in fetch options

---

## Best Practices for Sanctum SPA Authentication

### 1. Always Get CSRF Cookie First:
```typescript
// Do this ONCE when component mounts
await fetch('/sanctum/csrf-cookie', { credentials: 'include' });
```

### 2. Include Required Headers:
```typescript
headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest', // Important!
}
```

### 3. Always Use credentials: 'include':
```typescript
fetch('/api/v1/endpoint', {
    credentials: 'include', // Sends cookies
    // ... other options
});
```

### 4. Handle 401 Errors Gracefully:
```typescript
if (!response.ok) {
    if (response.status === 401) {
        // Redirect to login
        window.location.href = '/login';
    }
    throw new Error('API request failed');
}
```

---

## Alternative Approaches (Not Implemented)

### Option 1: Create API Utility Function
**Benefit:** Centralize CSRF logic  
**Implementation:**
```typescript
// utils/api.ts
export async function apiRequest(url: string, options?: RequestInit) {
    await fetch('/sanctum/csrf-cookie', { credentials: 'include' });
    
    return fetch(url, {
        ...options,
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            ...options?.headers,
        },
        credentials: 'include',
    });
}

// Usage:
const response = await apiRequest('/api/v1/alumni/profile');
```

### Option 2: Use Axios Instead of Fetch
**Benefit:** Axios handles CSRF automatically  
**Implementation:**
```typescript
import axios from 'axios';

axios.defaults.withCredentials = true;
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Usage:
const response = await axios.get('/api/v1/alumni/profile');
```

### Option 3: Use Inertia's Built-in Methods
**Benefit:** No manual API calls needed  
**Implementation:**
```typescript
// Instead of fetch, use Inertia router
router.visit('/alumni/profile', {
    only: ['profile'],
    onSuccess: (page) => {
        setProfile(page.props.profile);
    },
});
```

---

## Testing Checklist

### Manual Testing:
- [x] Login as alumni user
- [x] Dashboard loads without errors
- [x] Profile data displays correctly
- [x] Navigate to My Surveys - loads successfully
- [x] Navigate to Survey History - loads successfully
- [x] No 401 errors in browser console
- [x] CSRF cookie set in Application → Cookies
- [x] API requests include X-Requested-With header

### Browser DevTools Checks:
- [x] Console: No errors
- [x] Network: `/sanctum/csrf-cookie` returns 204
- [x] Network: API requests return 200
- [x] Application → Cookies: XSRF-TOKEN exists
- [x] Network → Headers: X-Requested-With present

### Edge Cases:
- [x] Refresh page while on dashboard
- [x] Navigate away and back to dashboard
- [x] Open dashboard in new tab
- [x] Clear cookies and login again

---

## Conclusion

The authentication issue was resolved by implementing proper **Sanctum SPA authentication flow**:
1. Get CSRF cookie before API requests
2. Include `X-Requested-With: XMLHttpRequest` header
3. Use `credentials: 'include'` to send cookies

This fix ensures that all alumni dashboard pages can successfully authenticate with the API while maintaining security through CSRF protection.

**Status:** ✅ Fixed  
**Impact:** All alumni pages now load correctly without authentication errors  
**Files Modified:** 3 files (Dashboard, MySurveys, SurveyHistory)

---

## Related Documentation
- [Laravel Sanctum SPA Authentication](https://laravel.com/docs/11.x/sanctum#spa-authentication)
- [CSRF Protection](https://laravel.com/docs/11.x/csrf)
- [Alumni Profile Implementation](./ALUMNI_PROFILE_IMPLEMENTATION.md)
- [Alumni Surveys Implementation](./ALUMNI_SURVEYS_IMPLEMENTATION.md)
