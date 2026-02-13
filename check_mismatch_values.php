<?php

require __DIR__ . '/vendor/autoload.php';

use Illuminate\Support\Facades\DB;

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "\n━━━ JOB MISMATCH REASON CHECK ━━━\n\n";

// Query all job_mismatch_reason values
$results = DB::table('alumni_profiles')
    ->select('job_mismatch_reason', DB::raw('COUNT(*) as count'))
    ->whereIn('employment_status', ['employed_full_time', 'employed_part_time', 'self_employed'])
    ->groupBy('job_mismatch_reason')
    ->get();

echo "All job_mismatch_reason values:\n";
foreach ($results as $row) {
    $reason = $row->job_mismatch_reason ?? 'NULL';
    echo "  '$reason': {$row->count}\n";
}

echo "\nTotal employed: " . DB::table('alumni_profiles')
    ->whereIn('employment_status', ['employed_full_time', 'employed_part_time', 'self_employed'])
    ->count() . "\n";

// Check for 'aligned' value
$aligned = DB::table('alumni_profiles')
    ->whereIn('employment_status', ['employed_full_time', 'employed_part_time', 'self_employed'])
    ->where('job_mismatch_reason', 'aligned')
    ->count();

echo "\nRecords with 'aligned': $aligned\n";

// Check distinct values
$distinct = DB::table('alumni_profiles')
    ->select('job_mismatch_reason')
    ->whereIn('employment_status', ['employed_full_time', 'employed_part_time', 'self_employed'])
    ->whereNotNull('job_mismatch_reason')
    ->distinct()
    ->pluck('job_mismatch_reason');

echo "\nDistinct values:\n";
foreach ($distinct as $value) {
    echo "  - $value\n";
}
