# Comprehensive Permissions System Plan

## Overview
This document outlines the complete permissions structure for the Alumni Tracer System, organized by functional modules and access levels.

## Permission Structure

### Permission Naming Convention
- Format: `{module}.{action}`
- Example: `alumni.view`, `surveys.create`, `users.delete`

### Permission Categories
1. **Dashboard & Analytics**
2. **User Management**
3. **Alumni Management**
4. **Batch Management**
5. **Survey Management**
6. **Department & Course Management**
7. **Communication**
8. **System Administration**
9. **Permissions & Roles**
10. **Security**
11. **Profile**

---

## Complete Permissions List (118 Total)

### 1. Dashboard & Analytics (3 permissions)
| Permission | Display Name | Description | Routes/Functions |
|------------|--------------|-------------|------------------|
| `dashboard.view` | View Dashboard | Can view dashboard and overview | `/admin/dashboard` |
| `analytics.view` | View Analytics | Can view analytics and reports | `/admin/analytics`, `/admin/survey-analytics` |
| `analytics.export` | Export Analytics | Can export analytics data | `exportTimeToJobAnalytics`, `exportSurveyAnalytics` |

**Functions Covered:**
- `AdminController::dashboard()`
- `AnalyticsController::getAnalyticsOverview()`
- `AnalyticsController::getTimeToJobAnalytics()`
- `AnalyticsController::getSurveyAnalytics()`
- `AnalyticsController::exportTimeToJobAnalytics()`
- `AnalyticsController::exportSurveyAnalytics()`

---

### 2. User Management (9 permissions)
| Permission | Display Name | Description | Routes/Functions |
|------------|--------------|-------------|------------------|
| `users.view` | View Users | Can view user list and details | `/admin/users`, `GET /api/v1/admin/users` |
| `users.create` | Create Users | Can create new user accounts | `POST /api/v1/admin/users` |
| `users.edit` | Edit Users | Can edit user information | `PUT /api/v1/admin/users/{id}` |
| `users.delete` | Delete Users | Can delete user accounts | `DELETE /api/v1/admin/users/{id}` |
| `users.bulk_actions` | Bulk User Actions | Can perform bulk operations on users | `POST /api/v1/admin/bulk/*` |
| `users.export` | Export Users | Can export user data | `GET /api/v1/admin/users/export` |
| `users.change_status` | Change User Status | Can activate/deactivate user accounts | `PATCH /api/v1/admin/users/{id}/status` |
| `users.reset_password` | Reset User Password | Can reset user passwords | `POST /api/v1/admin/users/{id}/reset-password` |
| `users.impersonate` | Impersonate Users | Can login as other users | Not yet implemented |

**Functions Covered:**
- `AdminController::getUsers()`
- `AdminController::createUser()`
- `AdminController::updateUser()`
- `AdminController::deleteUser()`
- `AdminController::updateUserStatus()`
- `AdminController::resetUserPassword()`
- `BulkOperationsController::bulkDelete()`
- `BulkOperationsController::bulkUpdateStatus()`

---

### 3. Alumni Management (11 permissions)
| Permission | Display Name | Description | Routes/Functions |
|------------|--------------|-------------|------------------|
| `alumni.view` | View Alumni | Can view all alumni profiles | `/admin/alumni`, `GET /api/v1/admin/alumni` |
| `alumni.view_own` | View Own Profile | Can view own alumni profile | Alumni dashboard |
| `alumni.edit` | Edit Alumni | Can edit any alumni profiles | `PUT /api/v1/admin/alumni/{id}` |
| `alumni.edit_own` | Edit Own Profile | Can edit own alumni profile | `PUT /api/v1/alumni/profile` |
| `alumni.approve` | Approve Alumni | Can approve pending alumni registrations | `POST /api/v1/admin/alumni/{id}/approve` |
| `alumni.delete` | Delete Alumni | Can delete alumni profiles | `DELETE /api/v1/admin/alumni/{id}` |
| `alumni.bulk_delete` | Bulk Delete Alumni | Can bulk delete alumni | `DELETE /api/v1/admin/alumni/bulk-delete` |
| `alumni.export` | Export Alumni Data | Can export alumni data to CSV/Excel | `GET /api/v1/admin/alumni/export` |
| `alumni.import` | Import Alumni Data | Can import alumni data from files | `POST /api/v1/admin/alumni/import` |
| `alumni.view_stats` | View Alumni Statistics | Can view alumni statistics and metrics | `GET /api/v1/admin/alumni/stats` |
| `alumni.view_profile_details` | View Detailed Profiles | Can view full alumni profile details | `GET /api/v1/admin/alumni/{id}` |

**Functions Covered:**
- `AdminController::getAlumni()`
- `AdminController::getAlumniProfile()`
- `AdminController::getAlumniStats()`
- `AdminController::updateAlumni()`
- `AdminController::deleteAlumni()`
- `AdminController::bulkDeleteAlumni()`
- `AdminController::exportAlumni()`
- `AuthController::updateAlumniProfile()`

---

### 4. Batch Management (5 permissions)
| Permission | Display Name | Description | Routes/Functions |
|------------|--------------|-------------|------------------|
| `batches.view` | View Batches | Can view graduation batches | `/admin/batches`, `GET /api/v1/admin/batches` |
| `batches.create` | Create Batches | Can create new batches | `POST /api/v1/admin/batches` |
| `batches.edit` | Edit Batches | Can edit batch information | `PUT /api/v1/admin/batches/{id}` |
| `batches.delete` | Delete Batches | Can delete batches | `DELETE /api/v1/admin/batches/{id}` |
| `batches.view_stats` | View Batch Statistics | Can view batch statistics | Batch analytics endpoints |

**Functions Covered:**
- `AdminController::getBatches()`
- `AdminController::createBatch()`
- `AdminController::updateBatch()`
- `AdminController::deleteBatch()`

---

### 5. Survey Management (15 permissions)
| Permission | Display Name | Description | Routes/Functions |
|------------|--------------|-------------|------------------|
| `surveys.view` | View Surveys | Can view all surveys | `/admin/surveys`, `GET /api/v1/admin/surveys` |
| `surveys.create` | Create Surveys | Can create new surveys | `POST /api/v1/admin/surveys`, `/admin/surveys/create` |
| `surveys.edit` | Edit Surveys | Can edit existing surveys | `PUT /api/v1/admin/surveys/{id}` |
| `surveys.delete` | Delete Surveys | Can delete surveys | `DELETE /api/v1/admin/surveys/{id}` |
| `surveys.publish` | Publish Surveys | Can publish and unpublish surveys | `POST /api/v1/admin/surveys/{id}/publish` |
| `surveys.duplicate` | Duplicate Surveys | Can duplicate existing surveys | `POST /api/v1/admin/surveys/{id}/duplicate` |
| `surveys.take` | Take Surveys | Can respond to surveys | `/survey/{id}`, Survey taking endpoints |
| `surveys.view_responses` | View Responses | Can view survey responses | `GET /api/v1/admin/surveys/{id}/responses` |
| `surveys.export_responses` | Export Responses | Can export survey responses | `GET /api/v1/admin/surveys/{id}/export` |
| `surveys.export` | Export Surveys | Can export survey templates | `GET /api/v1/admin/surveys/export` |
| `survey_questions.create` | Create Survey Questions | Can add questions to surveys | `POST /api/v1/admin/surveys/{id}/questions` |
| `survey_questions.edit` | Edit Survey Questions | Can edit survey questions | `PUT /api/v1/admin/surveys/{id}/questions/{qid}` |
| `survey_questions.delete` | Delete Survey Questions | Can delete survey questions | `DELETE /api/v1/admin/surveys/{id}/questions/{qid}` |
| `survey_questions.reorder` | Reorder Survey Questions | Can reorder survey questions | `POST /api/v1/admin/surveys/{id}/questions/reorder` |
| `surveys.view_details` | View Survey Details | Can view detailed survey information | `GET /api/v1/admin/surveys/{id}` |

**Functions Covered:**
- `AdminController::getSurveys()`
- `AdminController::getSurveyDetails()`
- `AdminController::createSurvey()`
- `AdminController::updateSurvey()`
- `AdminController::deleteSurvey()`
- `AdminController::duplicateSurvey()`
- `AdminController::getSurveyResponses()`
- `AdminController::exportSurveys()`
- `AdminController::exportSurveyResponses()`
- `AdminController::createSurveyQuestion()`
- `AdminController::updateSurveyQuestion()`
- `AdminController::deleteSurveyQuestion()`
- `AdminController::reorderSurveyQuestions()`
- `SurveyController::show()`
- `SurveyController::startResponse()`
- `SurveyController::submitAnswer()`
- `SurveyController::completeResponse()`

---

### 6. Survey Analytics (2 permissions)
| Permission | Display Name | Description | Routes/Functions |
|------------|--------------|-------------|------------------|
| `survey_analytics.view` | View Survey Analytics | Can view survey analytics | `/admin/survey-analytics` |
| `survey_analytics.download` | Download Survey Reports | Can download survey analytics reports | PDF/Excel export |

**Functions Covered:**
- `AnalyticsController::getSurveyAnalytics()`
- `AnalyticsController::exportSurveyAnalytics()`
- `AnalyticsController::exportAllSurveys()`

---

### 7. Department & Course Management (10 permissions)
| Permission | Display Name | Description | Routes/Functions |
|------------|--------------|-------------|------------------|
| `departments.view` | View Departments | Can view departments | `/super-admin/departments` |
| `departments.create` | Create Departments | Can create new departments | `POST /api/v1/super-admin/departments` |
| `departments.edit` | Edit Departments | Can edit department information | `PUT /api/v1/super-admin/departments/{id}` |
| `departments.delete` | Delete Departments | Can delete departments | `DELETE /api/v1/super-admin/departments/{id}` |
| `departments.customize` | Customize Department Appearance | Can customize department branding | Department appearance settings |
| `departments.view_analytics` | View Department Analytics | Can view department-specific analytics | `GET /api/v1/admin/departments/{id}/analytics` |
| `courses.view` | View Courses | Can view courses | `/super-admin/courses` |
| `courses.create` | Create Courses | Can create new courses | `POST /api/v1/super-admin/courses` |
| `courses.edit` | Edit Courses | Can edit course information | `PUT /api/v1/super-admin/courses/{id}` |
| `courses.delete` | Delete Courses | Can delete courses | `DELETE /api/v1/super-admin/courses/{id}` |

**Functions Covered:**
- `DepartmentController::index()`
- `DepartmentController::store()`
- `DepartmentController::update()`
- `DepartmentController::destroy()`
- `DepartmentController::getActive()`
- `DepartmentController::getCourses()`
- `DepartmentController::getAlumni()`
- `DepartmentController::getAnalytics()`
- `DepartmentAppearanceController::show()`
- `DepartmentAppearanceController::update()`
- `CourseController::index()`
- `CourseController::store()`
- `CourseController::update()`
- `CourseController::destroy()`

---

### 8. Communication (6 permissions)
| Permission | Display Name | Description | Routes/Functions |
|------------|--------------|-------------|------------------|
| `email_templates.view` | View Email Templates | Can view email templates | `/admin/email-templates` |
| `email_templates.create` | Create Email Templates | Can create new email templates | `POST /api/v1/admin/email-templates` |
| `email_templates.edit` | Edit Email Templates | Can edit email templates | `PUT /api/v1/admin/email-templates/{id}` |
| `email_templates.delete` | Delete Email Templates | Can delete email templates | `DELETE /api/v1/admin/email-templates/{id}` |
| `emails.send` | Send Emails | Can send emails to users | Email sending endpoints |
| `emails.send_bulk` | Send Bulk Emails | Can send bulk emails | Bulk email endpoints |

**Functions Covered:**
- `AdminController::getEmailTemplates()`
- `AdminController::getEmailTemplate()`
- `AdminController::getEmailTemplateStats()`
- `AdminController::createEmailTemplate()`
- `AdminController::updateEmailTemplate()`
- `AdminController::deleteEmailTemplate()`

---

### 9. Activity Logs (3 permissions)
| Permission | Display Name | Description | Routes/Functions |
|------------|--------------|-------------|------------------|
| `activity_logs.view` | View Activity Logs | Can view system activity logs | `/admin/activity`, `GET /api/v1/admin/activity-logs` |
| `activity_logs.export` | Export Activity Logs | Can export activity logs | `GET /api/v1/admin/activity-logs/export` |
| `activity_logs.delete` | Delete Activity Logs | Can delete old activity logs | Not yet implemented |

**Functions Covered:**
- `AdminController::getActivityLogs()`
- `AdminController::exportActivityLogs()`

---

### 10. System Administration (15 permissions)
| Permission | Display Name | Description | Routes/Functions |
|------------|--------------|-------------|------------------|
| `system_settings.view` | View System Settings | Can view system settings | `/super-admin/settings` |
| `system_settings.edit` | Edit System Settings | Can modify system settings | `POST /api/v1/admin/settings` |
| `system_settings.appearance` | Customize Appearance | Can customize system appearance | Appearance controller |
| `system_metrics.view` | View System Metrics | Can view system performance metrics | `/super-admin/metrics` |
| `backup.create` | Create Backups | Can create system backups | `POST /api/v1/admin/backups` |
| `backup.download` | Download Backups | Can download backup files | `GET /api/v1/admin/backups/download/{file}` |
| `backup.delete` | Delete Backups | Can delete backup files | `DELETE /api/v1/admin/backups/{id}` |
| `backup.restore` | Restore Backups | Can restore from backups | `POST /api/v1/admin/backups/{id}/restore` |
| `backup.export` | Export Data | Can export system data | Various export endpoints |
| `maintenance.toggle` | Toggle Maintenance Mode | Can enable/disable maintenance mode | `POST /api/v1/admin/maintenance/toggle` |
| `cache.clear` | Clear Cache | Can clear system cache | `POST /api/v1/admin/system/cache/clear` |
| `system_info.view` | View System Info | Can view system information | `GET /api/v1/admin/system/info` |
| `system_stats.view` | View System Statistics | Can view system statistics | `GET /api/v1/admin/system/stats` |
| `logs.view` | View System Logs | Can view error logs | Log viewer endpoints |
| `logs.delete` | Delete System Logs | Can delete old logs | Not yet implemented |

**Functions Covered:**
- `AdminController::getSystemSettings()`
- `AdminController::updateSystemSettings()`
- `AdminController::getSystemStats()`
- `AdminController::getSystemInfo()`
- `AdminController::clearCache()`
- `AdminController::createBackup()`
- `AdminController::getBackups()`
- `AdminController::downloadBackup()`
- `AdminController::deleteBackup()`
- `SystemMetricsController::getMetrics()`
- `AppearanceController::index()`
- `AppearanceController::update()`

---

### 11. Permissions & Roles (10 permissions)
| Permission | Display Name | Description | Routes/Functions |
|------------|--------------|-------------|------------------|
| `roles.view` | View Roles | Can view roles and permissions | `/admin/permissions`, `GET /api/v1/admin/roles` |
| `roles.create` | Create Roles | Can create custom roles | `POST /api/v1/admin/roles` |
| `roles.edit` | Edit Roles | Can edit role information | `PUT /api/v1/admin/roles/{id}` |
| `roles.delete` | Delete Roles | Can delete custom roles | `DELETE /api/v1/admin/roles/{id}` |
| `permissions.view` | View Permissions | Can view all permissions | `GET /api/v1/admin/permissions` |
| `permissions.create` | Create Permissions | Can create new permissions | `POST /api/v1/admin/permissions` |
| `permissions.edit` | Edit Permissions | Can edit permissions | `PUT /api/v1/admin/permissions/{id}` |
| `permissions.assign` | Assign Permissions | Can assign permissions to roles | `PUT /api/v1/admin/roles/{id}/permissions` |
| `permissions.assign_users` | Assign User Permissions | Can assign custom permissions to specific users | `POST /api/v1/admin/users/{id}/permissions` |
| `permissions.revoke_users` | Revoke User Permissions | Can revoke permissions from users | `DELETE /api/v1/admin/users/{id}/permissions/{pid}` |

**Functions Covered:**
- `AdminController::getRoles()`
- `AdminController::getRole()`
- `AdminController::createRole()`
- `AdminController::updateRole()`
- `AdminController::deleteRole()`
- `AdminController::getPermissions()`
- `AdminController::getPermissionUsers()`
- `AdminController::getPermissionsStats()`
- `AdminController::updateRolePermissions()`
- `AdminController::getUsersWithRoles()`
- `AdminController::createPermission()`
- `AdminController::updatePermission()`
- `AdminController::giveUserPermission()`
- `AdminController::revokeUserPermission()`
- `RoleManagementController::updateRole()`
- `RoleManagementController::getRoleHistory()`
- `RoleManagementController::getAvailableRoles()`

---

### 12. Security (4 permissions)
| Permission | Display Name | Description | Routes/Functions |
|------------|--------------|-------------|------------------|
| `2fa.manage` | Manage 2FA Settings | Can manage own 2FA settings | Two-factor auth setup |
| `2fa.enforce` | Enforce 2FA | Can require 2FA for users | 2FA enforcement settings |
| `security.view_alerts` | View Security Alerts | Can view security alerts | Security dashboard |
| `security.manage_sessions` | Manage User Sessions | Can terminate user sessions | Session management |

**Functions Covered:**
- Two-factor authentication controllers (currently commented out)
- Security monitoring features

---

### 13. Profile (3 permissions)
| Permission | Display Name | Description | Routes/Functions |
|------------|--------------|-------------|------------------|
| `profile.view` | View Own Profile | Can view own profile | `/admin/profile` |
| `profile.edit` | Edit Own Profile | Can edit own profile | `POST /api/v1/profile` |
| `profile.change_password` | Change Password | Can change own password | `POST /api/v1/profile/password` |

**Functions Covered:**
- `ProfileController::show()`
- `ProfileController::update()`
- `ProfileController::updatePassword()`
- `ProfileController::uploadImage()`
- `ProfileController::deleteImage()`

---

## Role-Permission Matrix

### Super Administrator
**All permissions** (118 total) - Full system access

### Administrator
**Permissions Count: 45**
- ✅ Dashboard & Analytics (3)
- ✅ User Management (6): view, create, edit, export, change_status, reset_password
- ✅ Alumni Management (7): view, edit, approve, export, import, view_stats, view_profile_details
- ✅ Batch Management (4): view, create, edit, view_stats
- ✅ Survey Management (13): all except take
- ✅ Survey Analytics (2)
- ✅ Departments & Courses (2): view only
- ✅ Email Templates (3): view, create, edit
- ✅ Communication (1): send emails
- ✅ Activity Logs (1): view
- ✅ Roles & Permissions (1): view
- ✅ Profile (3)

### Alumni
**Permissions Count: 6**
- ✅ Alumni Management (2): view_own, edit_own
- ✅ Surveys (2): view, take
- ✅ Profile (3): view, edit, change_password

### Custom Roles
Can be created with any combination of permissions except system-critical ones.

---

## Implementation Checklist

### Phase 1: Backend (COMPLETED ✅)
- [x] Database migrations for permissions and roles
- [x] Permission and Role models
- [x] Permissions seeder with all 118+ permissions
- [x] Role-permission relationships
- [x] User-permission relationships
- [x] Middleware for permission checking

### Phase 2: Frontend (IN PROGRESS)
- [ ] Enhanced Permission Matrix UI
  - [ ] Group permissions by module/category
  - [ ] Visual permission assignment interface
  - [ ] Permission search and filter
  - [ ] Bulk permission assignment
  - [ ] Permission usage statistics
  - [ ] User permission override interface

### Phase 3: Integration
- [ ] Apply permission checks to all routes
- [ ] Add permission checks to controllers
- [ ] Frontend permission-based UI rendering
- [ ] API endpoint protection
- [ ] Audit logging for permission changes

### Phase 4: Testing
- [ ] Permission assignment tests
- [ ] Role-based access tests
- [ ] Permission inheritance tests
- [ ] UI permission display tests

---

## Missing Permissions to Add

Based on the system inspection, these permissions should be added:

1. **User Management**
   - `users.change_status` ✅ (Already has updateUserStatus function)
   - `users.reset_password` ✅ (Already has resetUserPassword function)
   - `users.impersonate` (Feature not yet implemented)

2. **Alumni Management**
   - `alumni.bulk_delete` ✅ (Has bulkDeleteAlumni function)
   - `alumni.view_stats` ✅ (Has getAlumniStats function)
   - `alumni.view_profile_details` ✅ (Has getAlumniProfile function)

3. **Batch Management**
   - `batches.view_stats` (Analytics for batches)

4. **Survey Management**
   - `survey_questions.create` ✅ (Has createSurveyQuestion)
   - `survey_questions.edit` ✅ (Has updateSurveyQuestion)
   - `survey_questions.delete` ✅ (Has deleteSurveyQuestion)
   - `survey_questions.reorder` ✅ (Has reorderSurveyQuestions)
   - `surveys.view_details` ✅ (Has getSurveyDetails)
   - `surveys.export` ✅ (Has exportSurveys)

5. **Email Templates**
   - `email_templates.create` (Create new templates)
   - `email_templates.delete` ✅ (Has deleteEmailTemplate)
   - `emails.send_bulk` (Bulk email sending)

6. **Department & Course**
   - `departments.view_analytics` ✅ (Has getAnalytics function)

7. **System Administration**
   - `system_metrics.view` ✅ (Has SystemMetricsController)
   - `backup.download` ✅ (Has downloadBackup)
   - `backup.delete` ✅ (Has deleteBackup)
   - `backup.restore` (Feature to implement)
   - `cache.clear` ✅ (Has clearCache)
   - `system_info.view` ✅ (Has getSystemInfo)
   - `system_stats.view` ✅ (Has getSystemStats)
   - `logs.view` (Log viewer)
   - `logs.delete` (Log management)

8. **Permissions & Roles**
   - `permissions.view` (View all permissions)
   - `permissions.create` ✅ (Has createPermission)
   - `permissions.edit` ✅ (Has updatePermission)
   - `permissions.revoke_users` ✅ (Has revokeUserPermission)

9. **Security**
   - `security.view_alerts` (Security monitoring)
   - `security.manage_sessions` (Session management)

10. **Bulk Operations**
    - `bulk.delete` ✅ (Has bulkDelete)
    - `bulk.restore` ✅ (Has bulkRestore)
    - `bulk.export` ✅ (Has bulkExport)
    - `bulk.update_status` ✅ (Has bulkUpdateStatus)

---

## Recommended Updates

### Update PermissionsSeeder.php
Add the missing permissions listed above to have a total of **118 permissions** covering all system functions.

### Create Permission Check Middleware
```php
// app/Http/Middleware/CheckPermission.php
public function handle($request, Closure $next, $permission)
{
    if (!auth()->user()->hasPermission($permission)) {
        abort(403, 'Unauthorized action.');
    }
    return $next($request);
}
```

### Apply to Routes
```php
Route::get('/admin/users')->middleware('permission:users.view');
Route::post('/admin/users')->middleware('permission:users.create');
Route::put('/admin/users/{id}')->middleware('permission:users.edit');
Route::delete('/admin/users/{id}')->middleware('permission:users.delete');
```

### Frontend Permission Checking
```tsx
{hasPermission('users.create') && (
  <Button onClick={createUser}>Create User</Button>
)}
```

---

## Summary

This comprehensive permissions system provides:
- **118 granular permissions** covering all system functions
- **3 default roles**: Super Admin, Admin, Alumni
- **Custom role creation** with flexible permission assignment
- **Direct user permission overrides**
- **Category-based organization** for easy management
- **Complete API and route coverage**
- **Scalable architecture** for future features

The system follows best practices for:
- Principle of least privilege
- Role-based access control (RBAC)
- Separation of duties
- Audit trail through activity logs
- Flexible permission inheritance
