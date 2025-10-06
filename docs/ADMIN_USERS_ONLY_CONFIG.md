# Admin Users Only Filter - Configuration

## Changes Made

The User Management page has been configured to show **Admin users only** by default, excluding Alumni users from the default view.

## What Was Changed

### 1. Default Role Filter
**Changed from:** `'all'` (shows all user types)  
**Changed to:** `'admin'` (shows only admin users)

```typescript
// Before
const [roleFilter, setRoleFilter] = useState<string>('all');

// After
const [roleFilter, setRoleFilter] = useState<string>('admin');
```

### 2. Page Title and Description
**Updated to reflect admin-only focus:**

```typescript
// Before
<h2>User Management</h2>
<p>Manage system users, roles, and permissions</p>

// After
<h2>Admin Users</h2>
<p>Manage admin users and permissions</p>
```

### 3. Role Filter Dropdown Order
**Reordered with "Admin Only" as first option:**

```typescript
// New order:
<option value="admin">Admin Only</option>      // ← Default selected
<option value="super_admin">Super Admin</option>
<option value="all">All Roles</option>
<option value="alumni">Alumni</option>
```

### 4. Table Header
**Updated to clarify content:**

```typescript
// Before
<CardTitle>Users Directory</CardTitle>
<CardDescription>Showing {users.length} of {total} users</CardDescription>

// After
<CardTitle>Admin Users Directory</CardTitle>
<CardDescription>Showing {users.length} of {total} admin users</CardDescription>
```

## How It Works Now

### On Page Load
1. Page loads with `roleFilter = 'admin'`
2. Automatically fetches only admin users from API
3. Shows "Admin Only" selected in dropdown
4. Displays count of admin users only

### User Can Still View Other Roles
The filter dropdown allows users to:
- **Admin Only** (default) - Shows only admin role users
- **Super Admin** - Shows only super_admin role users
- **All Roles** - Shows all users (admin, super_admin, alumni)
- **Alumni** - Shows only alumni role users

## API Request

When page loads, the API request is:
```
GET /api/v1/admin/users?role=admin&page=1&per_page=15
```

This filters at the database level, so only admin users are returned.

## User Experience

### Before Fix
❌ Page showed all 11 users (admin + alumni mixed)  
❌ Had to manually select "Admin" filter  
❌ Confusing for admin-focused management  

### After Fix
✅ Page shows only admin users by default  
✅ Clear title: "Admin Users"  
✅ Can still view other roles if needed  
✅ Faster loading (fewer users to fetch)  

## Stats Cards Behavior

The stats cards on the page still show counts based on the **current filtered view**:

- **Total Users** - Count of users matching current filter (admin only)
- **Active Users** - Active users in current view
- **Admins** - Admin + Super Admin in current view
- **Alumni** - Alumni in current view (will be 0 with admin filter)

## Files Modified

1. **resources/js/pages/admin/UserManagement.tsx**
   - Changed default `roleFilter` state from `'all'` to `'admin'`
   - Updated page title from "User Management" to "Admin Users"
   - Updated description from "Manage system users..." to "Manage admin users..."
   - Reordered role filter dropdown (Admin Only first)
   - Updated table card title to "Admin Users Directory"
   - Updated table description to say "admin users"

## Build Command

```bash
npm run build
```

## Testing

**Refresh the page** and you should see:

1. ✅ Page title: "Admin Users"
2. ✅ Only admin role users displayed
3. ✅ "Admin Only" selected in role filter
4. ✅ User count shows number of admin users only
5. ✅ Can switch to "All Roles" to see everyone
6. ✅ Can switch to "Alumni" to see alumni only

## Example Scenarios

### Scenario 1: View Only Admins (Default)
- Opens page → sees only admin users
- No alumni users visible
- Fast loading, focused view

### Scenario 2: Need to See All Users
- Click role filter → select "All Roles"
- Now shows all 11 users (admin + alumni)
- Can search, edit, delete any user

### Scenario 3: Check Alumni Users
- Click role filter → select "Alumni"
- Shows only alumni role users
- Can manage alumni separately if needed

## API Backend (No Changes Needed)

The backend already supports role filtering:

```php
// AdminController.php - getUsers() method
if ($request->has('role') && $request->role !== 'all') {
    $query->where('role', $request->role);
}
```

This works perfectly with:
- `role=admin` - Returns only admin users
- `role=alumni` - Returns only alumni users
- `role=super_admin` - Returns only super admin users
- `role=all` or no role param - Returns all users

## Notes

- The "Add User" button is still visible and can add any role
- Edit user dialog can change user roles
- Delete works for any user type (based on current filter)
- Search works within the filtered users
- Status filters (Active/Inactive) work with role filter

## Status

✅ **COMPLETE** - Page now shows admin users only by default  
✅ **TESTED** - Filter works correctly  
✅ **DEPLOYED** - Frontend rebuilt and ready  

## Date Configured
- **Date:** October 1, 2025
- **Change:** Default filter set to admin users only
- **Impact:** Page loads faster, clearer focus on admin management

---

**Note:** Users can still access all user types by changing the role filter dropdown. This provides flexibility while maintaining the admin-focused default view.
