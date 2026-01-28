<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\AlumniProfile;
use Illuminate\Support\Facades\DB;

class UpdateAlumniJobFields extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'alumni:update-job-fields {--dry-run : Show what would be updated without making changes}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Update job_mismatch_reason and job_satisfaction fields for alumni profiles';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $dryRun = $this->option('dry-run');

        if ($dryRun) {
            $this->info('DRY RUN MODE - No changes will be made');
        }

        $this->info('Starting alumni profile update...');

        // Get all alumni profiles
        $alumniProfiles = AlumniProfile::all();

        $updatedCount = 0;
        $totalCount = $alumniProfiles->count();

        $this->info("Found {$totalCount} alumni profiles to check.");

        $progressBar = $this->output->createProgressBar($totalCount);
        $progressBar->start();

        foreach ($alumniProfiles as $profile) {
            $needsUpdate = false;
            $updates = [];

            // Check if job_mismatch_reason is null or empty
            if (is_null($profile->job_mismatch_reason) || $profile->job_mismatch_reason === '') {
                // Set default value based on employment status and job_related_to_degree
                if ($profile->employment_status === 'employed') {
                    if ($profile->job_related_to_degree === 1) {
                        $jobMismatchReason = 'none';
                    } elseif ($profile->job_related_to_degree === 0) {
                        $jobMismatchReason = 'unfit';
                    } else {
                        $jobMismatchReason = 'none'; // Default for employed
                    }
                } elseif ($profile->employment_status === 'unemployed') {
                    $jobMismatchReason = 'unfit'; // Default for unemployed
                } elseif ($profile->employment_status === 'self-employed') {
                    $jobMismatchReason = 'none'; // Default for self-employed
                } else {
                    $jobMismatchReason = 'none'; // Default for other statuses
                }

                $updates['job_mismatch_reason'] = $jobMismatchReason;
                $needsUpdate = true;
            }

            // Check if job_satisfaction is null or empty
            if (is_null($profile->job_satisfaction) || $profile->job_satisfaction === '') {
                // Set default job satisfaction based on employment status
                if ($profile->employment_status === 'employed' || $profile->employment_status === 'self-employed') {
                    $jobSatisfaction = rand(3, 5); // Random rating 3-5 for employed
                } elseif ($profile->employment_status === 'unemployed') {
                    $jobSatisfaction = rand(1, 2); // Random rating 1-2 for unemployed
                } else {
                    $jobSatisfaction = rand(2, 4); // Random rating 2-4 for other statuses
                }

                $updates['job_satisfaction'] = $jobSatisfaction;
                $needsUpdate = true;
            }

            if ($needsUpdate) {
                if (!$dryRun) {
                    $profile->update($updates);
                }
                $updatedCount++;
            }

            $progressBar->advance();
        }

        $progressBar->finish();
        $this->newLine(2);

        if ($dryRun) {
            $this->info("DRY RUN: Would update {$updatedCount} alumni profiles.");
        } else {
            $this->info("Updated {$updatedCount} alumni profiles.");
        }

        $this->info('Alumni profile update completed successfully!');
    }
}
