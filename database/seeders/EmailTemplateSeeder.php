<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\EmailTemplate;
use App\Models\User;

class EmailTemplateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $adminUser = User::where('role', 'admin')->first();
        $createdBy = $adminUser?->id;

        $templates = [
            [
                'name' => 'Welcome Email',
                'subject' => 'Welcome to Alumni Tracer System, {{first_name}}!',
                'body' => '<h2>Welcome {{first_name}} {{last_name}}!</h2><p>Thank you for joining our Alumni Tracer System. We\'re excited to have you as part of our community.</p><p>Your account has been successfully created with the email: {{email}}</p><p>Best regards,<br>The Alumni Relations Team</p>',
                'category' => 'Onboarding',
                'type' => 'notification',
                'status' => 'active',
                'variables' => ['first_name', 'last_name', 'email'],
                'usage_count' => 45,
                'last_sent_at' => now()->subDays(2),
                'created_by' => $createdBy,
            ],
            [
                'name' => 'Survey Invitation',
                'subject' => 'You\'re invited to participate in our {{survey_title}}',
                'body' => '<h2>Hello {{first_name}}!</h2><p>We invite you to participate in our latest survey: <strong>{{survey_title}}</strong></p><p>Your feedback is valuable and helps us improve our services.</p><p>Click here to start: <a href="{{survey_link}}">Take Survey</a></p><p>This survey will take approximately {{estimated_time}} minutes to complete.</p><p>Thank you for your time!</p>',
                'category' => 'Surveys',
                'type' => 'survey',
                'status' => 'active',
                'variables' => ['first_name', 'survey_title', 'survey_link', 'estimated_time'],
                'usage_count' => 128,
                'last_sent_at' => now()->subDays(1),
                'created_by' => $createdBy,
            ],
            [
                'name' => 'Survey Completion Thank You',
                'subject' => 'Thank you for completing {{survey_title}}',
                'body' => '<h2>Thank you, {{first_name}}!</h2><p>We appreciate you taking the time to complete our survey: <strong>{{survey_title}}</strong></p><p>Your responses have been recorded and will help us better serve our alumni community.</p><p>Best regards,<br>Alumni Relations Team</p>',
                'category' => 'Surveys',
                'type' => 'notification',
                'status' => 'active',
                'variables' => ['first_name', 'survey_title'],
                'usage_count' => 98,
                'last_sent_at' => now()->subHours(12),
                'created_by' => $createdBy,
            ],
            [
                'name' => 'Survey Reminder',
                'subject' => 'Reminder: Complete our {{survey_title}}',
                'body' => '<h2>Hi {{first_name}},</h2><p>This is a friendly reminder to complete our survey: <strong>{{survey_title}}</strong></p><p>You started this survey on {{start_date}} but haven\'t completed it yet.</p><p><a href="{{survey_link}}">Continue Survey</a></p><p>The survey closes on {{deadline}}.</p>',
                'category' => 'Surveys',
                'type' => 'reminder',
                'status' => 'active',
                'variables' => ['first_name', 'survey_title', 'survey_link', 'start_date', 'deadline'],
                'usage_count' => 67,
                'last_sent_at' => now()->subDays(3),
                'created_by' => $createdBy,
            ],
            [
                'name' => 'Alumni Event Announcement',
                'subject' => 'Join us for {{event_name}}',
                'body' => '<h2>You\'re Invited!</h2><p>Dear {{first_name}},</p><p>We\'re excited to announce our upcoming event: <strong>{{event_name}}</strong></p><p><strong>Date:</strong> {{event_date}}<br><strong>Time:</strong> {{event_time}}<br><strong>Location:</strong> {{event_location}}</p><p>{{event_description}}</p><p><a href="{{rsvp_link}}">RSVP Now</a></p>',
                'category' => 'Events',
                'type' => 'announcement',
                'status' => 'active',
                'variables' => ['first_name', 'event_name', 'event_date', 'event_time', 'event_location', 'event_description', 'rsvp_link'],
                'usage_count' => 234,
                'last_sent_at' => now()->subWeeks(1),
                'created_by' => $createdBy,
            ],
            [
                'name' => 'Password Reset',
                'subject' => 'Reset Your Password',
                'body' => '<h2>Password Reset Request</h2><p>Hi {{first_name}},</p><p>We received a request to reset your password. Click the link below to reset it:</p><p><a href="{{reset_link}}">Reset Password</a></p><p>This link will expire in {{expiry_time}} hours.</p><p>If you didn\'t request this, please ignore this email.</p>',
                'category' => 'Account',
                'type' => 'system',
                'status' => 'active',
                'variables' => ['first_name', 'reset_link', 'expiry_time'],
                'usage_count' => 23,
                'last_sent_at' => now()->subDays(5),
                'created_by' => $createdBy,
            ],
            [
                'name' => 'Profile Update Confirmation',
                'subject' => 'Your profile has been updated',
                'body' => '<h2>Profile Updated Successfully</h2><p>Hello {{first_name}},</p><p>Your alumni profile has been successfully updated.</p><p><strong>Updated fields:</strong></p><ul>{{updated_fields}}</ul><p>If you didn\'t make these changes, please contact us immediately.</p>',
                'category' => 'Account',
                'type' => 'notification',
                'status' => 'active',
                'variables' => ['first_name', 'updated_fields'],
                'usage_count' => 156,
                'last_sent_at' => now()->subDays(1),
                'created_by' => $createdBy,
            ],
            [
                'name' => 'Monthly Newsletter',
                'subject' => 'Alumni Newsletter - {{month}} {{year}}',
                'body' => '<h1>Alumni Newsletter</h1><h2>{{month}} {{year}}</h2><p>Dear {{first_name}},</p><p>Here\'s what\'s happening in our alumni community:</p>{{newsletter_content}}<p>Stay connected!</p>',
                'category' => 'Newsletter',
                'type' => 'announcement',
                'status' => 'draft',
                'variables' => ['first_name', 'month', 'year', 'newsletter_content'],
                'usage_count' => 12,
                'last_sent_at' => now()->subMonths(1),
                'created_by' => $createdBy,
            ],
            [
                'name' => 'Job Opportunity Alert',
                'subject' => 'New Job Opportunity: {{job_title}}',
                'body' => '<h2>New Job Opportunity</h2><p>Hi {{first_name}},</p><p>A new job opportunity that matches your profile has been posted:</p><p><strong>Position:</strong> {{job_title}}<br><strong>Company:</strong> {{company_name}}<br><strong>Location:</strong> {{job_location}}<br><strong>Type:</strong> {{job_type}}</p><p>{{job_description}}</p><p><a href="{{apply_link}}">View Details & Apply</a></p>',
                'category' => 'Career',
                'type' => 'notification',
                'status' => 'inactive',
                'variables' => ['first_name', 'job_title', 'company_name', 'job_location', 'job_type', 'job_description', 'apply_link'],
                'usage_count' => 0,
                'last_sent_at' => null,
                'created_by' => $createdBy,
            ],
            [
                'name' => 'Account Deactivation Warning',
                'subject' => 'Action Required: Your account will be deactivated',
                'body' => '<h2>Account Deactivation Warning</h2><p>Dear {{first_name}},</p><p>We notice you haven\'t logged in for {{inactive_days}} days. Your account will be automatically deactivated on {{deactivation_date}} due to inactivity.</p><p>To keep your account active, simply log in: <a href="{{login_link}}">Login Now</a></p>',
                'category' => 'Account',
                'type' => 'reminder',
                'status' => 'draft',
                'variables' => ['first_name', 'inactive_days', 'deactivation_date', 'login_link'],
                'usage_count' => 0,
                'last_sent_at' => null,
                'created_by' => $createdBy,
            ],
        ];

        foreach ($templates as $template) {
            EmailTemplate::create($template);
        }
    }
}

