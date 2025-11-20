<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Services\EmailNotificationService;
use Carbon\Carbon;

class SendBirthdayWishes extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'alumni:send-birthday-wishes';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send birthday wishes to alumni celebrating their birthday today';

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
        $this->info('🎂 Sending birthday wishes...');

        $today = Carbon::now();
        $todayMonth = $today->format('m');
        $todayDay = $today->format('d');

        // Get alumni with birthdays today
        $birthdayAlumni = User::where('role', 'alumni')
            ->where('status', 'active')
            ->whereHas('alumniProfile', function ($query) use ($todayMonth, $todayDay) {
                $query->whereNotNull('birth_date')
                    ->whereRaw('MONTH(birth_date) = ?', [$todayMonth])
                    ->whereRaw('DAY(birth_date) = ?', [$todayDay]);
            })
            ->with('alumniProfile')
            ->get();

        if ($birthdayAlumni->isEmpty()) {
            $this->warn('No birthdays today! 🎉');
            return 0;
        }

        $this->line("Found {$birthdayAlumni->count()} birthday(s) today! 🎉");

        $sent = 0;
        foreach ($birthdayAlumni as $user) {
            $name = $user->alumniProfile->first_name ?? $user->name;
            $this->line("   Sending to: {$name}");

            if ($this->emailService->sendBirthdayWishes($user)) {
                $sent++;
            }
        }

        $this->info("\n✨ Successfully sent {$sent} birthday wishes!");
        return 0;
    }
}
