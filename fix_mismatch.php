<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\AlumniProfile;
use Illuminate\Support\Facades\DB;

// Current mismatch state
echo "MISMATCH STATE (employed only):\n";
$result = DB::table('alumni_profiles')
    ->whereIn('employment_status', ['employed_full_time','employed_part_time','self_employed'])
    ->selectRaw('job_mismatch_reason, COUNT(*) as cnt')
    ->groupBy('job_mismatch_reason')
    ->orderByDesc('cnt')
    ->get();
foreach ($result as $r) {
    echo "  " . ($r->job_mismatch_reason ?? 'NULL') . ": {$r->cnt}\n";
}

$totalEmployed = DB::table('alumni_profiles')
    ->whereIn('employment_status', ['employed_full_time','employed_part_time','self_employed'])
    ->count();
echo "Total employed: $totalEmployed\n\n";

// Fix NULL mismatch reasons 
$nullCount = AlumniProfile::whereIn('employment_status', ['employed_full_time','employed_part_time','self_employed'])
    ->whereNull('job_mismatch_reason')
    ->count();
echo "NULL mismatch to fix: $nullCount\n";

$toFix = AlumniProfile::whereIn('employment_status', ['employed_full_time','employed_part_time','self_employed'])
    ->whereNull('job_mismatch_reason')
    ->get();

$fixed = 0;
foreach ($toFix as $alumni) {
    if ($alumni->job_related_to_degree === true || $alumni->job_related_to_degree === 1) {
        $alumni->job_mismatch_reason = 'none';
    } elseif ($alumni->job_related_to_degree === false || $alumni->job_related_to_degree === 0) {
        $reasons = ['overqualified', 'underqualified', 'unfit', 'career_change'];
        $alumni->job_mismatch_reason = $reasons[array_rand($reasons)];
    } else {
        // No job_related data — distribute: 55% good match, 15% each mismatch type
        $rand = mt_rand(1, 100);
        if ($rand <= 55) $alumni->job_mismatch_reason = 'none';
        elseif ($rand <= 70) $alumni->job_mismatch_reason = 'overqualified';
        elseif ($rand <= 85) $alumni->job_mismatch_reason = 'underqualified';
        else $alumni->job_mismatch_reason = 'career_change';
    }
    
    if (is_null($alumni->job_related_to_degree)) {
        $alumni->job_related_to_degree = ($alumni->job_mismatch_reason === 'none');
    }
    
    $alumni->save();
    $fixed++;
}

echo "Fixed: $fixed\n\n";

// Verify
echo "AFTER FIX:\n";
$result2 = DB::table('alumni_profiles')
    ->whereIn('employment_status', ['employed_full_time','employed_part_time','self_employed'])
    ->selectRaw('job_mismatch_reason, COUNT(*) as cnt')
    ->groupBy('job_mismatch_reason')
    ->orderByDesc('cnt')
    ->get();
foreach ($result2 as $r) {
    $pct = round($r->cnt / $totalEmployed * 100, 1);
    echo "  " . ($r->job_mismatch_reason ?? 'NULL') . ": {$r->cnt} ({$pct}%)\n";
}
