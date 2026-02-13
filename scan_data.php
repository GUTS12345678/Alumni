<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\AlumniProfile;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

echo "═══════════════════════════════════════════════════════\n";
echo "  ALUMNI DATABASE AUDIT\n";
echo "═══════════════════════════════════════════════════════\n\n";

// 1. Total counts
$total = AlumniProfile::count();
$employed = AlumniProfile::whereIn('employment_status', ['employed_full_time','employed_part_time','self_employed'])->count();
echo "1. TOTALS\n";
echo "   Total alumni profiles: $total\n";
echo "   Employed: $employed\n\n";

// 2. Employment status breakdown
echo "2. EMPLOYMENT STATUS BREAKDOWN\n";
$statuses = DB::table('alumni_profiles')
    ->selectRaw('employment_status, COUNT(*) as cnt')
    ->groupBy('employment_status')
    ->orderByDesc('cnt')
    ->get();
foreach ($statuses as $s) {
    $pct = round($s->cnt / $total * 100, 1);
    echo "   {$s->employment_status}: {$s->cnt} ({$pct}%)\n";
}

// 3. Data completeness
echo "\n3. DATA COMPLETENESS\n";
$fields = [
    'graduation_date', 'graduation_year', 'job_start_date', 'employment_status',
    'current_job_title', 'current_employer', 'company_industry', 'job_mismatch_reason',
    'job_related_to_degree', 'salary_range', 'career_field', 'city', 'country',
    'department_id', 'course_id', 'batch_id', 'phone', 'gender', 'birth_date',
    'degree_program', 'skills'
];
foreach ($fields as $f) {
    $filled = DB::table('alumni_profiles')->whereNotNull($f)->where($f, '!=', '')->count();
    $pct = round($filled / $total * 100, 1);
    $status = $pct >= 80 ? 'OK' : ($pct >= 50 ? 'PARTIAL' : ($pct > 0 ? 'LOW' : 'EMPTY'));
    echo "   $f: $filled/$total ({$pct}%) [$status]\n";
}

// 4. Avg Time to Employment analysis
echo "\n4. AVG TIME TO EMPLOYMENT ANALYSIS\n";
$alumniWithDates = AlumniProfile::whereIn('employment_status', ['employed_full_time','employed_part_time','self_employed'])
    ->whereNotNull('graduation_year')
    ->whereNotNull('job_start_date')
    ->get();

$daysBuckets = ['negative' => 0, '0-90' => 0, '91-180' => 0, '181-365' => 0, '366-730' => 0, '731-1825' => 0, '>1825' => 0];
$totalDays = 0;
$valid = 0;
$extremes = [];

foreach ($alumniWithDates as $a) {
    $gradDate = $a->graduation_date
        ? Carbon::parse($a->graduation_date)
        : Carbon::parse($a->graduation_year . '-06-01');
    $jobDate = Carbon::parse($a->job_start_date);
    $days = $gradDate->diffInDays($jobDate, false);

    if ($days < 0) {
        $daysBuckets['negative']++;
        $extremes[] = "ID:{$a->id} NEGATIVE days:{$days} grad:{$gradDate->format('Y-m-d')} job:{$a->job_start_date}";
    } elseif ($days <= 90) $daysBuckets['0-90']++;
    elseif ($days <= 180) $daysBuckets['91-180']++;
    elseif ($days <= 365) $daysBuckets['181-365']++;
    elseif ($days <= 730) $daysBuckets['366-730']++;
    elseif ($days <= 1825) {
        $daysBuckets['731-1825']++;
        if ($days > 1000) {
            $extremes[] = "ID:{$a->id} HIGH days:{$days} grad:{$gradDate->format('Y-m-d')} job:{$a->job_start_date}";
        }
    } else {
        $daysBuckets['>1825']++;
        $extremes[] = "ID:{$a->id} EXTREME days:{$days} grad:{$gradDate->format('Y-m-d')} job:{$a->job_start_date}";
    }

    if ($days >= 0 && $days <= 1825) {
        $totalDays += $days;
        $valid++;
    }
}

echo "   Records with both dates: " . count($alumniWithDates) . "\n";
echo "   Valid (0-1825 days): $valid\n";
echo "   Avg days to employment: " . ($valid > 0 ? round($totalDays / $valid) : 'N/A') . "\n";
echo "   Distribution:\n";
foreach ($daysBuckets as $bucket => $count) {
    echo "     $bucket days: $count\n";
}
if (!empty($extremes)) {
    echo "   Extreme records (first 15):\n";
    foreach (array_slice($extremes, 0, 15) as $e) {
        echo "     $e\n";
    }
}

// 5. Job mismatch data quality
echo "\n5. JOB MISMATCH ANALYSIS\n";
$mismatch = DB::table('alumni_profiles')
    ->whereIn('employment_status', ['employed_full_time','employed_part_time','self_employed'])
    ->selectRaw('job_mismatch_reason, COUNT(*) as cnt')
    ->groupBy('job_mismatch_reason')
    ->orderByDesc('cnt')
    ->get();
foreach ($mismatch as $m) {
    $reason = $m->job_mismatch_reason ?? 'NULL';
    echo "   $reason: {$m->cnt}\n";
}

// 6. Career history data
echo "\n6. CAREER HISTORY\n";
$chTotal = DB::table('career_history')->count();
$chWithLocation = DB::table('career_history')->whereNotNull('company_location')->where('company_location', '!=', '')->count();
echo "   Total career_history records: $chTotal\n";
echo "   With company_location: $chWithLocation\n";

$locations = DB::table('career_history')
    ->whereNotNull('company_location')
    ->selectRaw('company_location, COUNT(*) as cnt')
    ->groupBy('company_location')
    ->orderByDesc('cnt')
    ->limit(20)
    ->get();
echo "   Top locations:\n";
foreach ($locations as $l) {
    echo "     {$l->company_location}: {$l->cnt}\n";
}

// 7. Graduation years
echo "\n7. GRADUATION YEAR DISTRIBUTION\n";
$years = DB::table('alumni_profiles')
    ->whereNotNull('graduation_year')
    ->selectRaw('graduation_year, COUNT(*) as cnt')
    ->groupBy('graduation_year')
    ->orderBy('graduation_year')
    ->get();
foreach ($years as $y) {
    echo "   {$y->graduation_year}: {$y->cnt}\n";
}

// 8. Country distribution
echo "\n8. COUNTRY DISTRIBUTION\n";
$countries = DB::table('alumni_profiles')
    ->selectRaw('country, COUNT(*) as cnt')
    ->groupBy('country')
    ->orderByDesc('cnt')
    ->limit(10)
    ->get();
foreach ($countries as $c) {
    $country = $c->country ?? 'NULL';
    echo "   $country: {$c->cnt}\n";
}

// 9. Check for orphan / duplicate data
echo "\n9. DATA INTEGRITY CHECKS\n";
$orphanProfiles = DB::table('alumni_profiles')
    ->leftJoin('users', 'alumni_profiles.user_id', '=', 'users.id')
    ->whereNull('users.id')
    ->count();
echo "   Orphan alumni_profiles (no user): $orphanProfiles\n";

$duplicateUsers = DB::table('alumni_profiles')
    ->selectRaw('user_id, COUNT(*) as cnt')
    ->groupBy('user_id')
    ->having('cnt', '>', 1)
    ->count();
echo "   Duplicate profiles (same user_id): $duplicateUsers\n";

$noProfile = DB::table('users')
    ->where('role', 'alumni')
    ->leftJoin('alumni_profiles', 'users.id', '=', 'alumni_profiles.user_id')
    ->whereNull('alumni_profiles.id')
    ->count();
echo "   Alumni users without profile: $noProfile\n";

// 10. Null employment_status for employed-looking records
$weirdStatus = AlumniProfile::where(function($q) {
    $q->whereNotNull('current_job_title')
      ->orWhereNotNull('current_employer');
})->where(function($q) {
    $q->whereNull('employment_status')
      ->orWhereIn('employment_status', ['unemployed_seeking','unemployed_not_seeking']);
})->count();
echo "   Has job info but status = unemployed/null: $weirdStatus\n";

echo "\n═══════════════════════════════════════════════════════\n";
echo "  AUDIT COMPLETE\n";
echo "═══════════════════════════════════════════════════════\n";
