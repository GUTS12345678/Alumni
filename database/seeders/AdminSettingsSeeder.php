<?php

namespace Database\Seeders;

use App\Models\AdminSetting;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class AdminSettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $settings = [
            // General Settings
            [
                'key' => 'app_name',
                'value' => 'Alumni Tracer System',
                'type' => 'text',
                'category' => 'general',
                'description' => 'Application name displayed throughout the system',
                'is_public' => true
            ],
            [
                'key' => 'app_tagline',
                'value' => 'Tracking Alumni Success',
                'type' => 'text',
                'category' => 'general',
                'description' => 'Application tagline or motto',
                'is_public' => true
            ],
            [
                'key' => 'timezone',
                'value' => 'Asia/Manila',
                'type' => 'text',
                'category' => 'general',
                'description' => 'Default timezone for the application',
                'is_public' => true
            ],
            [
                'key' => 'date_format',
                'value' => 'Y-m-d',
                'type' => 'text',
                'category' => 'general',
                'description' => 'Date format used in the system',
                'is_public' => true
            ],
            [
                'key' => 'items_per_page',
                'value' => '25',
                'type' => 'number',
                'category' => 'general',
                'description' => 'Default number of items per page in lists',
                'is_public' => true
            ],

            // Email Settings
            [
                'key' => 'smtp_host',
                'value' => 'smtp.mailtrap.io',
                'type' => 'text',
                'category' => 'email',
                'description' => 'SMTP server hostname',
                'is_public' => false
            ],
            [
                'key' => 'smtp_port',
                'value' => '587',
                'type' => 'number',
                'category' => 'email',
                'description' => 'SMTP server port',
                'is_public' => false
            ],
            [
                'key' => 'smtp_username',
                'value' => '',
                'type' => 'text',
                'category' => 'email',
                'description' => 'SMTP authentication username',
                'is_public' => false
            ],
            [
                'key' => 'smtp_password',
                'value' => '',
                'type' => 'text',
                'category' => 'email',
                'description' => 'SMTP authentication password',
                'is_public' => false
            ],
            [
                'key' => 'smtp_encryption',
                'value' => 'tls',
                'type' => 'text',
                'category' => 'email',
                'description' => 'SMTP encryption method (tls or ssl)',
                'is_public' => false
            ],
            [
                'key' => 'mail_from_address',
                'value' => 'noreply@alumni-tracer.edu',
                'type' => 'email',
                'category' => 'email',
                'description' => 'Default sender email address',
                'is_public' => false
            ],
            [
                'key' => 'mail_from_name',
                'value' => 'Alumni Tracer System',
                'type' => 'text',
                'category' => 'email',
                'description' => 'Default sender name',
                'is_public' => false
            ],

            // Notification Settings
            [
                'key' => 'enable_email_notifications',
                'value' => '1',
                'type' => 'boolean',
                'category' => 'notifications',
                'description' => 'Enable or disable email notifications',
                'is_public' => false
            ],
            [
                'key' => 'enable_browser_notifications',
                'value' => '1',
                'type' => 'boolean',
                'category' => 'notifications',
                'description' => 'Enable browser push notifications',
                'is_public' => true
            ],
            [
                'key' => 'notify_on_new_alumni',
                'value' => '1',
                'type' => 'boolean',
                'category' => 'notifications',
                'description' => 'Send notification when new alumni registers',
                'is_public' => false
            ],
            [
                'key' => 'notify_on_survey_submission',
                'value' => '1',
                'type' => 'boolean',
                'category' => 'notifications',
                'description' => 'Send notification when survey is submitted',
                'is_public' => false
            ],
            [
                'key' => 'notification_email',
                'value' => 'admin@alumni-tracer.edu',
                'type' => 'email',
                'category' => 'notifications',
                'description' => 'Email address for admin notifications',
                'is_public' => false
            ],

            // Security Settings
            [
                'key' => 'session_timeout',
                'value' => '120',
                'type' => 'number',
                'category' => 'security',
                'description' => 'Session timeout in minutes',
                'is_public' => false
            ],
            [
                'key' => 'max_login_attempts',
                'value' => '5',
                'type' => 'number',
                'category' => 'security',
                'description' => 'Maximum login attempts before lockout',
                'is_public' => false
            ],
            [
                'key' => 'lockout_duration',
                'value' => '15',
                'type' => 'number',
                'category' => 'security',
                'description' => 'Account lockout duration in minutes',
                'is_public' => false
            ],
            [
                'key' => 'require_email_verification',
                'value' => '1',
                'type' => 'boolean',
                'category' => 'security',
                'description' => 'Require email verification for new accounts',
                'is_public' => false
            ],
            [
                'key' => 'password_min_length',
                'value' => '8',
                'type' => 'number',
                'category' => 'security',
                'description' => 'Minimum password length',
                'is_public' => true
            ],
            [
                'key' => 'enable_two_factor',
                'value' => '0',
                'type' => 'boolean',
                'category' => 'security',
                'description' => 'Enable two-factor authentication',
                'is_public' => false
            ],

            // Maintenance Settings
            [
                'key' => 'maintenance_mode',
                'value' => '0',
                'type' => 'boolean',
                'category' => 'maintenance',
                'description' => 'Enable maintenance mode',
                'is_public' => false
            ],
            [
                'key' => 'auto_backup',
                'value' => '1',
                'type' => 'boolean',
                'category' => 'maintenance',
                'description' => 'Enable automatic database backups',
                'is_public' => false
            ],
            [
                'key' => 'backup_frequency',
                'value' => 'daily',
                'type' => 'text',
                'category' => 'maintenance',
                'description' => 'Backup frequency (daily, weekly, monthly)',
                'is_public' => false
            ],
            [
                'key' => 'backup_retention_days',
                'value' => '30',
                'type' => 'number',
                'category' => 'maintenance',
                'description' => 'Number of days to retain backups',
                'is_public' => false
            ],
            [
                'key' => 'enable_logging',
                'value' => '1',
                'type' => 'boolean',
                'category' => 'maintenance',
                'description' => 'Enable system activity logging',
                'is_public' => false
            ],
            [
                'key' => 'log_level',
                'value' => 'info',
                'type' => 'text',
                'category' => 'maintenance',
                'description' => 'Logging level (debug, info, warning, error)',
                'is_public' => false
            ],
        ];

        foreach ($settings as $setting) {
            AdminSetting::updateOrCreate(
                ['key' => $setting['key']],
                $setting
            );
        }

        $this->command->info('✅ Created ' . count($settings) . ' system settings');
    }
}
