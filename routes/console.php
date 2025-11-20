<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Scheduled Tasks for Email Notifications
Schedule::command('surveys:send-reminders')
    ->daily()
    ->at('09:00')
    ->description('Send survey reminders to alumni');

Schedule::command('profiles:send-reminders --days=180')
    ->weekly()
    ->mondays()
    ->at('10:00')
    ->description('Send profile update reminders (6 months)');

Schedule::command('alumni:send-birthday-wishes')
    ->daily()
    ->at('08:00')
    ->description('Send birthday wishes to alumni');

// Optional: Add monthly newsletter reminder
Schedule::command('surveys:send-reminders')
    ->weekly()
    ->wednesdays()
    ->at('14:00')
    ->description('Weekly survey reminder check');
