<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Survey;
use App\Models\User;
use App\Models\SurveyResponse;
use App\Services\EmailNotificationService;
use Carbon\Carbon;

class SendSurveyReminders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'surveys:send-reminders {--survey-id=}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send reminders to alumni who haven\'t completed active surveys';

    protected $emailService;

    public function __construct(EmailNotificationService $emailService)
    {
        parent::__construct();
        $this->emailService = $emailService;
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🔔 Sending survey reminders...');

        // Get active surveys that are ending soon (within 7 days)
        $surveysQuery = Survey::where('status', 'active')
            ->whereNotNull('end_date')
            ->whereDate('end_date', '>=', now())
            ->whereDate('end_date', '<=', now()->addDays(7));

        // Filter by specific survey if provided
        if ($this->option('survey-id')) {
            $surveysQuery->where('id', $this->option('survey-id'));
        }

        $surveys = $surveysQuery->get();

        if ($surveys->isEmpty()) {
            $this->warn('No active surveys found that need reminders.');
            return 0;
        }

        $totalSent = 0;

        foreach ($surveys as $survey) {
            $this->line("\n📋 Processing: {$survey->title}");

            // Get users who haven't completed this survey
            $completedUserIds = SurveyResponse::where('survey_id', $survey->id)
                ->whereNotNull('completed_at')
                ->pluck('user_id')
                ->toArray();

            // Get all alumni users who haven't completed the survey
            $pendingUsers = User::where('role', 'alumni')
                ->where('status', 'active')
                ->whereNotIn('id', $completedUserIds)
                ->whereHas('alumniProfile') // Only users with profiles
                ->with('alumniProfile')
                ->get();

            $this->line("   Found {$pendingUsers->count()} alumni who haven't completed the survey");

            $sent = 0;
            foreach ($pendingUsers as $user) {
                if ($this->emailService->sendSurveyReminder($user, $survey)) {
                    $sent++;
                }
            }

            $this->info("   ✅ Sent {$sent} reminders for this survey");
            $totalSent += $sent;
        }

        $this->info("\n✨ Total reminders sent: {$totalSent}");
        return 0;
    }
}
