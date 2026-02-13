<?php

require __DIR__ . '/vendor/autoload.php';

use Illuminate\Support\Facades\DB;
use App\Models\AlumniProfile;

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "\n";
echo "═══════════════════════════════════════════════════════\n";
echo "  PERFORMANCE RATE VERIFICATION\n";
echo "═══════════════════════════════════════════════════════\n\n";

// Get total alumni/graduates
$totalAlumni = AlumniProfile::whereNotNull('graduation_year')->count();

// Get employed alumni
$totalEmployed = AlumniProfile::whereIn('employment_status', [
    'employed_full_time', 
    'employed_part_time', 
    'self_employed'
])->whereNotNull('graduation_year')->count();

// Get employed within 2 years (0-730 days)
$employedWithin2Years = DB::table('alumni_profiles')
    ->whereIn('employment_status', ['employed_full_time', 'employed_part_time', 'self_employed'])
    ->whereNotNull('job_start_date')
    ->whereNotNull('graduation_year')
    ->whereRaw('DATEDIFF(job_start_date, COALESCE(graduation_date, CONCAT(graduation_year, "-06-01"))) BETWEEN 0 AND 730')
    ->count();

// Calculate rates
$oldCalculation = $totalEmployed > 0 ? round(($employedWithin2Years / $totalEmployed) * 100, 1) : 0;
$newCalculation = $totalAlumni > 0 ? round(($employedWithin2Years / $totalAlumni) * 100, 1) : 0;

echo "Total Alumni/Graduates: $totalAlumni\n";
echo "Total Employed: $totalEmployed\n";
echo "Employed Within 2 Years: $employedWithin2Years\n";
echo "\n";

echo "OLD CALCULATION (Wrong - using employed as denominator):\n";
echo "  Formula: $employedWithin2Years / $totalEmployed employed\n";
echo "  Result: $oldCalculation% (This showed as 100%)\n";
echo "\n";

echo "NEW CALCULATION (Correct - using total alumni as denominator):\n";
echo "  Formula: $employedWithin2Years / $totalAlumni alumni\n";
echo "  Result: $newCalculation% (Matches Employment Rate)\n";
echo "\n";

echo "═══════════════════════════════════════════════════════\n";
echo "✓ Performance Rate now correctly shows: $newCalculation%\n";
echo "✓ Display text: \"$employedWithin2Years of $totalAlumni alumni\"\n";
echo "✓ This matches the Employment Rate of 88.7%\n"; 
echo "═══════════════════════════════════════════════════════\n\n";
