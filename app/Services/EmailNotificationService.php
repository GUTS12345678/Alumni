<?php

namespace App\Services;

use App\Jobs\SendBulkEmailJob;
use App\Mail\AnnouncementNotificationMail;
use App\Mail\JobPostingNotificationMail;
use App\Mail\SurveyNotificationMail;
use App\Models\Announcement;
use App\Models\Content;
use App\Models\EmailLog;
use App\Models\EmailPreference;
use App\Models\EmailTemplate;
use App\Models\JobPosting;
use App\Models\Survey;
use App\Models\User;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class EmailNotificationService
{
    /**
     * Batch size for processing bulk emails
     */
    protected int $batchSize = 50;

    /**
     * Send announcement notification to all eligible alumni
     */
    public function sendAnnouncementNotification(Announcement|Content $announcement): array
    {
        $recipients = $this->getAnnouncementRecipients($announcement);
        
        return $this->dispatchBulkEmails('announcement', $announcement->id, $recipients);
    }

    /**
     * Send job posting notification to all eligible alumni
     */
    public function sendJobPostingNotification(JobPosting|Content $jobPosting): array
    {
        $recipients = $this->getJobPostingRecipients($jobPosting);
        
        return $this->dispatchBulkEmails('job_posting', $jobPosting->id, $recipients);
    }

    /**
     * Send survey notification to targeted alumni (bulk)
     */
    public function sendSurveyNotificationBulk(Survey $survey): array
    {
        $recipients = $this->getSurveyRecipients($survey);
        
        return $this->dispatchBulkEmails('survey', $survey->id, $recipients);
    }

    /**
     * Get recipients for announcement based on target type
     */
    protected function getAnnouncementRecipients(Announcement|Content $announcement): array
    {
        $query = User::query()
            ->where('role', 'alumni')
            ->where('status', 'active')
            ->whereNotNull('email')
            ->where('email', '!=', '');

        // Filter by target type
        if ($announcement->target_type === 'batch' && $announcement->target_batch_years) {
            $batchYears = $announcement->target_batch_years;
            $query->whereHas('alumniProfile', function ($q) use ($batchYears) {
                $q->whereIn('graduation_year', $batchYears);
            });
        } elseif ($announcement->target_type === 'department' && $announcement->target_department_ids) {
            $deptIds = $announcement->target_department_ids;
            $query->whereHas('alumniProfile', function ($q) use ($deptIds) {
                $q->whereIn('department_id', $deptIds);
            });
        }

        // Exclude users who have disabled announcement emails
        $query->whereDoesntHave('emailPreference', function ($q) {
            $q->where('announcements_enabled', false);
        });

        return $query->pluck('id')->toArray();
    }

    /**
     * Get recipients for job posting
     */
    protected function getJobPostingRecipients(JobPosting|Content $jobPosting): array
    {
        return User::query()
            ->where('role', 'alumni')
            ->where('status', 'active')
            ->whereNotNull('email')
            ->where('email', '!=', '')
            ->whereDoesntHave('emailPreference', function ($q) {
                $q->where('job_postings_enabled', false);
            })
            ->pluck('id')
            ->toArray();
    }

    /**
     * Get recipients for survey based on target criteria
     */
    protected function getSurveyRecipients(Survey $survey): array
    {
        $query = User::query()
            ->where('role', 'alumni')
            ->where('status', 'active')
            ->whereNotNull('email')
            ->where('email', '!=', '');

        // Apply survey targeting if exists
        if (method_exists($survey, 'target_filters') && $survey->target_filters) {
            $filters = $survey->target_filters;
            
            if (!empty($filters['batch_years'])) {
                $query->whereHas('alumniProfile', function ($q) use ($filters) {
                    $q->whereIn('graduation_year', $filters['batch_years']);
                });
            }
            
            if (!empty($filters['department_ids'])) {
                $query->whereHas('alumniProfile', function ($q) use ($filters) {
                    $q->whereIn('department_id', $filters['department_ids']);
                });
            }
        }

        // Exclude users who have disabled survey emails
        $query->whereDoesntHave('emailPreference', function ($q) {
            $q->where('surveys_enabled', false);
        });

        return $query->pluck('id')->toArray();
    }

    /**
     * Dispatch bulk emails in batches using queue
     */
    protected function dispatchBulkEmails(string $emailType, int $referenceId, array $recipients): array
    {
        $totalRecipients = count($recipients);
        
        if ($totalRecipients === 0) {
            Log::info("EmailNotificationService: No recipients for {$emailType}", [
                'reference_id' => $referenceId,
            ]);
            
            return [
                'success' => true,
                'total_recipients' => 0,
                'batches_created' => 0,
                'message' => 'No eligible recipients found.',
            ];
        }

        // Create batch ID for tracking
        $batchId = Str::uuid()->toString();
        
        // Store batch info if table exists
        try {
            DB::table('email_batches')->insert([
                'batch_id' => $batchId,
                'email_type' => $emailType,
                'reference_id' => $referenceId,
                'reference_type' => match($emailType) {
                    'announcement' => Announcement::class,
                    'job_posting' => JobPosting::class,
                    'survey' => Survey::class,
                    default => null,
                },
                'total_recipients' => $totalRecipients,
                'status' => 'processing',
                'created_by' => auth()->id(),
                'started_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } catch (\Exception $e) {
            Log::warning("Could not log email batch: " . $e->getMessage());
        }

        // Split into batches and dispatch jobs
        $chunks = array_chunk($recipients, $this->batchSize);
        $jobs = [];

        foreach ($chunks as $chunk) {
            $jobs[] = new SendBulkEmailJob($emailType, $referenceId, $chunk);
        }

        // Dispatch all jobs
        try {
            if (class_exists('Illuminate\Support\Facades\Bus') && method_exists(Bus::class, 'batch')) {
                Bus::batch($jobs)
                    ->name("{$emailType}_{$referenceId}")
                    ->onQueue('emails')
                    ->allowFailures()
                    ->finally(function () use ($batchId) {
                        try {
                            DB::table('email_batches')
                                ->where('batch_id', $batchId)
                                ->update([
                                    'status' => 'completed',
                                    'completed_at' => now(),
                                    'updated_at' => now(),
                                ]);
                        } catch (\Exception $e) {
                            // Ignore if table doesn't exist
                        }
                    })
                    ->dispatch();
            } else {
                // Fallback: dispatch jobs individually
                foreach ($jobs as $job) {
                    dispatch($job)->onQueue('emails');
                }
            }

            Log::info("EmailNotificationService: Dispatched bulk emails", [
                'type' => $emailType,
                'reference_id' => $referenceId,
                'total_recipients' => $totalRecipients,
                'batches' => count($chunks),
            ]);

            return [
                'success' => true,
                'batch_id' => $batchId,
                'total_recipients' => $totalRecipients,
                'batches_created' => count($chunks),
                'message' => "Email notifications queued for {$totalRecipients} recipients.",
            ];
        } catch (\Exception $e) {
            Log::error("EmailNotificationService: Failed to dispatch emails", [
                'type' => $emailType,
                'reference_id' => $referenceId,
                'error' => $e->getMessage(),
            ]);

            try {
                DB::table('email_batches')
                    ->where('batch_id', $batchId)
                    ->update([
                        'status' => 'failed',
                        'updated_at' => now(),
                    ]);
            } catch (\Exception $e2) {
                // Ignore
            }

            return [
                'success' => false,
                'batch_id' => $batchId,
                'total_recipients' => $totalRecipients,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Get email sending statistics
     */
    public function getEmailStats(string $emailType = null, int $days = 30): array
    {
        try {
            $query = DB::table('email_logs')
                ->where('created_at', '>=', now()->subDays($days));

            if ($emailType) {
                $query->where('email_type', $emailType);
            }

            $total = $query->count();
            $sent = (clone $query)->where('status', 'sent')->count();
            $failed = (clone $query)->where('status', 'failed')->count();
            $opened = (clone $query)->whereNotNull('opened_at')->count();
            $clicked = (clone $query)->whereNotNull('clicked_at')->count();

            return [
                'total' => $total,
                'sent' => $sent,
                'failed' => $failed,
                'opened' => $opened,
                'clicked' => $clicked,
                'delivery_rate' => $total > 0 ? round(($sent / $total) * 100, 2) : 0,
                'open_rate' => $sent > 0 ? round(($opened / $sent) * 100, 2) : 0,
                'click_rate' => $opened > 0 ? round(($clicked / $opened) * 100, 2) : 0,
            ];
        } catch (\Exception $e) {
            return [
                'total' => 0,
                'sent' => 0,
                'failed' => 0,
                'opened' => 0,
                'clicked' => 0,
                'delivery_rate' => 0,
                'open_rate' => 0,
                'click_rate' => 0,
            ];
        }
    }

    /**
     * Send email using template
     */
    public function sendFromTemplate(string $templateName, User $user, array $variables = []): bool
    {
        try {
            $template = EmailTemplate::where('name', $templateName)
                ->where('status', 'active')
                ->firstOrFail();

            // Replace variables in subject and body
            $subject = $this->replaceVariables($template->subject, $variables);
            $body = $this->replaceVariables($template->body, $variables);

            // Send email
            Mail::send([], [], function ($message) use ($user, $subject, $body) {
                $message->to($user->email)
                    ->subject($subject)
                    ->html($body);
            });

            // Update template usage stats
            $template->increment('usage_count');
            $template->update(['last_sent_at' => now()]);

            Log::info("Email sent: {$templateName} to {$user->email}");
            return true;

        } catch (\Exception $e) {
            Log::error("Email send failed: {$templateName} to {$user->email}", [
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Send bulk emails (queued)
     */
    public function sendBulk(string $templateName, array $users, array $variables = []): int
    {
        $successCount = 0;

        foreach ($users as $user) {
            // You can dispatch to queue here for better performance
            if ($this->sendFromTemplate($templateName, $user, $variables)) {
                $successCount++;
            }
        }

        return $successCount;
    }

    /**
     * Send survey invitation
     */
    public function sendSurveyInvitation(User $user, $survey): bool
    {
        $alumniProfile = $user->alumniProfile;

        $variables = [
            'first_name' => $alumniProfile->first_name ?? $user->name,
            'survey_title' => $survey->title,
            'survey_description' => $survey->description,
            'survey_link' => url("/surveys/{$survey->id}/take"),
            'deadline' => $survey->end_date ? date('F j, Y', strtotime($survey->end_date)) : 'No deadline',
        ];

        return $this->sendFromTemplate('Survey Invitation', $user, $variables);
    }

    /**
     * Send survey reminder
     */
    public function sendSurveyReminder(User $user, $survey): bool
    {
        $alumniProfile = $user->alumniProfile;

        $variables = [
            'first_name' => $alumniProfile->first_name ?? $user->name,
            'survey_title' => $survey->title,
            'survey_link' => url("/surveys/{$survey->id}/take"),
            'days_remaining' => now()->diffInDays($survey->end_date),
        ];

        return $this->sendFromTemplate('Survey Reminder', $user, $variables);
    }

    /**
     * Send profile update reminder
     */
    public function sendProfileUpdateReminder(User $user): bool
    {
        $alumniProfile = $user->alumniProfile;
        $daysSinceUpdate = now()->diffInDays($alumniProfile->updated_at);

        $variables = [
            'first_name' => $alumniProfile->first_name ?? $user->name,
            'days_since_update' => $daysSinceUpdate,
            'profile_link' => url('/alumni/profile'),
        ];

        return $this->sendFromTemplate('Profile Update Reminder', $user, $variables);
    }

    /**
     * Send birthday wishes
     */
    public function sendBirthdayWishes(User $user): bool
    {
        $alumniProfile = $user->alumniProfile;

        $variables = [
            'first_name' => $alumniProfile->first_name ?? $user->name,
            'last_name' => $alumniProfile->last_name ?? '',
        ];

        // You'll need to create this template
        return $this->sendFromTemplate('Birthday Wishes', $user, $variables);
    }

    /**
     * Send welcome email
     */
    public function sendWelcomeEmail(User $user): bool
    {
        $alumniProfile = $user->alumniProfile;

        $variables = [
            'first_name' => $alumniProfile->first_name ?? $user->name,
            'last_name' => $alumniProfile->last_name ?? '',
            'email' => $user->email,
        ];

        return $this->sendFromTemplate('Welcome Email', $user, $variables);
    }

    /**
     * Send event invitation
     */
    public function sendEventInvitation(User $user, $event): bool
    {
        $alumniProfile = $user->alumniProfile;

        $variables = [
            'first_name' => $alumniProfile->first_name ?? $user->name,
            'event_name' => $event->name,
            'event_date' => date('F j, Y', strtotime($event->date)),
            'event_time' => date('g:i A', strtotime($event->time)),
            'event_location' => $event->location,
            'event_description' => $event->description,
            'rsvp_link' => url("/events/{$event->id}/rsvp"),
        ];

        return $this->sendFromTemplate('Event Invitation', $user, $variables);
    }

    /**
     * Replace variables in template
     */
    private function replaceVariables(string $text, array $variables): string
    {
        foreach ($variables as $key => $value) {
            $text = str_replace("{{" . $key . "}}", $value, $text);
        }
        return $text;
    }

    /**
     * Get template preview with sample data
     */
    public function previewTemplate(string $templateName, array $sampleData = []): array
    {
        $template = EmailTemplate::where('name', $templateName)->first();

        if (!$template) {
            return ['error' => 'Template not found'];
        }

        $subject = $this->replaceVariables($template->subject, $sampleData);
        $body = $this->replaceVariables($template->body, $sampleData);

        return [
            'subject' => $subject,
            'body' => $body,
            'variables' => $template->variables,
        ];
    }
}
