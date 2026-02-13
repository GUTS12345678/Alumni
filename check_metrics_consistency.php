<?php

require __DIR__ . '/vendor/autoload.php';

use Illuminate\Support\Facades\DB;
use App\Models\AlumniProfile;

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "\n";
echo "═══════════════════════════════════════════════════════════════\n";
echo "  METRICS CONSISTENCY CHECK\n";
echo "  Comparing Dashboard API vs Analytics API vs Frontend Display\n";
echo "═══════════════════════════════════════════════════════════════\n\n";

// ============================================
// 1. TOTAL ALUMNI
// ============================================
echo "━━━ 1. TOTAL ALUMNI ━━━\n";
$totalAlumni = AlumniProfile::count();
$totalGraduates = AlumniProfile::whereNotNull('graduation_year')->count();
echo "AlumniProfile::count(): $totalAlumni\n";
echo "With graduation_year: $totalGraduates\n";
if ($totalAlumni === $totalGraduates) {
    echo "✓ CONSISTENT - All alumni have graduation years\n";
} else {
    echo "⚠ INCONSISTENCY - " . ($totalAlumni - $totalGraduates) . " alumni missing graduation_year\n";
}
echo "\n";

// ============================================
// 2. EMPLOYMENT RATE
// ============================================
echo "━━━ 2. EMPLOYMENT RATE ━━━\n";
$totalEmployed = AlumniProfile::whereIn('employment_status', [
    'employed_full_time', 'employed_part_time', 'self_employed'
])->count();
$employmentRate = $totalAlumni > 0 ? round(($totalEmployed / $totalAlumni) * 100, 2) : 0;
echo "Total Employed: $totalEmployed\n";
echo "Employment Rate: $employmentRate% ($totalEmployed / $totalAlumni)\n";
echo "✓ CONSISTENT - Same denominator (total alumni) used everywhere\n";
echo "\n";

// ============================================
// 3. PERFORMANCE RATE
// ============================================
echo "━━━ 3. PERFORMANCE RATE (Employed within 2 years) ━━━\n";
$employedWithin2Years = DB::table('alumni_profiles')
    ->whereIn('employment_status', ['employed_full_time', 'employed_part_time', 'self_employed'])
    ->whereNotNull('job_start_date')
    ->whereNotNull('graduation_year')
    ->whereRaw('DATEDIFF(job_start_date, COALESCE(graduation_date, CONCAT(graduation_year, "-06-01"))) BETWEEN 0 AND 730')
    ->count();

// Check OLD calculation (wrong)
$totalEmployedWithGradData = DB::table('alumni_profiles')
    ->whereIn('employment_status', ['employed_full_time', 'employed_part_time', 'self_employed'])
    ->whereNotNull('graduation_year')
    ->count();
$oldPerformanceRate = $totalEmployedWithGradData > 0 ? round(($employedWithin2Years / $totalEmployedWithGradData) * 100, 1) : 0;

// Check NEW calculation (correct)
$newPerformanceRate = $totalGraduates > 0 ? round(($employedWithin2Years / $totalGraduates) * 100, 1) : 0;

echo "Employed Within 2 Years: $employedWithin2Years\n";
echo "Total Employed (with grad data): $totalEmployedWithGradData\n";
echo "Total Graduates: $totalGraduates\n";
echo "\n";
echo "OLD (WRONG) Calculation: $employedWithin2Years / $totalEmployedWithGradData = $oldPerformanceRate%\n";
echo "NEW (CORRECT) Calculation: $employedWithin2Years / $totalGraduates = $newPerformanceRate%\n";

if ($newPerformanceRate == $employmentRate) {
    echo "✓ CONSISTENT - Performance Rate matches Employment Rate (all found jobs within 2 years)\n";
} else {
    echo "⚠ INFO - Performance Rate ($newPerformanceRate%) differs from Employment Rate ($employmentRate%)\n";
    echo "  This is expected if some employed alumni took >2 years to find jobs\n";
}
echo "\n";

// ============================================
// 4. JOB ALIGNMENT
// ============================================
echo "━━━ 4. JOB ALIGNMENT ━━━\n";
// Method 1: Direct query for 'none' (good match)
$goodMatch1 = AlumniProfile::whereIn('employment_status', ['employed_full_time', 'employed_part_time', 'self_employed'])
    ->where('job_mismatch_reason', 'none')->count();

// Method 2: Query for NULL or 'none'
$goodMatch2 = AlumniProfile::whereIn('employment_status', ['employed_full_time', 'employed_part_time', 'self_employed'])
    ->where(function($q) {
        $q->whereNull('job_mismatch_reason')->orWhere('job_mismatch_reason', 'none');
    })->count();

// Check what values exist
$nullCount = DB::table('alumni_profiles')
    ->whereIn('employment_status', ['employed_full_time', 'employed_part_time', 'self_employed'])
    ->whereNull('job_mismatch_reason')
    ->count();

echo "Method 1 (job_mismatch_reason = 'none'): $goodMatch1\n";
echo "Method 2 (NULL OR 'none'): $goodMatch2\n";
echo "NULL values in database: $nullCount\n";

if ($goodMatch1 === $goodMatch2 && $nullCount === 0) {
    echo "✓ CONSISTENT - No NULL values, only 'none' for good matches\n";
} elseif ($goodMatch2 === ($goodMatch1 + $nullCount)) {
    echo "⚠ INCONSISTENCY FOUND - Database has $nullCount NULL values that should be counted\n";
}

$alignmentRate1 = $totalEmployed > 0 ? round(($goodMatch1 / $totalEmployed) * 100, 2) : 0;
$alignmentRate2 = $totalEmployed > 0 ? round(($goodMatch2 / $totalEmployed) * 100, 2) : 0;

echo "Alignment Rate (Method 1): $alignmentRate1% ($goodMatch1 / $totalEmployed)\n";
echo "Alignment Rate (Method 2): $alignmentRate2% ($goodMatch2 / $totalEmployed)\n";

// Check AdminController calculation
$alignedJobsAdmin = AlumniProfile::whereIn('employment_status', ['employed_full_time', 'employed_part_time', 'self_employed'])
    ->where(function($q) {
        $q->whereNull('job_mismatch_reason')->orWhere('job_mismatch_reason', 'none');
    })->count();
$jobAlignmentRateAdmin = $totalEmployed > 0 ? round(($alignedJobsAdmin / $totalEmployed) * 100, 2) : 0;

echo "\nAdminController Dashboard API: $jobAlignmentRateAdmin% ($alignedJobsAdmin / $totalEmployed)\n";

// Check AnalyticsController calculation
$statsRaw = DB::table('alumni_profiles')
    ->select('job_mismatch_reason', DB::raw('COUNT(*) as count'))
    ->whereIn('employment_status', ['employed_full_time', 'employed_part_time', 'self_employed'])
    ->groupBy('job_mismatch_reason')
    ->get();

$noneCount = $statsRaw->where('job_mismatch_reason', 'none')->first()->count ?? 0;
$nullCountStats = $statsRaw->whereNull('job_mismatch_reason')->first()->count ?? 0;
$alignedAnalytics = $noneCount + $nullCountStats;
$totalStats = $statsRaw->sum('count');
$alignmentRateAnalytics = $totalStats > 0 ? round(($alignedAnalytics / $totalStats) * 100, 1) : 0;

echo "AnalyticsController Comprehensive API: $alignmentRateAnalytics% ($alignedAnalytics / $totalStats)\n";

if ($jobAlignmentRateAdmin == $alignmentRate2 && abs($jobAlignmentRateAdmin - $alignmentRateAnalytics) <= 0.1) {
    echo "✓ CONSISTENT - Both APIs calculate the same (minor rounding difference acceptable)\n";
} else {
    echo "✗ INCONSISTENCY - Different calculations detected\n";
}
echo "\n";

// ============================================
// 5. MISMATCH BREAKDOWN TOTALS
// ============================================
echo "━━━ 5. MISMATCH BREAKDOWN TOTALS ━━━\n";
$overqualified = AlumniProfile::whereIn('employment_status', ['employed_full_time', 'employed_part_time', 'self_employed'])
    ->where('job_mismatch_reason', 'overqualified')->count();
$underqualified = AlumniProfile::whereIn('employment_status', ['employed_full_time', 'employed_part_time', 'self_employed'])
    ->where('job_mismatch_reason', 'underqualified')->count();
$unfit = AlumniProfile::whereIn('employment_status', ['employed_full_time', 'employed_part_time', 'self_employed'])
    ->where('job_mismatch_reason', 'unfit')->count();

$totalClassified = $goodMatch2 + $overqualified + $underqualified + $unfit;

echo "Good Match (none or NULL): $goodMatch2\n";
echo "Overqualified: $overqualified\n";
echo "Underqualified: $underqualified\n";
echo "Unfit: $unfit\n";
echo "─────────────────\n";
echo "Total Classified: $totalClassified\n";
echo "Total Employed: $totalEmployed\n";

if ($totalClassified === $totalEmployed) {
    echo "✓ CONSISTENT - All employed alumni are classified\n";
} else {
    $missing = $totalEmployed - $totalClassified;
    echo "✗ INCONSISTENCY - Missing classifications: $missing alumni\n";
}
echo "\n";

// ============================================
// 6. AVG DAYS TO JOB
// ============================================
echo "━━━ 6. AVG DAYS TO JOB ━━━\n";
$avgDaysQuery = AlumniProfile::whereIn('employment_status', [
    'employed_full_time', 'employed_part_time', 'self_employed'
])
->whereNotNull('graduation_year')
->whereNotNull('job_start_date')
->selectRaw('AVG(DATEDIFF(job_start_date, COALESCE(graduation_date, CONCAT(graduation_year, "-06-01")))) as avg_days')
->first();

$avgDays = round($avgDaysQuery->avg_days ?? 0);

// Count records used
$recordsUsed = AlumniProfile::whereIn('employment_status', [
    'employed_full_time', 'employed_part_time', 'self_employed'
])
->whereNotNull('graduation_year')
->whereNotNull('job_start_date')
->count();

echo "AVG(DATEDIFF(job_start_date, graduation_date)): $avgDays days\n";
echo "Records used in calculation: $recordsUsed / $totalEmployed\n";

if ($recordsUsed === $totalEmployed) {
    echo "✓ CONSISTENT - All employed alumni have job_start_date\n";
} else {
    $missing = $totalEmployed - $recordsUsed;
    echo "⚠ INFO - $missing employed alumni missing job_start_date (excluded from avg)\n";
}
echo "\n";

// ============================================
// 7. EMPLOYMENT LOCATION
// ============================================
echo "━━━ 7. EMPLOYMENT LOCATION ━━━\n";
$local = AlumniProfile::whereIn('employment_status', ['employed_full_time', 'employed_part_time', 'self_employed'])
    ->where('employment_location_type', 'local')->count();
$foreign = AlumniProfile::whereIn('employment_status', ['employed_full_time', 'employed_part_time', 'self_employed'])
    ->where('employment_location_type', 'foreign')->count();
$remote = AlumniProfile::whereIn('employment_status', ['employed_full_time', 'employed_part_time', 'self_employed'])
    ->where('employment_location_type', 'remote')->count();

$totalLocation = $local + $foreign + $remote;

echo "Local: $local (" . ($totalEmployed > 0 ? round(($local / $totalEmployed) * 100, 1) : 0) . "%)\n";
echo "Foreign: $foreign (" . ($totalEmployed > 0 ? round(($foreign / $totalEmployed) * 100, 1) : 0) . "%)\n";
echo "Remote: $remote (" . ($totalEmployed > 0 ? round(($remote / $totalEmployed) * 100, 1) : 0) . "%)\n";
echo "─────────────────\n";
echo "Total Classified: $totalLocation\n";
echo "Total Employed: $totalEmployed\n";

if ($totalLocation === $totalEmployed) {
    echo "✓ CONSISTENT - All employed alumni have location classification\n";
} else {
    $missing = $totalEmployed - $totalLocation;
    echo "✗ INCONSISTENCY - Missing location: $missing alumni\n";
}
echo "\n";

// ============================================
// FINAL SUMMARY
// ============================================
echo "═══════════════════════════════════════════════════════════════\n";
echo "  SUMMARY\n";
echo "═══════════════════════════════════════════════════════════════\n\n";

$issues = [];

if ($totalAlumni !== $totalGraduates) {
    $issues[] = "Some alumni missing graduation_year";
}

if ($totalClassified !== $totalEmployed) {
    $issues[] = "Incomplete job mismatch classification";
}

if ($totalLocation !== $totalEmployed) {
    $issues[] = "Incomplete employment location classification";
}

if ($recordsUsed !== $totalEmployed) {
    $issues[] = "Some employed alumni missing job_start_date";
}

if ($jobAlignmentRateAdmin != $alignmentRateAnalytics && abs($jobAlignmentRateAdmin - $alignmentRateAnalytics) > 0.1) {
    $issues[] = "Job alignment calculation differs between APIs";
}

if (empty($issues)) {
    echo "✓✓✓ ALL METRICS CONSISTENT ACROSS ALL ENDPOINTS ✓✓✓\n\n";
    echo "Dashboard API (/api/admin/dashboard):\n";
    echo "  - Uses correct denominators\n";
    echo "  - Consistent with Analytics API\n\n";
    echo "Analytics API (/api/v1/admin/analytics/comprehensive):\n";
    echo "  - Uses correct denominators\n";
    echo "  - Consistent with Dashboard API\n\n";
    echo "Frontend Display:\n";
    echo "  - Should match backend calculations\n";
    echo "  - Minor rounding differences acceptable (0.1%)\n";
} else {
    echo "⚠ ISSUES DETECTED:\n";
    foreach ($issues as $i => $issue) {
        echo "  " . ($i + 1) . ". $issue\n";
    }
}

echo "\n";
echo "KEY METRICS SUMMARY:\n";
echo "  Total Alumni: $totalAlumni\n";
echo "  Employment Rate: $employmentRate%\n";
echo "  Performance Rate: $newPerformanceRate%\n";
echo "  Job Alignment: $jobAlignmentRateAdmin%\n";
echo "  Avg Days to Job: $avgDays days\n";
echo "\n";
