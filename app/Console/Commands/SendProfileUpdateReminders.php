<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Services\EmailNotificationService;
use Carbon\Carbon;

class SendProfileUpdateReminders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'profiles:send-reminders {--days=180}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send reminders to alumni who haven\'t updated their profiles recently';

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
        $days = $this->option('days');
        $this->info("🔔 Sending profile update reminders (not updated in {$days} days)...");

        // Get alumni who haven't updated profiles in X days
        $thresholdDate = Carbon::now()->subDays($days);

        $staleProfiles = User::where('role', 'alumni')
            ->where('status', 'active')
            ->whereHas('alumniProfile', function ($query) use ($thresholdDate) {
                $query->where('updated_at', '<', $thresholdDate)
                    ->orWhereNull('updated_at');
            })
            ->with('alumniProfile')
            ->get();

        if ($staleProfiles->isEmpty()) {
            $this->warn('No alumni profiles need update reminders.');
            return 0;
        }

        $this->line("Found {$staleProfiles->count()} alumni with stale profiles");

        $sent = 0;
        $bar = $this->output->createProgressBar($staleProfiles->count());
        $bar->start();

        foreach ($staleProfiles as $user) {
            if ($this->emailService->sendProfileUpdateReminder($user)) {
                $sent++;
            }
            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);
        $this->info("✨ Successfully sent {$sent} profile update reminders");

        return 0;
    }
}
