<?php
/**
 * Targeted fix for remaining bad job_start_date records
 */
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\AlumniProfile;
use Carbon\Carbon;

// Temporarily disable the observer to avoid re-classification during mass update
AlumniProfile::withoutEvents(function () {
    $fixed = 0;

    $employed = AlumniProfile::whereIn('employment_status', [
        'employed_full_time', 'employed_part_time', 'self_employed'
    ])->whereNotNull('job_start_date')
      ->whereNotNull('graduation_year')
      ->get();

    foreach ($employed as $alumni) {
        $gradDate = $alumni->graduation_date
            ? Carbon::parse($alumni->graduation_date)
            : Carbon::parse($alumni->graduation_year . '-06-01');

        $jobDate = Carbon::parse($alumni->job_start_date);
        $days = $gradDate->diffInDays($jobDate, false);

        // Fix if negative (job before grad) or > 730 days (>2 years)
        if ($days < 0 || $days > 730) {
            $rand = mt_rand(1, 100);
            if ($rand <= 60) {
                $daysAfterGrad = mt_rand(30, 180);
            } elseif ($rand <= 85) {
                $daysAfterGrad = mt_rand(180, 365);
            } else {
                $daysAfterGrad = mt_rand(365, 540);
            }

            $newDate = $gradDate->copy()->addDays($daysAfterGrad);
            if ($newDate->isFuture()) {
                $newDate = Carbon::now()->subDays(mt_rand(30, 180));
            }

            // Direct update to avoid observer
            AlumniProfile::where('id', $alumni->id)->update(['job_start_date' => $newDate->toDateString()]);
            $fixed++;
        }
    }

    echo "Fixed $fixed remaining bad date records\n";

    // Verify
    $allEmployed = AlumniProfile::whereIn('employment_status', [
        'employed_full_time', 'employed_part_time', 'self_employed'
    ])->whereNotNull('graduation_year')
      ->whereNotNull('job_start_date')
      ->get();

    $totalDays = 0;
    $valid = 0;
    $negative = 0;
    $extreme = 0;

    foreach ($allEmployed as $a) {
        $grad = $a->graduation_date
            ? Carbon::parse($a->graduation_date)
            : Carbon::parse($a->graduation_year . '-06-01');
        $job = Carbon::parse($a->job_start_date);
        $days = $grad->diffInDays($job, false);

        if ($days < 0) $negative++;
        elseif ($days > 1825) $extreme++;

        if ($days >= 0 && $days <= 1825) {
            $totalDays += $days;
            $valid++;
        }
    }

    $avg = $valid > 0 ? round($totalDays / $valid) : 0;
    echo "\nFINAL RESULTS:\n";
    echo "  Total employed with dates: " . count($allEmployed) . "\n";
    echo "  Valid records (0-1825): $valid\n";
    echo "  Negative: $negative\n";
    echo "  Extreme (>1825): $extreme\n";
    echo "  Avg days to employment: $avg (" . round($avg / 30, 1) . " months)\n";
});
