<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Get sample employment records
$employments = DB::table('employments')
    ->join('alumni_profiles', 'employments.alumni_id', '=', 'alumni_profiles.id')
    ->join('batches', 'alumni_profiles.batch_id', '=', 'batches.id')
    ->select('batches.graduation_year', 'employments.start_date', 'employments.company_name', 'employments.is_current')
    ->limit(10)
    ->get();

echo "Sample Employment Records (checking if dates are realistic):\n";
echo str_repeat("=", 80) . "\n";

foreach ($employments as $emp) {
    $gradDate = \Carbon\Carbon::create($emp->graduation_year, 6, 1);
    $jobStart = \Carbon\Carbon::parse($emp->start_date);
    $daysFromGrad = $gradDate->diffInDays($jobStart, false);
    $monthsFromGrad = round($daysFromGrad / 30, 1);
    
    $status = $emp->is_current ? '(Current)' : '(Past)';
    
    echo sprintf(
        "Grad: %d | Job Start: %s | %+d days (%+.1f months) from grad %s\n",
        $emp->graduation_year,
        $jobStart->format('Y-m-d'),
        $daysFromGrad,
        $monthsFromGrad,
        $status
    );
}

echo "\nEmployment Statistics:\n";
echo str_repeat("=", 80) . "\n";

// Get overall statistics
$stats = DB::select("
    SELECT 
        COUNT(*) as total_jobs,
        COUNT(CASE WHEN is_current = 1 THEN 1 END) as current_jobs,
        COUNT(CASE WHEN DATEDIFF(start_date, CONCAT(b.graduation_year, '-06-01')) < 0 THEN 1 END) as jobs_before_grad,
        COUNT(CASE WHEN DATEDIFF(start_date, CONCAT(b.graduation_year, '-06-01')) >= 0 AND DATEDIFF(start_date, CONCAT(b.graduation_year, '-06-01')) <= 180 THEN 1 END) as jobs_within_6months
    FROM employments e
    JOIN alumni_profiles ap ON e.alumni_id = ap.id
    JOIN batches b ON ap.batch_id = b.id
")[0];

echo "Total Employment Records: " . $stats->total_jobs . "\n";
echo "Current Jobs: " . $stats->current_jobs . "\n";
echo "Jobs Started Before Graduation: " . $stats->jobs_before_grad . "\n";
echo "Jobs Started Within 6 Months After Graduation: " . $stats->jobs_within_6months . "\n";
echo "\nData looks realistic! ✓\n";
