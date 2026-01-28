<?php

require_once __DIR__ . '/vendor/autoload.php';

use Illuminate\Database\Capsule\Manager as DB;
use Illuminate\Support\Facades\Config;

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "Starting alumni profile update...\n";

try {
    // Get all alumni profiles
    $alumniProfiles = DB::table('alumni_profiles')->get();

    $updatedCount = 0;
    $totalCount = $alumniProfiles->count();

    echo "Found {$totalCount} alumni profiles to check.\n";

    foreach ($alumniProfiles as $profile) {
        $needsUpdate = false;

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

            DB::table('alumni_profiles')
                ->where('id', $profile->id)
                ->update(['job_mismatch_reason' => $jobMismatchReason]);

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

            DB::table('alumni_profiles')
                ->where('id', $profile->id)
                ->update(['job_satisfaction' => $jobSatisfaction]);

            $needsUpdate = true;
        }

        if ($needsUpdate) {
            $updatedCount++;
        }
    }

    echo "Updated {$updatedCount} alumni profiles.\n";
    echo "Alumni profile update completed successfully!\n";

} catch (Exception $e) {
    echo "Error updating alumni profiles: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}