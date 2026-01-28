<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $permissions = [
            // Dashboard & Analytics
            ['name' => 'dashboard.view', 'display_name' => 'View Dashboard', 'description' => 'Can view dashboard and overview', 'category' => 'Dashboard', 'module' => 'dashboard'],
            ['name' => 'analytics.view', 'display_name' => 'View Analytics', 'description' => 'Can view analytics and reports', 'category' => 'Dashboard', 'module' => 'analytics'],
            ['name' => 'analytics.export', 'display_name' => 'Export Analytics', 'description' => 'Can export analytics data', 'category' => 'Dashboard', 'module' => 'analytics'],

            // User Management
            ['name' => 'users.view', 'display_name' => 'View Users', 'description' => 'Can view user list and details', 'category' => 'User Management', 'module' => 'users'],
            ['name' => 'users.create', 'display_name' => 'Create Users', 'description' => 'Can create new user accounts', 'category' => 'User Management', 'module' => 'users'],
            ['name' => 'users.edit', 'display_name' => 'Edit Users', 'description' => 'Can edit user information', 'category' => 'User Management', 'module' => 'users'],
            ['name' => 'users.delete', 'display_name' => 'Delete Users', 'description' => 'Can delete user accounts', 'category' => 'User Management', 'module' => 'users'],
            ['name' => 'users.bulk_actions', 'display_name' => 'Bulk User Actions', 'description' => 'Can perform bulk operations on users', 'category' => 'User Management', 'module' => 'users'],
            ['name' => 'users.export', 'display_name' => 'Export Users', 'description' => 'Can export user data', 'category' => 'User Management', 'module' => 'users'],
            ['name' => 'users.change_status', 'display_name' => 'Change User Status', 'description' => 'Can activate/deactivate users', 'category' => 'User Management', 'module' => 'users'],
            ['name' => 'users.reset_password', 'display_name' => 'Reset User Password', 'description' => 'Can reset user passwords', 'category' => 'User Management', 'module' => 'users'],
            ['name' => 'users.impersonate', 'display_name' => 'Impersonate Users', 'description' => 'Can login as other users', 'category' => 'User Management', 'module' => 'users'],

            // Alumni Management
            ['name' => 'alumni.view', 'display_name' => 'View Alumni', 'description' => 'Can view alumni profiles', 'category' => 'Alumni Management', 'module' => 'alumni'],
            ['name' => 'alumni.view_own', 'display_name' => 'View Own Profile', 'description' => 'Can view own alumni profile', 'category' => 'Alumni Management', 'module' => 'alumni'],
            ['name' => 'alumni.edit', 'display_name' => 'Edit Alumni', 'description' => 'Can edit alumni profiles', 'category' => 'Alumni Management', 'module' => 'alumni'],
            ['name' => 'alumni.edit_own', 'display_name' => 'Edit Own Profile', 'description' => 'Can edit own alumni profile', 'category' => 'Alumni Management', 'module' => 'alumni'],
            ['name' => 'alumni.approve', 'display_name' => 'Approve Alumni', 'description' => 'Can approve pending alumni registrations', 'category' => 'Alumni Management', 'module' => 'alumni'],
            ['name' => 'alumni.delete', 'display_name' => 'Delete Alumni', 'description' => 'Can delete alumni profiles', 'category' => 'Alumni Management', 'module' => 'alumni'],
            ['name' => 'alumni.export', 'display_name' => 'Export Alumni Data', 'description' => 'Can export alumni data to CSV/Excel', 'category' => 'Alumni Management', 'module' => 'alumni'],
            ['name' => 'alumni.import', 'display_name' => 'Import Alumni Data', 'description' => 'Can import alumni data from files', 'category' => 'Alumni Management', 'module' => 'alumni'],
            ['name' => 'alumni.bulk_delete', 'display_name' => 'Bulk Delete Alumni', 'description' => 'Can bulk delete alumni profiles', 'category' => 'Alumni Management', 'module' => 'alumni'],
            ['name' => 'alumni.view_stats', 'display_name' => 'View Alumni Statistics', 'description' => 'Can view alumni statistics', 'category' => 'Alumni Management', 'module' => 'alumni'],
            ['name' => 'alumni.view_profile_details', 'display_name' => 'View Detailed Profiles', 'description' => 'Can view full alumni profile details', 'category' => 'Alumni Management', 'module' => 'alumni'],

            ['name' => 'batches.edit', 'display_name' => 'Edit Batches', 'description' => 'Can edit batch information', 'category' => 'Batch Management', 'module' => 'batches'],
            ['name' => 'batches.delete', 'display_name' => 'Delete Batches', 'description' => 'Can delete batches', 'category' => 'Batch Management', 'module' => 'batches'],
            ['name' => 'batches.view_stats', 'display_name' => 'View Batch Statistics', 'description' => 'Can view batch analytics', 'category' => 'Batch Management', 'module' => 'batches'],

            // Survey Managementedit', 'display_name' => 'Edit Batches', 'description' => 'Can edit batch information', 'category' => 'Batch Management', 'module' => 'batches'],
            ['name' => 'batches.delete', 'display_name' => 'Delete Batches', 'description' => 'Can delete batches', 'category' => 'Batch Management', 'module' => 'batches'],

            // Survey Management
            ['name' => 'surveys.view', 'display_name' => 'View Surveys', 'description' => 'Can view all surveys', 'category' => 'Survey Management', 'module' => 'surveys'],
            ['name' => 'surveys.create', 'display_name' => 'Create Surveys', 'description' => 'Can create new surveys', 'category' => 'Survey Management', 'module' => 'surveys'],
            ['name' => 'surveys.edit', 'display_name' => 'Edit Surveys', 'description' => 'Can edit existing surveys', 'category' => 'Survey Management', 'module' => 'surveys'],
            ['name' => 'surveys.delete', 'display_name' => 'Delete Surveys', 'description' => 'Can delete surveys', 'category' => 'Survey Management', 'module' => 'surveys'],
            ['name' => 'surveys.publish', 'display_name' => 'Publish Surveys', 'description' => 'Can publish and unpublish surveys', 'category' => 'Survey Management', 'module' => 'surveys'],
            ['name' => 'surveys.take', 'display_name' => 'Take Surveys', 'description' => 'Can respond to surveys', 'category' => 'Survey Management', 'module' => 'surveys'],
            ['name' => 'surveys.view_responses', 'display_name' => 'View Responses', 'description' => 'Can view survey responses', 'category' => 'Survey Management', 'module' => 'surveys'],
            ['name' => 'surveys.export_responses', 'display_name' => 'Export Responses', 'description' => 'Can export survey responses', 'category' => 'Survey Management', 'module' => 'surveys'],
            ['name' => 'surveys.export', 'display_name' => 'Export Surveys', 'description' => 'Can export survey templates', 'category' => 'Survey Management', 'module' => 'surveys'],
            ['name' => 'surveys.view_details', 'display_name' => 'View Survey Details', 'description' => 'Can view detailed survey info', 'category' => 'Survey Management', 'module' => 'surveys'],
            ['name' => 'survey_questions.create', 'display_name' => 'Create Questions', 'description' => 'Can add survey questions', 'category' => 'Survey Management', 'module' => 'surveys'],
            ['name' => 'survey_questions.edit', 'display_name' => 'Edit Questions', 'description' => 'Can edit survey questions', 'category' => 'Survey Management', 'module' => 'surveys'],
            ['name' => 'survey_questions.delete', 'display_name' => 'Delete Questions', 'description' => 'Can delete survey questions', 'category' => 'Survey Management', 'module' => 'surveys'],
            ['name' => 'survey_questions.reorder', 'display_name' => 'Reorder Questions', 'description' => 'Can reorder survey questions', 'category' => 'Survey Management', 'module' => 'surveys'],

            // Survey Analytics
            // Survey Analytics
            ['name' => 'survey_analytics.view', 'display_name' => 'View Survey Analytics', 'description' => 'Can view survey analytics', 'category' => 'Survey Management', 'module' => 'survey_analytics'],
            ['name' => 'departments.customize', 'display_name' => 'Customize Department Appearance', 'description' => 'Can customize department branding', 'category' => 'Department & Course Management', 'module' => 'departments'],
            ['name' => 'departments.view_analytics', 'display_name' => 'View Department Analytics', 'description' => 'Can view department analytics', 'category' => 'Department & Course Management', 'module' => 'departments'],

            // Course Managementment
            ['name' => 'departments.view', 'display_name' => 'View Departments', 'description' => 'Can view departments', 'category' => 'Department & Course Management', 'module' => 'departments'],
            ['name' => 'departments.create', 'display_name' => 'Create Departments', 'description' => 'Can create new departments', 'category' => 'Department & Course Management', 'module' => 'departments'],
            ['name' => 'departments.edit', 'display_name' => 'Edit Departments', 'description' => 'Can edit department information', 'category' => 'Department & Course Management', 'module' => 'departments'],
            ['name' => 'departments.delete', 'display_name' => 'Delete Departments', 'description' => 'Can delete departments', 'category' => 'Department & Course Management', 'module' => 'departments'],
            ['name' => 'departments.customize', 'display_name' => 'Customize Department Appearance', 'description' => 'Can customize department branding', 'category' => 'Department & Course Management', 'module' => 'departments'],
            // Email Templates
            ['name' => 'email_templates.view', 'display_name' => 'View Email Templates', 'description' => 'Can view email templates', 'category' => 'Communication', 'module' => 'email_templates'],
            ['name' => 'email_templates.create', 'display_name' => 'Create Email Templates', 'description' => 'Can create new email templates', 'category' => 'Communication', 'module' => 'email_templates'],
            ['name' => 'email_templates.edit', 'display_name' => 'Edit Email Templates', 'description' => 'Can edit email templates', 'category' => 'Communication', 'module' => 'email_templates'],
            ['name' => 'email_templates.delete', 'display_name' => 'Delete Email Templates', 'description' => 'Can delete email templates', 'category' => 'Communication', 'module' => 'email_templates'],
            ['name' => 'emails.send', 'display_name' => 'Send Emails', 'description' => 'Can send emails to users', 'category' => 'Communication', 'module' => 'emails'],
            ['name' => 'emails.send_bulk', 'display_name' => 'Send Bulk Emails', 'description' => 'Can send bulk emails', 'category' => 'Communication', 'module' => 'emails'],

            // Activity Logsses.delete', 'display_name' => 'Delete Courses', 'description' => 'Can delete courses', 'category' => 'Department & Course Management', 'module' => 'courses'],

            // Email Templates
            ['name' => 'email_templates.view', 'display_name' => 'View Email Templates', 'description' => 'Can view email templates', 'category' => 'Communication', 'module' => 'email_templates'],
            ['name' => 'email_templates.edit', 'display_name' => 'Edit Email Templates', 'description' => 'Can edit email templates', 'category' => 'Communication', 'module' => 'email_templates'],
            ['name' => 'emails.send', 'display_name' => 'Send Emails', 'description' => 'Can send emails to users', 'category' => 'Communication', 'module' => 'emails'],

            // Activity Logs
            ['name' => 'activity_logs.view', 'display_name' => 'View Activity Logs', 'description' => 'Can view system activity logs', 'category' => 'System Administration', 'module' => 'activity_logs'],
            ['name' => 'activity_logs.export', 'display_name' => 'Export Activity Logs', 'description' => 'Can export activity logs', 'category' => 'System Administration', 'module' => 'activity_logs'],

            // System Settings
            // Backup & Maintenance
            ['name' => 'system_metrics.view', 'display_name' => 'View System Metrics', 'description' => 'Can view system performance metrics', 'category' => 'System Administration', 'module' => 'system_settings'],
            ['name' => 'backup.create', 'display_name' => 'Create Backups', 'description' => 'Can create system backups', 'category' => 'System Administration', 'module' => 'backup'],
            ['name' => 'backup.download', 'display_name' => 'Download Backups', 'description' => 'Can download backup files', 'category' => 'System Administration', 'module' => 'backup'],
            ['name' => 'backup.delete', 'display_name' => 'Delete Backups', 'description' => 'Can delete backup files', 'category' => 'System Administration', 'module' => 'backup'],
            ['name' => 'backup.restore', 'display_name' => 'Restore Backups', 'description' => 'Can restore from backups', 'category' => 'System Administration', 'module' => 'backup'],
            ['name' => 'backup.export', 'display_name' => 'Export Data', 'description' => 'Can export system data', 'category' => 'System Administration', 'module' => 'backup'],
            ['name' => 'maintenance.toggle', 'display_name' => 'Toggle Maintenance Mode', 'description' => 'Can enable/disable maintenance mode', 'category' => 'System Administration', 'module' => 'maintenance'],
            ['name' => 'cache.clear', 'display_name' => 'Clear Cache', 'description' => 'Can clear system cache', 'category' => 'System Administration', 'module' => 'system_settings'],
            ['name' => 'system_info.view', 'display_name' => 'View System Info', 'description' => 'Can view system information', 'category' => 'System Administration', 'module' => 'system_settings'],
            ['name' => 'roles.delete', 'display_name' => 'Delete Roles', 'description' => 'Can delete custom roles', 'category' => 'Permissions & Roles', 'module' => 'roles'],
            ['name' => 'permissions.view', 'display_name' => 'View Permissions', 'description' => 'Can view all permissions', 'category' => 'Permissions & Roles', 'module' => 'permissions'],
            ['name' => 'permissions.create', 'display_name' => 'Create Permissions', 'description' => 'Can create new permissions', 'category' => 'Permissions & Roles', 'module' => 'permissions'],
            ['name' => 'permissions.edit', 'display_name' => 'Edit Permissions', 'description' => 'Can edit permissions', 'category' => 'Permissions & Roles', 'module' => 'permissions'],
            ['name' => 'permissions.assign', 'display_name' => 'Assign Permissions', 'description' => 'Can assign permissions to roles', 'category' => 'Permissions & Roles', 'module' => 'permissions'],
            // Two-Factor Authentication & Security
            ['name' => '2fa.manage', 'display_name' => 'Manage 2FA Settings', 'description' => 'Can manage 2FA settings', 'category' => 'Security', 'module' => '2fa'],
            ['name' => '2fa.enforce', 'display_name' => 'Enforce 2FA', 'description' => 'Can require 2FA for users', 'category' => 'Security', 'module' => '2fa'],
            ['name' => 'security.view_alerts', 'display_name' => 'View Security Alerts', 'description' => 'Can view security alerts', 'category' => 'Security', 'module' => 'security'],
            ['name' => 'security.manage_sessions', 'display_name' => 'Manage User Sessions', 'description' => 'Can terminate user sessions', 'category' => 'Security', 'module' => 'security'],

            // Profile Settingsexport', 'display_name' => 'Export Data', 'description' => 'Can export system data', 'category' => 'System Administration', 'module' => 'backup'],
            ['name' => 'maintenance.toggle', 'display_name' => 'Toggle Maintenance Mode', 'description' => 'Can enable/disable maintenance mode', 'category' => 'System Administration', 'module' => 'maintenance'],

            // Permissions & Roles
            ['name' => 'roles.view', 'display_name' => 'View Roles', 'description' => 'Can view roles and permissions', 'category' => 'Permissions & Roles', 'module' => 'roles'],
            ['name' => 'roles.create', 'display_name' => 'Create Roles', 'description' => 'Can create custom roles', 'category' => 'Permissions & Roles', 'module' => 'roles'],
            ['name' => 'roles.edit', 'display_name' => 'Edit Roles', 'description' => 'Can edit role permissions', 'category' => 'Permissions & Roles', 'module' => 'roles'],
            ['name' => 'roles.delete', 'display_name' => 'Delete Roles', 'description' => 'Can delete custom roles', 'category' => 'Permissions & Roles', 'module' => 'roles'],
            ['name' => 'permissions.assign', 'display_name' => 'Assign Permissions', 'description' => 'Can assign permissions to roles', 'category' => 'Permissions & Roles', 'module' => 'permissions'],
            ['name' => 'permissions.assign_users', 'display_name' => 'Assign User Permissions', 'description' => 'Can assign custom permissions to specific users', 'category' => 'Permissions & Roles', 'module' => 'permissions'],

            // Two-Factor Authentication
            ['name' => '2fa.manage', 'display_name' => 'Manage 2FA Settings', 'description' => 'Can manage 2FA settings', 'category' => 'Security', 'module' => '2fa'],
            ['name' => '2fa.enforce', 'display_name' => 'Enforce 2FA', 'description' => 'Can require 2FA for users', 'category' => 'Security', 'module' => '2fa'],

            // Profile Settings
            ['name' => 'profile.view', 'display_name' => 'View Own Profile', 'description' => 'Can view own profile', 'category' => 'Profile', 'module' => 'profile'],
            ['name' => 'profile.edit', 'display_name' => 'Edit Own Profile', 'description' => 'Can edit own profile', 'category' => 'Profile', 'module' => 'profile'],
            ['name' => 'profile.change_password', 'display_name' => 'Change Password', 'description' => 'Can change own password', 'category' => 'Profile', 'module' => 'profile'],
        ];

        foreach ($permissions as $permission) {
            DB::table('permissions')->insert([
                'name' => $permission['name'],
                'display_name' => $permission['display_name'],
                'description' => $permission['description'],
                'category' => $permission['category'],
                'module' => $permission['module'],
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Create default roles
        $roles = [
            [
                'name' => 'super_admin',
                'display_name' => 'Super Administrator',
                'description' => 'Full system access with all permissions',
                'is_system_role' => true,
            ],
            [
                'name' => 'admin',
                'display_name' => 'Administrator',
                'description' => 'Manage users, alumni, and surveys',
                'is_system_role' => true,
            ],
            [
                'name' => 'alumni',
                'display_name' => 'Alumni',
                'description' => 'Limited access to view and update own profile',
                'is_system_role' => true,
            ],
        ];

        foreach ($roles as $role) {
            DB::table('roles')->insert([
                'name' => $role['name'],
                'display_name' => $role['display_name'],
                'description' => $role['description'],
                'is_system_role' => $role['is_system_role'],
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Assign all permissions to super_admin
        $superAdminId = DB::table('roles')->where('name', 'super_admin')->first()->id;
        $allPermissions = DB::table('permissions')->get();
        
        foreach ($allPermissions as $permission) {
            DB::table('permission_role')->insert([
                'permission_id' => $permission->id,
                'role_id' => $superAdminId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Assign permissions to admin role
        $adminId = DB::table('roles')->where('name', 'admin')->first()->id;
        $adminPermissions = [
            'dashboard.view', 'analytics.view', 'analytics.export',
            'users.view', 'users.create', 'users.edit', 'users.export', 'users.change_status', 'users.reset_password',
            'alumni.view', 'alumni.edit', 'alumni.approve', 'alumni.export', 'alumni.import', 'alumni.view_stats', 'alumni.view_profile_details',
            'batches.view', 'batches.create', 'batches.edit', 'batches.view_stats',
            'surveys.view', 'surveys.create', 'surveys.edit', 'surveys.delete', 'surveys.publish', 'surveys.duplicate', 
            'surveys.view_responses', 'surveys.export_responses', 'surveys.export', 'surveys.view_details',
            'survey_questions.create', 'survey_questions.edit', 'survey_questions.delete', 'survey_questions.reorder',
            'survey_analytics.view', 'survey_analytics.download',
            'departments.view', 'courses.view',
            'email_templates.view', 'email_templates.create', 'emails.send',
            'activity_logs.view',
            'roles.view', 'permissions.view',
            'profile.view', 'profile.edit', 'profile.change_password',
        ];

        foreach ($adminPermissions as $permName) {
            $perm = DB::table('permissions')->where('name', $permName)->first();
            if ($perm) {
                DB::table('permission_role')->insert([
                    'permission_id' => $perm->id,
                    'role_id' => $adminId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        // Assign permissions to alumni role
        $alumniId = DB::table('roles')->where('name', 'alumni')->first()->id;
        $alumniPermissions = [
            'alumni.view_own', 'alumni.edit_own',
            'surveys.view', 'surveys.take',
            'profile.view', 'profile.edit', 'profile.change_password',
        ];

        foreach ($alumniPermissions as $permName) {
            $perm = DB::table('permissions')->where('name', $permName)->first();
            if ($perm) {
                DB::table('permission_role')->insert([
                    'permission_id' => $perm->id,
                    'role_id' => $alumniId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }
}
