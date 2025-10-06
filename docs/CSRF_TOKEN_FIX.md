# CSRF Token Mismatch Fix

## Problem
When attempting to reset user passwords or perform other state-changing operations (PUT, POST, DELETE, PATCH), the application was returning a **419 CSRF token mismatch** error.

## Root Cause
The application uses Laravel Sanctum with stateful middleware (`EnsureFrontendRequestsAreStateful`) which enforces CSRF protection on API routes. While the frontend was sending Bearer tokens for authentication, it wasn't including CSRF tokens required by the stateful middleware.

## Solution
Added CSRF token to all state-changing API requests by:

1. **Reading CSRF token from meta tag** (already present in `resources/views/app.blade.php`)
2. **Creating helper functions** to retrieve and include the token
3. **Updating all fetch requests** to include the `X-CSRF-TOKEN` header

## Files Modified

### 1. UserManagement.tsx
**Location:** `resources/js/pages/admin/UserManagement.tsx`

**Changes:**
- Added `getCsrfToken()` helper function
- Added `getAuthHeaders()` helper function that includes CSRF token
- Updated all API calls to use the helper function:
  - `fetchUsers()` - GET request
  - `handleDelete()` - DELETE request
  - `handleEditSubmit()` - PUT request
  - `handleResetPassword()` - POST request
  - `handleStatusToggle()` - PATCH request

**Code Added:**
```typescript
// Helper function to get CSRF token
const getCsrfToken = () => {
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute('content') || '' : '';
};

// Helper function to get auth headers
const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    const csrfToken = getCsrfToken();
    
    return {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-TOKEN': csrfToken,
    };
};
```

**Updated Fetch Example:**
```typescript
const response = await fetch(`/api/v1/admin/users/${selectedUser.id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: getAuthHeaders(),
    body: JSON.stringify(editFormData),
});
```

### 2. SurveyAnalytics.tsx
**Location:** `resources/js/pages/admin/SurveyAnalytics.tsx`

**Changes:**
- Added `getCsrfToken()` helper function
- Updated export analytics POST request to include CSRF token

**Code Added:**
```typescript
// Helper function to get CSRF token
const getCsrfToken = () => {
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute('content') || '' : '';
};
```

**Updated Fetch:**
```typescript
const response = await fetch(`/api/v1/admin/analytics/surveys/${selectedSurvey}/export`, {
    method: 'POST',
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-TOKEN': getCsrfToken(),
    },
    credentials: 'same-origin',
    body: JSON.stringify({ days: dateRange }),
});
```

## How CSRF Protection Works

### Laravel Sanctum Stateful Configuration
From `config/sanctum.php`:
```php
'middleware' => [
    'authenticate_session' => Laravel\Sanctum\Http\Middleware\AuthenticateSession::class,
    'encrypt_cookies' => Illuminate\Cookie\Middleware\EncryptCookies::class,
    'validate_csrf_token' => Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class,
],
```

The `validate_csrf_token` middleware checks for CSRF token on all state-changing requests (POST, PUT, PATCH, DELETE) when the request comes from a stateful domain.

### CSRF Token Flow
1. Laravel generates CSRF token on page load
2. Token is embedded in `<meta name="csrf-token">` tag
3. Frontend reads token from meta tag
4. Token is sent with request via `X-CSRF-TOKEN` header
5. Laravel validates token matches session
6. Request is processed if valid

## Testing Checklist

- [x] Reset Password - works without CSRF error ✅
- [x] Edit User - works without CSRF error ✅
- [x] Delete User - works without CSRF error ✅
- [x] Toggle User Status - works without CSRF error ✅
- [x] Export Survey Analytics - includes CSRF token ✅
- [x] Fetch Users (GET) - no CSRF required but token sent ✅

## Security Benefits

1. **CSRF Protection:** Prevents cross-site request forgery attacks
2. **Stateful Authentication:** Maintains session-based security
3. **Bearer Token Auth:** Provides API token authentication
4. **Dual Security:** Both session + token validation

## Why Both Bearer Token and CSRF?

- **Bearer Token:** Identifies the authenticated user
- **CSRF Token:** Prevents malicious sites from making requests on behalf of the user
- **Together:** Provide comprehensive authentication and request validation

## Alternative Solutions (Not Used)

### Option 1: Disable CSRF for API Routes
```php
// Not recommended - removes security layer
protected $except = [
    'api/*',
];
```

### Option 2: Remove Stateful Middleware
```php
// Not recommended - loses session benefits
// Remove from bootstrap/app.php
$middleware->api(prepend: [
    \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
]);
```

### Why We Chose the Current Solution
- Maintains full security
- Follows Laravel best practices
- Provides both session and token authentication
- No reduction in security posture

## Build Commands Used

```bash
# Clear caches
php artisan route:clear
php artisan config:clear

# Rebuild frontend
npm run build
```

## Status
✅ **FIXED** - All state-changing requests now include CSRF token
✅ **TESTED** - Password reset, edit, delete all working
✅ **DEPLOYED** - Frontend rebuilt and ready

## Date Fixed
- **Date:** October 1, 2025
- **Issue:** 419 CSRF Token Mismatch
- **Solution:** Added X-CSRF-TOKEN header to all API requests

---

**Note:** This fix applies to all admin pages making state-changing API requests. Any new pages should follow the same pattern of including CSRF tokens.
