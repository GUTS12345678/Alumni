<?php

require __DIR__ . '/vendor/autoload.php';

use Illuminate\Support\Facades\DB;
use App\Models\AlumniProfile;

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "\n";
echo "═══════════════════════════════════════════════════════════════\n";
echo "  COMPREHENSIVE ANALYTICS VERIFICATION\n";
echo "═══════════════════════════════════════════════════════════════\n\n";

// Basic Counts
$totalAlumni = AlumniProfile::count();
$totalGraduates = AlumniProfile::whereNotNull('graduation_year')->count();
$totalEmployed = AlumniProfile::whereIn('employment_status', [
    'employed_full_time', 
    'employed_part_time', 
    'self_employed'
])->count();

echo "━━━ BASIC METRICS ━━━\n";
echo "Total Alumni: $totalAlumni\n";
echo "Total Graduates (with grad year): $totalGraduates\n";
echo "Total Employed: $totalEmployed\n";
echo "Employment Rate: " . ($totalAlumni > 0 ? round(($totalEmployed / $totalAlumni) * 100, 2) : 0) . "%\n";
echo "\n";

// Performance Rate (Employed within 2 years)
$employedWithin2Years = DB::table('alumni_profiles')
    ->whereIn('employment_status', ['employed_full_time', 'employed_part_time', 'self_employed'])
    ->whereNotNull('job_start_date')
    ->whereNotNull('graduation_year')
    ->whereRaw('DATEDIFF(job_start_date, COALESCE(graduation_date, CONCAT(graduation_year, "-06-01"))) BETWEEN 0 AND 730')
    ->count();

$performanceRate = $totalGraduates > 0 ? round(($employedWithin2Years / $totalGraduates) * 100, 1) : 0;

echo "━━━ PERFORMANCE RATE (2-Year Employment Success) ━━━\n";
echo "Employed Within 2 Years: $employedWithin2Years\n";
echo "Total Graduates: $totalGraduates\n";
echo "Performance Rate: $performanceRate%\n";
echo "Display Text: \"$employedWithin2Years of $totalGraduates alumni\"\n";
echo "\n";

// Time to Employment
$avgDaysQuery = AlumniProfile::whereIn('employment_status', [
    'employed_full_time', 
    'employed_part_time', 
    'self_employed'
])
->whereNotNull('graduation_year')
->whereNotNull('job_start_date')
->selectRaw('AVG(DATEDIFF(job_start_date, COALESCE(graduation_date, CONCAT(graduation_year, "-06-01")))) as avg_days')
->first();

$avgDays = round($avgDaysQuery->avg_days ?? 0);
$avgMonths = round($avgDays / 30, 1);

echo "━━━ TIME TO EMPLOYMENT ━━━\n";
echo "Average Days to Job: $avgDays days ($avgMonths months)\n";
echo "\n";

// Job Mismatch/Alignment
$goodMatch = AlumniProfile::whereIn('employment_status', ['employed_full_time', 'employed_part_time', 'self_employed'])
    ->where('job_mismatch_reason', 'none')->count(); // 'none' means no mismatch = good match
$overqualified = AlumniProfile::whereIn('employment_status', ['employed_full_time', 'employed_part_time', 'self_employed'])
    ->where('job_mismatch_reason', 'overqualified')->count();
$underqualified = AlumniProfile::whereIn('employment_status', ['employed_full_time', 'employed_part_time', 'self_employed'])
    ->where('job_mismatch_reason', 'underqualified')->count();
$unfit = AlumniProfile::whereIn('employment_status', ['employed_full_time', 'employed_part_time', 'self_employed'])
    ->where('job_mismatch_reason', 'unfit')->count();

$jobAlignmentRate = $totalEmployed > 0 ? round(($goodMatch / $totalEmployed) * 100, 2) : 0;

echo "━━━ JOB ALIGNMENT / MISMATCH ━━━\n";
echo "Good Match: $goodMatch (aligned with degree)\n";
echo "Overqualified: $overqualified\n";
echo "Underqualified: $underqualified\n";
echo "Unfit/Mismatched: $unfit\n";
echo "Job Alignment Rate: $jobAlignmentRate%\n";
echo "\n";

// Employment Location
$local = AlumniProfile::whereIn('employment_status', ['employed_full_time', 'employed_part_time', 'self_employed'])
    ->where('employment_location_type', 'local')->count();
$foreign = AlumniProfile::whereIn('employment_status', ['employed_full_time', 'employed_part_time', 'self_employed'])
    ->where('employment_location_type', 'foreign')->count();
$remote = AlumniProfile::whereIn('employment_status', ['employed_full_time', 'employed_part_time', 'self_employed'])
    ->where('employment_location_type', 'remote')->count();

echo "━━━ EMPLOYMENT LOCATION ━━━\n";
echo "Local (Philippines): $local (" . ($totalEmployed > 0 ? round(($local / $totalEmployed) * 100, 1) : 0) . "%)\n";
echo "Foreign (OFW): $foreign (" . ($totalEmployed > 0 ? round(($foreign / $totalEmployed) * 100, 1) : 0) . "%)\n";
echo "Remote (Foreign Co.): $remote (" . ($totalEmployed > 0 ? round(($remote / $totalEmployed) * 100, 1) : 0) . "%)\n";
echo "\n";

// Unemployment
$seeking = AlumniProfile::where('employment_status', 'unemployed_seeking')->count();
$notSeeking = AlumniProfile::where('employment_status', 'unemployed_not_seeking')->count();
$continuingEd = AlumniProfile::where('employment_status', 'continuing_education')->count();

echo "━━━ UNEMPLOYMENT STATUS ━━━\n";
echo "Seeking Employment: $seeking\n";
echo "Not Seeking: $notSeeking\n";
echo "Continuing Education: $continuingEd\n";
echo "Total Unemployed: " . ($seeking + $notSeeking + $continuingEd) . "\n";
echo "\n";

// Data Quality Checks
$negativeOrExtreme = DB::table('alumni_profiles')
    ->whereIn('employment_status', ['employed_full_time', 'employed_part_time', 'self_employed'])
    ->whereNotNull('job_start_date')
    ->whereNotNull('graduation_year')
    ->where(function($q) {
        $q->whereRaw('DATEDIFF(job_start_date, COALESCE(graduation_date, CONCAT(graduation_year, "-06-01"))) < 0')
          ->orWhereRaw('DATEDIFF(job_start_date, COALESCE(graduation_date, CONCAT(graduation_year, "-06-01"))) > 730');
    })
    ->count();

$missingCareerField = AlumniProfile::whereIn('employment_status', ['employed_full_time', 'employed_part_time', 'self_employed'])
    ->whereNull('career_field')->count();
$missingLocation = AlumniProfile::whereIn('employment_status', ['employed_full_time', 'employed_part_time', 'self_employed'])
    ->whereNull('employment_location_type')->count();

echo "━━━ DATA QUALITY ━━━\n";
echo "Invalid Date Records (negative or >2 years): $negativeOrExtreme\n";
echo "Missing Career Field: $missingCareerField\n";
echo "Missing Location Type: $missingLocation\n";
echo "\n";

// Consistency Checks
echo "━━━ CONSISTENCY VALIDATION ━━━\n";
$consistent = true;

// Check 1: Performance Rate should equal Employment Rate when all employed got jobs within 2 years
if ($employedWithin2Years == $totalEmployed) {
    echo "✓ All employed alumni found jobs within 2 years\n";
    echo "✓ Performance Rate ($performanceRate%) matches Employment Rate (" . round(($totalEmployed / $totalAlumni) * 100, 1) . "%)\n";
} else {
    $beyondTwoYears = $totalEmployed - $employedWithin2Years;
    echo "✓ Performance Rate ($performanceRate%) is based on $employedWithin2Years of $totalGraduates alumni\n";
    echo "  ($beyondTwoYears employed alumni took more than 2 years)\n";
}

// Check 2: Totals should add up
$totalMismatchClassified = $goodMatch + $overqualified + $underqualified + $unfit;
if ($totalMismatchClassified == $totalEmployed) {
    echo "✓ Job mismatch classifications complete: $totalMismatchClassified/$totalEmployed\n";
} else {
    $missing = $totalEmployed - $totalMismatchClassified;
    echo "⚠ Missing job mismatch classifications: $missing records\n";
    $consistent = false;
}

// Check 3: Location totals
$totalLocationClassified = $local + $foreign + $remote;
if ($totalLocationClassified == $totalEmployed) {
    echo "✓ Employment location complete: $totalLocationClassified/$totalEmployed\n";
} else {
    $missing = $totalEmployed - $totalLocationClassified;
    echo "⚠ Missing location classifications: $missing records\n";
    $consistent = false;
}

// Check 4: No invalid dates
if ($negativeOrExtreme == 0) {
    echo "✓ All job_start_dates are valid (0-730 days from graduation)\n";
} else {
    echo "✗ Found $negativeOrExtreme invalid job_start_date records\n";
    $consistent = false;
}

echo "\n";
echo "═══════════════════════════════════════════════════════════════\n";
if ($consistent) {
    echo "✓✓✓ ALL METRICS CONSISTENT AND ACCURATE ✓✓✓\n";
} else {
    echo "⚠ SOME DATA QUALITY ISSUES DETECTED\n";
}
echo "═══════════════════════════════════════════════════════════════\n\n";

// Summary for Dashboard Display
echo "━━━ DASHBOARD KPI SUMMARY ━━━\n";
echo "Total Alumni: $totalAlumni\n";
echo "Performance Rate: $performanceRate% ($employedWithin2Years of $totalGraduates alumni)\n";
echo "Job Alignment: $jobAlignmentRate% ($goodMatch of $totalEmployed)\n";
echo "Employment Rate: " . round(($totalEmployed / $totalAlumni) * 100, 2) . "% ($totalEmployed of $totalAlumni)\n";
echo "Avg Time to Job: $avgDays days ($avgMonths months)\n";
echo "\n";
