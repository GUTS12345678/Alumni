<?php

namespace App\Services;

use App\Models\EmailTemplate;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class EmailNotificationService
{
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
