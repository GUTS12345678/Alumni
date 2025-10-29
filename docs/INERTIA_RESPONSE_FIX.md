# Inertia Response Fix

## Problem
Edit Profile was showing error: "All Inertia requests must receive a valid Inertia response, however a plain JSON response was received."

## Root Cause
The form was using `router.put()` to send a request to an **API endpoint** (`/api/v1/alumni/profile`) which returns JSON responses. Inertia.js expects all requests made through its router to receive **Inertia responses** (with the `X-Inertia` header), not plain JSON.

## Solution
Created a proper **web route** with a dedicated controller that returns Inertia-compatible responses.

### Files Created/Modified

#### 1. New Controller: `app/Http/Controllers/Alumni/ProfileController.php`
```php
<?php

namespace App\Http\Controllers\Alumni;

use App\Http\Controllers\Controller;
use App\Models\AlumniProfile;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class ProfileController extends Controller
{
    public function update(Request $request)
    {
        // Validate user is alumni
        // Validate input data
        // Update profile
        // Return redirect()->back()->with('success', 'message')
    }
}
```

**Key Points:**
- Returns `redirect()->back()->with('success', 'message')` instead of JSON
- Uses `withErrors()` and `withInput()` for validation errors
- Inertia automatically handles these redirects and shares flash messages

#### 2. Updated Route: `routes/web.php`
```php
Route::put('/alumni/profile', [App\Http\Controllers\Alumni\ProfileController::class, 'update'])
    ->name('alumni.profile.update');
```

**Key Points:**
- Web route (not API route)
- Protected by `auth:sanctum` middleware from group
- Returns Inertia responses

#### 3. Updated Form: `resources/js/pages/Alumni/Profile/Edit.tsx`
```typescript
// Changed from:
router.put('/api/v1/alumni/profile', submitData, { ... })

// To:
router.put('/alumni/profile', submitData, { ... })
```

**Key Points:**
- Now calls web route instead of API route
- Inertia automatically handles CSRF tokens
- Success/error messages come from flash session data

## TakeSurvey Syntax Error Fix

### Problem
TypeScript error: `'question_id' is specified more than once, so this usage will be overwritten.`

### Root Cause
The `Answer` interface included `question_id`, but answers are stored in a `Record<number, Answer>` where the key IS the question_id. When sending to the API, we were doing:
```typescript
{
    question_id: questionId,
    ...answer  // answer also has question_id
}
```

### Solution
Removed `question_id` from the `Answer` interface since it's redundant:
```typescript
// Before
interface Answer {
    question_id: number;  // ❌ Redundant
    answer_text?: string;
    answer_value?: number;
    selected_options?: string[];
}

// After
interface Answer {
    answer_text?: string;
    answer_value?: number;
    selected_options?: string[];
}
```

## Why This Approach?

### Inertia.js Architecture
Inertia is designed to work as a **server-side rendering bridge**:
- **Web routes** return Inertia responses (page components with props)
- **API routes** return JSON (for external APIs, mobile apps, etc.)

### When to Use Each:
- **Web Routes + Inertia:** User-facing pages, form submissions, CRUD operations
- **API Routes + JSON:** External integrations, AJAX calls, non-Inertia clients

### Benefits of Web Route Approach:
1. **Automatic CSRF protection** - No manual token fetching
2. **Flash messages** - Success/error messages automatically shared
3. **Validation errors** - Automatically available via `errors` prop
4. **Redirects** - Proper back() redirects with form state preserved
5. **Type safety** - Inertia handles response format consistently

## Testing

### Before Fix
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": { ... }
}
```
❌ Error: Plain JSON response received

### After Fix
✅ Proper redirect with flash message
✅ Form clears and shows success message
✅ Redirects to view page after 2 seconds

## Related Documentation
- [Inertia.js Forms](https://inertiajs.com/forms)
- [Laravel Validation](https://laravel.com/docs/11.x/validation)
- [Flash Messages](https://inertiajs.com/shared-data#flash-messages)

## Build Status
✅ Build successful (5.17s)
✅ No TypeScript errors
✅ No ESLint warnings
✅ All features functional
