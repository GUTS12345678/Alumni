<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class PopulateJobMismatchData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:populate-job-mismatch-data';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Populate job mismatch reasons for analytics data';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Populating job mismatch reasons for employed alumni...');

        $employedAlumni = \App\Models\AlumniProfile::whereIn('employment_status', ['employed_full_time', 'employed_part_time', 'self_employed'])
            ->whereNull('job_mismatch_reason')
            ->get();

        $mismatchReasons = ['overqualified', 'unfit', 'underqualified', 'none'];
        $updated = 0;

        foreach ($employedAlumni as $alumni) {
            $alumni->update(['job_mismatch_reason' => $mismatchReasons[array_rand($mismatchReasons)]]);
            $updated++;
        }

        $this->info("✅ Updated {$updated} alumni profiles with job mismatch reasons");

        // Also populate job satisfaction for analytics
        $employedAlumniForSatisfaction = \App\Models\AlumniProfile::whereIn('employment_status', ['employed_full_time', 'employed_part_time', 'self_employed'])
            ->whereNull('job_satisfaction')
            ->get();

        $satisfactionUpdated = 0;
        foreach ($employedAlumniForSatisfaction as $alumni) {
            $alumni->update(['job_satisfaction' => rand(1, 5)]);
            $satisfactionUpdated++;
        }

        $this->info("✅ Updated {$satisfactionUpdated} alumni profiles with job satisfaction ratings");
    }
}
