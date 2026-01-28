<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add 26 new permissions that were missing
        $newPermissions = [
            // User Management (3 new)
            ['name' => 'users.change_status', 'display_name' => 'Change User Status', 'description' => 'Can activate/deactivate users', 'category' => 'User Management', 'module' => 'users'],
            ['name' => 'users.reset_password', 'display_name' => 'Reset User Password', 'description' => 'Can reset user passwords', 'category' => 'User Management', 'module' => 'users'],
            ['name' => 'users.impersonate', 'display_name' => 'Impersonate Users', 'description' => 'Can login as other users', 'category' => 'User Management', 'module' => 'users'],

            // Alumni Management (3 new)
            ['name' => 'alumni.bulk_delete', 'display_name' => 'Bulk Delete Alumni', 'description' => 'Can bulk delete alumni profiles', 'category' => 'Alumni Management', 'module' => 'alumni'],
            ['name' => 'alumni.view_stats', 'display_name' => 'View Alumni Statistics', 'description' => 'Can view alumni statistics', 'category' => 'Alumni Management', 'module' => 'alumni'],
            ['name' => 'alumni.view_profile_details', 'display_name' => 'View Detailed Profiles', 'description' => 'Can view full alumni profile details', 'category' => 'Alumni Management', 'module' => 'alumni'],

            // Batch Management (1 new)
            ['name' => 'batches.view_stats', 'display_name' => 'View Batch Statistics', 'description' => 'Can view batch analytics', 'category' => 'Batch Management', 'module' => 'batches'],

            // Survey Management (6 new)
            ['name' => 'surveys.export', 'display_name' => 'Export Surveys', 'description' => 'Can export survey templates', 'category' => 'Survey Management', 'module' => 'surveys'],
            ['name' => 'surveys.view_details', 'display_name' => 'View Survey Details', 'description' => 'Can view detailed survey info', 'category' => 'Survey Management', 'module' => 'surveys'],
            ['name' => 'survey_questions.create', 'display_name' => 'Create Questions', 'description' => 'Can add survey questions', 'category' => 'Survey Management', 'module' => 'surveys'],
            ['name' => 'survey_questions.edit', 'display_name' => 'Edit Questions', 'description' => 'Can edit survey questions', 'category' => 'Survey Management', 'module' => 'surveys'],
            ['name' => 'survey_questions.delete', 'display_name' => 'Delete Questions', 'description' => 'Can delete survey questions', 'category' => 'Survey Management', 'module' => 'surveys'],
            ['name' => 'survey_questions.reorder', 'display_name' => 'Reorder Questions', 'description' => 'Can reorder survey questions', 'category' => 'Survey Management', 'module' => 'surveys'],

            // Email Templates (3 new)
            ['name' => 'email_templates.create', 'display_name' => 'Create Email Templates', 'description' => 'Can create new email templates', 'category' => 'Communication', 'module' => 'email_templates'],
            ['name' => 'email_templates.delete', 'display_name' => 'Delete Email Templates', 'description' => 'Can delete email templates', 'category' => 'Communication', 'module' => 'email_templates'],
            ['name' => 'emails.send_bulk', 'display_name' => 'Send Bulk Emails', 'description' => 'Can send bulk emails', 'category' => 'Communication', 'module' => 'emails'],

            // Department & Course (1 new)
            ['name' => 'departments.view_analytics', 'display_name' => 'View Department Analytics', 'description' => 'Can view department analytics', 'category' => 'Department & Course Management', 'module' => 'departments'],

            // System Administration (8 new)
            ['name' => 'system_metrics.view', 'display_name' => 'View System Metrics', 'description' => 'Can view system performance metrics', 'category' => 'System Administration', 'module' => 'system_settings'],
            ['name' => 'backup.download', 'display_name' => 'Download Backups', 'description' => 'Can download backup files', 'category' => 'System Administration', 'module' => 'backup'],
            ['name' => 'backup.delete', 'display_name' => 'Delete Backups', 'description' => 'Can delete backup files', 'category' => 'System Administration', 'module' => 'backup'],
            ['name' => 'cache.clear', 'display_name' => 'Clear Cache', 'description' => 'Can clear system cache', 'category' => 'System Administration', 'module' => 'system_settings'],
            ['name' => 'system_info.view', 'display_name' => 'View System Info', 'description' => 'Can view system information', 'category' => 'System Administration', 'module' => 'system_settings'],
            ['name' => 'system_stats.view', 'display_name' => 'View System Statistics', 'description' => 'Can view system statistics', 'category' => 'System Administration', 'module' => 'system_settings'],
            ['name' => 'logs.view', 'display_name' => 'View System Logs', 'description' => 'Can view error logs', 'category' => 'System Administration', 'module' => 'system_settings'],
            ['name' => 'logs.delete', 'display_name' => 'Delete System Logs', 'description' => 'Can delete old logs', 'category' => 'System Administration', 'module' => 'system_settings'],

            // Permissions & Roles (4 new)
            ['name' => 'permissions.view', 'display_name' => 'View Permissions', 'description' => 'Can view all permissions', 'category' => 'Permissions & Roles', 'module' => 'permissions'],
            ['name' => 'permissions.create', 'display_name' => 'Create Permissions', 'description' => 'Can create new permissions', 'category' => 'Permissions & Roles', 'module' => 'permissions'],
            ['name' => 'permissions.edit', 'display_name' => 'Edit Permissions', 'description' => 'Can edit permissions', 'category' => 'Permissions & Roles', 'module' => 'permissions'],
            ['name' => 'permissions.revoke_users', 'display_name' => 'Revoke User Permissions', 'description' => 'Can revoke user permissions', 'category' => 'Permissions & Roles', 'module' => 'permissions'],

            // Security (2 new)
            ['name' => 'security.view_alerts', 'display_name' => 'View Security Alerts', 'description' => 'Can view security alerts', 'category' => 'Security', 'module' => 'security'],
            ['name' => 'security.manage_sessions', 'display_name' => 'Manage User Sessions', 'description' => 'Can terminate user sessions', 'category' => 'Security', 'module' => 'security'],
        ];

        // Insert new permissions
        foreach ($newPermissions as $permission) {
            // Check if permission already exists
            $exists = DB::table('permissions')->where('name', $permission['name'])->exists();
            
            if (!$exists) {
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
        }

        // Assign all new permissions to super_admin role
        $superAdmin = DB::table('roles')->where('name', 'super_admin')->first();
        if ($superAdmin) {
            $allPermissions = DB::table('permissions')->get();
            foreach ($allPermissions as $permission) {
                // Check if permission is already assigned
                $exists = DB::table('permission_role')
                    ->where('role_id', $superAdmin->id)
                    ->where('permission_id', $permission->id)
                    ->exists();
                
                if (!$exists) {
                    DB::table('permission_role')->insert([
                        'role_id' => $superAdmin->id,
                        'permission_id' => $permission->id,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }

        // Assign specific new permissions to admin role
        $admin = DB::table('roles')->where('name', 'admin')->first();
        if ($admin) {
            $adminNewPermissions = [
                'users.change_status',
                'users.reset_password',
                'alumni.view_stats',
                'alumni.view_profile_details',
                'batches.view_stats',
                'surveys.export',
                'surveys.view_details',
                'survey_questions.create',
                'survey_questions.edit',
                'survey_questions.delete',
                'survey_questions.reorder',
                'email_templates.create',
                'permissions.view',
            ];

            foreach ($adminNewPermissions as $permName) {
                $permission = DB::table('permissions')->where('name', $permName)->first();
                if ($permission) {
                    $exists = DB::table('permission_role')
                        ->where('role_id', $admin->id)
                        ->where('permission_id', $permission->id)
                        ->exists();
                    
                    if (!$exists) {
                        DB::table('permission_role')->insert([
                            'role_id' => $admin->id,
                            'permission_id' => $permission->id,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove the 26 new permissions
        $permissionsToRemove = [
            'users.change_status', 'users.reset_password', 'users.impersonate',
            'alumni.bulk_delete', 'alumni.view_stats', 'alumni.view_profile_details',
            'batches.view_stats',
            'surveys.export', 'surveys.view_details', 
            'survey_questions.create', 'survey_questions.edit', 'survey_questions.delete', 'survey_questions.reorder',
            'email_templates.create', 'email_templates.delete', 'emails.send_bulk',
            'departments.view_analytics',
            'system_metrics.view', 'backup.download', 'backup.delete', 'cache.clear', 
            'system_info.view', 'system_stats.view', 'logs.view', 'logs.delete',
            'permissions.view', 'permissions.create', 'permissions.edit', 'permissions.revoke_users',
            'security.view_alerts', 'security.manage_sessions',
        ];

        // Delete permission assignments first
        DB::table('permission_role')
            ->whereIn('permission_id', function($query) use ($permissionsToRemove) {
                $query->select('id')
                    ->from('permissions')
                    ->whereIn('name', $permissionsToRemove);
            })
            ->delete();

        // Then delete the permissions
        DB::table('permissions')->whereIn('name', $permissionsToRemove)->delete();
    }
};
