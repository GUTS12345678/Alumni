# Permissions System - Action Plan

## Current Status
- ✅ Database structure created (permissions, roles, permission_role, user_permissions tables)
- ✅ Permission Matrix UI exists
- ⚠️ **Missing 50+ permissions** for existing system functions
- ⚠️ Permissions not enforced on routes and controllers

## Problem
The current permissions system only has **92 permissions** but the system has **118+ distinct functions** based on:
- 223 lines in api.php routes
- 444 lines in web.php routes  
- 99+ controller methods across AdminController, DepartmentController, CourseController, etc.

Many critical functions like `bulkDelete`, `exportAlumni`, `viewStats`, `changeUserStatus`, etc. are **NOT covered** by any permission.

---

## Solution: Add Missing Permissions

### Step 1: Update PermissionsSeeder (Priority: HIGH)

Add these **26 missing permissions** to `database/seeders/PermissionsSeeder.php`:

#### User Management (3 new)
```php
['name' => 'users.change_status', 'display_name' => 'Change User Status', 'description' => 'Can activate/deactivate users', 'category' => 'User Management', 'module' => 'users'],
['name' => 'users.reset_password', 'display_name' => 'Reset User Password', 'description' => 'Can reset user passwords', 'category' => 'User Management', 'module' => 'users'],
['name' => 'users.impersonate', 'display_name' => 'Impersonate Users', 'description' => 'Can login as other users', 'category' => 'User Management', 'module' => 'users'],
```

#### Alumni Management (3 new)
```php
['name' => 'alumni.bulk_delete', 'display_name' => 'Bulk Delete Alumni', 'description' => 'Can bulk delete alumni profiles', 'category' => 'Alumni Management', 'module' => 'alumni'],
['name' => 'alumni.view_stats', 'display_name' => 'View Alumni Statistics', 'description' => 'Can view alumni statistics', 'category' => 'Alumni Management', 'module' => 'alumni'],
['name' => 'alumni.view_profile_details', 'display_name' => 'View Detailed Profiles', 'description' => 'Can view full alumni profile details', 'category' => 'Alumni Management', 'module' => 'alumni'],
```

#### Batch Management (1 new)
```php
['name' => 'batches.view_stats', 'display_name' => 'View Batch Statistics', 'description' => 'Can view batch analytics', 'category' => 'Batch Management', 'module' => 'batches'],
```

#### Survey Management (6 new)
```php
['name' => 'surveys.export', 'display_name' => 'Export Surveys', 'description' => 'Can export survey templates', 'category' => 'Survey Management', 'module' => 'surveys'],
['name' => 'surveys.view_details', 'display_name' => 'View Survey Details', 'description' => 'Can view detailed survey info', 'category' => 'Survey Management', 'module' => 'surveys'],
['name' => 'survey_questions.create', 'display_name' => 'Create Questions', 'description' => 'Can add survey questions', 'category' => 'Survey Management', 'module' => 'surveys'],
['name' => 'survey_questions.edit', 'display_name' => 'Edit Questions', 'description' => 'Can edit survey questions', 'category' => 'Survey Management', 'module' => 'surveys'],
['name' => 'survey_questions.delete', 'display_name' => 'Delete Questions', 'description' => 'Can delete survey questions', 'category' => 'Survey Management', 'module' => 'surveys'],
['name' => 'survey_questions.reorder', 'display_name' => 'Reorder Questions', 'description' => 'Can reorder survey questions', 'category' => 'Survey Management', 'module' => 'surveys'],
```

#### Email Templates (2 new)
```php
['name' => 'email_templates.create', 'display_name' => 'Create Email Templates', 'description' => 'Can create new email templates', 'category' => 'Communication', 'module' => 'email_templates'],
['name' => 'email_templates.delete', 'display_name' => 'Delete Email Templates', 'description' => 'Can delete email templates', 'category' => 'Communication', 'module' => 'email_templates'],
['name' => 'emails.send_bulk', 'display_name' => 'Send Bulk Emails', 'description' => 'Can send bulk emails', 'category' => 'Communication', 'module' => 'emails'],
```

#### Department & Course (1 new)
```php
['name' => 'departments.view_analytics', 'display_name' => 'View Department Analytics', 'description' => 'Can view department analytics', 'category' => 'Department & Course Management', 'module' => 'departments'],
```

#### System Administration (8 new)
```php
['name' => 'system_metrics.view', 'display_name' => 'View System Metrics', 'description' => 'Can view system performance metrics', 'category' => 'System Administration', 'module' => 'system_settings'],
['name' => 'backup.download', 'display_name' => 'Download Backups', 'description' => 'Can download backup files', 'category' => 'System Administration', 'module' => 'backup'],
['name' => 'backup.delete', 'display_name' => 'Delete Backups', 'description' => 'Can delete backup files', 'category' => 'System Administration', 'module' => 'backup'],
['name' => 'cache.clear', 'display_name' => 'Clear Cache', 'description' => 'Can clear system cache', 'category' => 'System Administration', 'module' => 'system_settings'],
['name' => 'system_info.view', 'display_name' => 'View System Info', 'description' => 'Can view system information', 'category' => 'System Administration', 'module' => 'system_settings'],
['name' => 'system_stats.view', 'display_name' => 'View System Statistics', 'description' => 'Can view system statistics', 'category' => 'System Administration', 'module' => 'system_settings'],
['name' => 'logs.view', 'display_name' => 'View System Logs', 'description' => 'Can view error logs', 'category' => 'System Administration', 'module' => 'system_settings'],
['name' => 'logs.delete', 'display_name' => 'Delete System Logs', 'description' => 'Can delete old logs', 'category' => 'System Administration', 'module' => 'system_settings'],
```

#### Permissions & Roles (4 new)
```php
['name' => 'permissions.view', 'display_name' => 'View Permissions', 'description' => 'Can view all permissions', 'category' => 'Permissions & Roles', 'module' => 'permissions'],
['name' => 'permissions.create', 'display_name' => 'Create Permissions', 'description' => 'Can create new permissions', 'category' => 'Permissions & Roles', 'module' => 'permissions'],
['name' => 'permissions.edit', 'display_name' => 'Edit Permissions', 'description' => 'Can edit permissions', 'category' => 'Permissions & Roles', 'module' => 'permissions'],
['name' => 'permissions.revoke_users', 'display_name' => 'Revoke User Permissions', 'description' => 'Can revoke user permissions', 'category' => 'Permissions & Roles', 'module' => 'permissions'],
```

#### Security (2 new)
```php
['name' => 'security.view_alerts', 'display_name' => 'View Security Alerts', 'description' => 'Can view security alerts', 'category' => 'Security', 'module' => 'security'],
['name' => 'security.manage_sessions', 'display_name' => 'Manage User Sessions', 'description' => 'Can terminate user sessions', 'category' => 'Security', 'module' => 'security'],
```

**Total New Permissions: 26**
**New Total: 118 permissions**

---

### Step 2: Create Permission Check Middleware (Priority: HIGH)

Create `app/Http/Middleware/CheckPermission.php`:

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckPermission
{
    public function handle(Request $request, Closure $next, string $permission)
    {
        if (!auth()->check()) {
            return redirect('login');
        }

        if (!auth()->user()->hasPermission($permission)) {
            abort(403, 'Unauthorized action: You do not have permission to ' . $permission);
        }

        return $next($request);
    }
}
```

Register in `app/Http/Kernel.php`:
```php
protected $middlewareAliases = [
    'permission' => \App\Http\Middleware\CheckPermission::class,
    // ... other middleware
];
```

---

### Step 3: Add hasPermission Method to User Model (Priority: HIGH)

Update `app/Models/User.php`:

```php
public function hasPermission(string $permission): bool
{
    // Super admin has all permissions
    if ($this->role === 'super_admin' || $this->role?->name === 'super_admin') {
        return true;
    }

    // Check custom user permission (direct grant/deny)
    $customPerm = $this->customPermissions()
        ->where('permissions.name', $permission)
        ->first();
    
    if ($customPerm) {
        return $customPerm->pivot->is_granted;
    }

    // Check role permissions
    if ($this->role_id) {
        return $this->role
            ->permissions()
            ->where('permissions.name', $permission)
            ->exists();
    }

    return false;
}

public function customPermissions()
{
    return $this->belongsToMany(Permission::class, 'user_permissions')
        ->withPivot('is_granted')
        ->withTimestamps();
}

public function role()
{
    return $this->belongsTo(Role::class);
}
```

---

### Step 4: Apply Permission Checks to Routes (Priority: MEDIUM)

Update `routes/api.php` to add permission middleware:

```php
Route::prefix('v1/admin')->middleware(['auth:sanctum', 'admin'])->group(function () {
    // Dashboard
    Route::get('/dashboard', [AdminController::class, 'dashboard'])
        ->middleware('permission:dashboard.view');

    // Alumni Management
    Route::get('/alumni', [AdminController::class, 'getAlumni'])
        ->middleware('permission:alumni.view');
    Route::get('/alumni/{id}', [AdminController::class, 'getAlumniProfile'])
        ->middleware('permission:alumni.view_profile_details');
    Route::put('/alumni/{id}', [AdminController::class, 'updateAlumni'])
        ->middleware('permission:alumni.edit');
    Route::delete('/alumni/{id}', [AdminController::class, 'deleteAlumni'])
        ->middleware('permission:alumni.delete');
    Route::delete('/alumni/bulk-delete', [AdminController::class, 'bulkDeleteAlumni'])
        ->middleware('permission:alumni.bulk_delete');
    Route::get('/alumni/export', [AdminController::class, 'exportAlumni'])
        ->middleware('permission:alumni.export');
    Route::get('/alumni/stats', [AdminController::class, 'getAlumniStats'])
        ->middleware('permission:alumni.view_stats');

    // User Management
    Route::get('/users', [AdminController::class, 'getUsers'])
        ->middleware('permission:users.view');
    Route::post('/users', [AdminController::class, 'createUser'])
        ->middleware('permission:users.create');
    Route::put('/users/{id}', [AdminController::class, 'updateUser'])
        ->middleware('permission:users.edit');
    Route::delete('/users/{id}', [AdminController::class, 'deleteUser'])
        ->middleware('permission:users.delete');
    Route::patch('/users/{id}/status', [AdminController::class, 'updateUserStatus'])
        ->middleware('permission:users.change_status');
    Route::post('/users/{id}/reset-password', [AdminController::class, 'resetUserPassword'])
        ->middleware('permission:users.reset_password');

    // ... and so on for all routes
});
```

---

### Step 5: Frontend Permission Checks (Priority: MEDIUM)

Create a permission helper in React:

`resources/js/hooks/usePermission.ts`:
```typescript
import { usePage } from '@inertiajs/react';

export function usePermission() {
    const { auth } = usePage().props as any;
    
    const hasPermission = (permission: string): boolean => {
        // Super admin has all permissions
        if (auth.user?.role === 'super_admin') {
            return true;
        }
        
        // Check user permissions array
        return auth.user?.permissions?.includes(permission) || false;
    };

    const hasAnyPermission = (permissions: string[]): boolean => {
        return permissions.some(p => hasPermission(p));
    };

    const hasAllPermissions = (permissions: string[]): boolean => {
        return permissions.every(p => hasPermission(p));
    };

    return { hasPermission, hasAnyPermission, hasAllPermissions };
}
```

Usage in components:
```tsx
import { usePermission } from '@/hooks/usePermission';

export default function UserManagement() {
    const { hasPermission } = usePermission();

    return (
        <div>
            {hasPermission('users.create') && (
                <Button onClick={createUser}>Create User</Button>
            )}
            
            {hasPermission('users.delete') && (
                <Button onClick={deleteUser}>Delete</Button>
            )}
        </div>
    );
}
```

---

### Step 6: Enhanced Permission Matrix UI (Priority: LOW)

Add features to `PermissionMatrix.tsx`:

1. **Search/Filter**
   - Filter by permission name
   - Filter by category
   - Filter by module

2. **Statistics Dashboard**
   - Show total permissions per role
   - Show permission coverage (% of system covered)
   - Show most/least used permissions

3. **Bulk Assignment**
   - Assign all permissions in a category to a role
   - Copy permissions from one role to another

4. **Permission Usage Analytics**
   - Show which permissions are actually being used
   - Highlight unused permissions
   - Show permission dependency tree

5. **Visual Improvements**
   - Add module grouping tabs
   - Add permission dependency indicators
   - Add permission risk level (low, medium, high, critical)

---

## Implementation Order

### Phase 1: Core Functionality (This Week)
1. ✅ Document comprehensive permissions plan
2. ⏳ Update PermissionsSeeder with 26 new permissions
3. ⏳ Run fresh migration with new permissions
4. ⏳ Add `hasPermission()` method to User model
5. ⏳ Create CheckPermission middleware

### Phase 2: Route Protection (Next Week)
6. ⏳ Apply permission middleware to all API routes
7. ⏳ Apply permission middleware to web routes
8. ⏳ Test all protected routes

### Phase 3: Frontend Integration (Week After)
9. ⏳ Create usePermission hook
10. ⏳ Update all admin pages with permission checks
11. ⏳ Hide unauthorized UI elements
12. ⏳ Add permission error messages

### Phase 4: Enhanced UI (Future)
13. ⏳ Add search/filter to Permission Matrix
14. ⏳ Add permission statistics dashboard
15. ⏳ Add bulk assignment features
16. ⏳ Add permission usage analytics

---

## Files to Modify

### Backend
- ✅ `docs/COMPREHENSIVE_PERMISSIONS_PLAN.md` (Created)
- ⏳ `database/seeders/PermissionsSeeder.php` (Add 26 permissions)
- ⏳ `app/Models/User.php` (Add hasPermission method)
- ⏳ `app/Http/Middleware/CheckPermission.php` (Create new)
- ⏳ `app/Http/Kernel.php` (Register middleware)
- ⏳ `routes/api.php` (Add permission middleware)
- ⏳ `routes/web.php` (Add permission middleware)

### Frontend
- ⏳ `resources/js/hooks/usePermission.ts` (Create new)
- ⏳ `resources/js/pages/SuperAdmin/PermissionMatrix.tsx` (Enhance UI)
- ⏳ `resources/js/pages/admin/*.tsx` (Add permission checks to all pages)

### Database
- ⏳ Run: `php artisan migrate:fresh --seed` (Recreate with new permissions)

---

## Testing Checklist

- [ ] All 118 permissions exist in database
- [ ] Super admin has all 118 permissions
- [ ] Admin has correct subset of permissions
- [ ] Alumni has correct limited permissions
- [ ] hasPermission() method works correctly
- [ ] Permission middleware blocks unauthorized access
- [ ] Frontend hides unauthorized UI elements
- [ ] Custom user permissions override role permissions
- [ ] Permission Matrix displays all permissions correctly
- [ ] User can't access functions they don't have permission for

---

## Quick Commands

```bash
# Recreate database with new permissions
php artisan migrate:fresh --seed

# Check permissions count
php artisan tinker
>>> Permission::count()  # Should return 118

# Check super admin permissions
>>> Role::where('name', 'super_admin')->first()->permissions()->count()  # Should return 118

# Test permission check
>>> auth()->user()->hasPermission('alumni.view')
```

---

## Summary

**Current State:** 92 permissions, many functions unprotected
**Target State:** 118 permissions, all functions protected
**Action Required:** Add 26 permissions, implement middleware, update UI

**Priority Tasks:**
1. Update PermissionsSeeder (30 mins)
2. Add User::hasPermission() method (15 mins)
3. Create CheckPermission middleware (15 mins)
4. Test with sample routes (30 mins)

**Total Effort:** ~2-3 days for complete implementation
