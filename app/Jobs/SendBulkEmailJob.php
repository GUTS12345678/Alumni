<?php

namespace App\Jobs;

use App\Mail\AnnouncementNotificationMail;
use App\Mail\JobPostingNotificationMail;
use App\Mail\SurveyNotificationMail;
use App\Models\Announcement;
use App\Models\AlumniProfile;
use App\Models\EmailLog;
use App\Models\EmailPreference;
use App\Models\JobPosting;
use App\Models\Survey;
use App\Models\User;
use Illuminate\Bus\Batchable;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendBulkEmailJob implements ShouldQueue
{
    use Batchable, Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public string $emailType;
    public int $referenceId;
    public array $userIds;

    /**
     * The number of times the job may be attempted.
     */
    public int $tries = 3;

    /**
     * The number of seconds to wait before retrying the job.
     */
    public int $backoff = 60;

    /**
     * Create a new job instance.
     */
    public function __construct(string $emailType, int $referenceId, array $userIds)
    {
        $this->emailType = $emailType;
        $this->referenceId = $referenceId;
        $this->userIds = $userIds;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        if ($this->batch() && $this->batch()->cancelled()) {
            return;
        }

        // Get the reference model
        $reference = $this->getReference();
        if (!$reference) {
            Log::error("SendBulkEmailJob: Reference not found", [
                'type' => $this->emailType,
                'id' => $this->referenceId,
            ]);
            return;
        }

        // Process each user
        foreach ($this->userIds as $userId) {
            try {
                $this->sendEmailToUser($userId, $reference);
            } catch (\Exception $e) {
                Log::error("SendBulkEmailJob: Failed to send email", [
                    'user_id' => $userId,
                    'type' => $this->emailType,
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }

    /**
     * Get the reference model based on email type
     */
    protected function getReference(): Announcement|JobPosting|Survey|null
    {
        return match($this->emailType) {
            'announcement' => Announcement::find($this->referenceId),
            'job_posting' => JobPosting::find($this->referenceId),
            'survey' => Survey::find($this->referenceId),
            default => null,
        };
    }

    /**
     * Send email to a specific user
     */
    protected function sendEmailToUser(int $userId, $reference): void
    {
        $user = User::with('alumniProfile')->find($userId);
        if (!$user || !$user->email) {
            return;
        }

        // Check email preferences
        $preferences = EmailPreference::getOrCreateForUser($userId);
        $preferenceField = $this->emailType === 'job_posting' ? 'job_postings' : $this->emailType . 's';
        
        if (!$preferences->isEnabled($preferenceField)) {
            Log::info("SendBulkEmailJob: User opted out", [
                'user_id' => $userId,
                'type' => $this->emailType,
            ]);
            return;
        }

        // Skip if frequency is not instant (will be included in digest)
        if ($preferences->frequency !== 'instant') {
            return;
        }

        // Get recipient name
        $recipientName = $this->getRecipientName($user);

        // Create email log
        $emailLog = EmailLog::create([
            'user_id' => $userId,
            'email_address' => $user->email,
            'email_type' => $this->emailType,
            'reference_id' => $this->referenceId,
            'reference_type' => get_class($reference),
            'subject' => $this->getSubject($reference),
            'status' => 'queued',
        ]);

        try {
            // Send the appropriate email
            $mailable = match($this->emailType) {
                'announcement' => new AnnouncementNotificationMail(
                    $reference,
                    $recipientName,
                    $user->email,
                    $preferences->unsubscribe_token
                ),
                'job_posting' => new JobPostingNotificationMail(
                    $reference,
                    $recipientName,
                    $user->email,
                    $preferences->unsubscribe_token
                ),
                'survey' => new SurveyNotificationMail(
                    $reference,
                    $recipientName,
                    $user->email,
                    $preferences->unsubscribe_token
                ),
                default => null,
            };

            if ($mailable) {
                Mail::to($user->email)->send($mailable);
                $emailLog->markAsSent();
            }
        } catch (\Exception $e) {
            $emailLog->markAsFailed($e->getMessage());
            throw $e;
        }
    }

    /**
     * Get recipient name from user/profile
     */
    protected function getRecipientName(User $user): string
    {
        if ($user->alumniProfile) {
            return trim($user->alumniProfile->first_name . ' ' . $user->alumniProfile->last_name) ?: 'Alumni';
        }
        
        return $user->name ?: 'Alumni';
    }

    /**
     * Get email subject based on reference
     */
    protected function getSubject($reference): string
    {
        return match($this->emailType) {
            'announcement' => "New Announcement: {$reference->title}",
            'job_posting' => "New Job: {$reference->title}",
            'survey' => "Survey Invitation: {$reference->title}",
            default => 'Notification from Alumni Tracer System',
        };
    }
}
