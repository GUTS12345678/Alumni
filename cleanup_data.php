<?php
/**
 * Alumni Data Cleanup Script
 * Fixes all data quality issues found during the audit:
 * 
 * 1. Fix job_start_date to be realistic (within 0-24 months after graduation)
 * 2. Fix contradictory records (has job info but status = unemployed)
 * 3. Populate career_field from company_industry
 * 4. Populate job_mismatch_reason using job_related_to_degree  
 * 5. Populate employment_location_type (local/foreign)
 * 6. Fill missing salary_range for employed alumni
 */

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\AlumniProfile;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

echo "═══════════════════════════════════════════════════════\n";
echo "  ALUMNI DATA CLEANUP\n";
echo "═══════════════════════════════════════════════════════\n\n";

$fixes = [
    'job_start_date_fixed' => 0,
    'employment_status_fixed' => 0,
    'career_field_populated' => 0,
    'job_mismatch_populated' => 0,
    'location_type_populated' => 0,
    'salary_range_populated' => 0,
    'job_related_populated' => 0,
];

// ═══════════════════════════════════════════════════════
// FIX 1: Realistic job_start_date for employed alumni
// ═══════════════════════════════════════════════════════
echo "1. FIXING JOB START DATES\n";
echo "   Problem: Seeder generated random dates causing 886-day avg\n";
echo "   Solution: Set job_start_date to 1-18 months after graduation\n\n";

$employed = AlumniProfile::whereIn('employment_status', [
    'employed_full_time', 'employed_part_time', 'self_employed'
])->get();

foreach ($employed as $alumni) {
    $gradDate = $alumni->graduation_date
        ? Carbon::parse($alumni->graduation_date)
        : ($alumni->graduation_year 
            ? Carbon::parse($alumni->graduation_year . '-06-01')
            : null);
    
    if (!$gradDate) continue;
    
    $currentJobStart = $alumni->job_start_date ? Carbon::parse($alumni->job_start_date) : null;
    $needsFix = false;
    
    if (!$currentJobStart) {
        $needsFix = true;
    } else {
        $daysDiff = $gradDate->diffInDays($currentJobStart, false);
        // Fix if: negative (started before grad), >730 days (>2 years), or unreasonable
        if ($daysDiff < 0 || $daysDiff > 730) {
            $needsFix = true;
        }
    }
    
    if ($needsFix) {
        // Generate realistic job start date:
        // - 60% find jobs within 1-6 months (30-180 days)
        // - 25% find jobs within 6-12 months (180-365 days)
        // - 15% find jobs within 12-18 months (365-540 days)
        $rand = mt_rand(1, 100);
        if ($rand <= 60) {
            $daysAfterGrad = mt_rand(30, 180);
        } elseif ($rand <= 85) {
            $daysAfterGrad = mt_rand(180, 365);
        } else {
            $daysAfterGrad = mt_rand(365, 540);
        }
        
        $newJobStart = $gradDate->copy()->addDays($daysAfterGrad);
        
        // Don't set future dates
        if ($newJobStart->isFuture()) {
            $newJobStart = Carbon::now()->subDays(mt_rand(30, 180));
        }
        
        $alumni->job_start_date = $newJobStart;
        $alumni->save();
        $fixes['job_start_date_fixed']++;
    }
}
echo "   Fixed: {$fixes['job_start_date_fixed']} records\n\n";

// ═══════════════════════════════════════════════════════
// FIX 2: Fix contradictory employment status
// ═══════════════════════════════════════════════════════
echo "2. FIXING CONTRADICTORY EMPLOYMENT STATUS\n";
echo "   Problem: 105 alumni have job title/employer but status = unemployed\n";

$contradictory = AlumniProfile::where(function($q) {
    $q->whereNotNull('current_job_title')
      ->where('current_job_title', '!=', '');
})->where(function($q) {
    $q->whereNotNull('current_employer')
      ->where('current_employer', '!=', '');
})->whereNotIn('employment_status', [
    'employed_full_time', 'employed_part_time', 'self_employed'
])->get();

foreach ($contradictory as $alumni) {
    // Assign realistic employment type based on job title
    $title = strtolower($alumni->current_job_title ?? '');
    
    if (str_contains($title, 'freelanc') || str_contains($title, 'entrepreneur') || 
        str_contains($title, 'owner') || str_contains($title, 'founder') ||
        str_contains($title, 'consultant')) {
        $alumni->employment_status = 'self_employed';
    } elseif (str_contains($title, 'part-time') || str_contains($title, 'part time') ||
              str_contains($title, 'intern') || str_contains($title, 'assistant')) {
        $alumni->employment_status = 'employed_part_time';
    } else {
        $alumni->employment_status = 'employed_full_time';
    }
    
    $alumni->save();
    $fixes['employment_status_fixed']++;
}
echo "   Fixed: {$fixes['employment_status_fixed']} records\n\n";

// ═══════════════════════════════════════════════════════
// FIX 3: Populate career_field from company_industry
// ═══════════════════════════════════════════════════════
echo "3. POPULATING career_field FROM company_industry\n";
echo "   Problem: career_field is 0% filled\n";

$industryToCareerField = [
    // IT & Tech
    'technology' => 'information_technology',
    'information technology' => 'information_technology',
    'software' => 'information_technology',
    'it' => 'information_technology',
    'computer' => 'information_technology',
    'telecommunications' => 'information_technology',
    'internet' => 'information_technology',
    'web' => 'information_technology',
    'data' => 'information_technology',
    'cyber' => 'information_technology',
    // Education
    'education' => 'education',
    'academic' => 'education',
    'teaching' => 'education',
    'training' => 'education',
    'university' => 'education',
    'school' => 'education',
    // Business
    'business' => 'business_management',
    'management' => 'business_management',
    'consulting' => 'business_management',
    'human resources' => 'business_management',
    'administration' => 'business_management',
    'real estate' => 'business_management',
    'retail' => 'business_management',
    // Healthcare
    'health' => 'healthcare',
    'medical' => 'healthcare',
    'pharmaceutical' => 'healthcare',
    'hospital' => 'healthcare',
    'nursing' => 'healthcare',
    'dental' => 'healthcare',
    // Engineering
    'engineering' => 'engineering',
    'construction' => 'engineering',
    'architecture' => 'engineering',
    'automotive' => 'engineering',
    'electrical' => 'engineering',
    'mechanical' => 'engineering',
    'civil' => 'engineering',
    // Government
    'government' => 'government',
    'public' => 'government',
    'military' => 'government',
    'law enforcement' => 'government',
    'police' => 'government',
    // Finance
    'finance' => 'finance',
    'banking' => 'finance',
    'accounting' => 'finance',
    'insurance' => 'finance',
    'investment' => 'finance',
    'financial' => 'finance',
    // Marketing
    'marketing' => 'marketing',
    'advertising' => 'marketing',
    'media' => 'marketing',
    'communications' => 'marketing',
    'public relations' => 'marketing',
    'digital marketing' => 'marketing',
    // Hospitality
    'hospitality' => 'hospitality',
    'hotel' => 'hospitality',
    'restaurant' => 'hospitality',
    'tourism' => 'hospitality',
    'food' => 'hospitality',
    'catering' => 'hospitality',
    'travel' => 'hospitality',
    // Manufacturing
    'manufacturing' => 'manufacturing',
    'production' => 'manufacturing',
    'factory' => 'manufacturing',
    'textile' => 'manufacturing',
    'electronics' => 'manufacturing',
    // Agriculture
    'agriculture' => 'agriculture',
    'farming' => 'agriculture',
    'fishery' => 'agriculture',
    'forestry' => 'agriculture',
    'livestock' => 'agriculture',
];

$alumniWithIndustry = AlumniProfile::whereNotNull('company_industry')
    ->where('company_industry', '!=', '')
    ->whereNull('career_field')
    ->get();

foreach ($alumniWithIndustry as $alumni) {
    $industry = strtolower($alumni->company_industry);
    $matched = false;
    
    foreach ($industryToCareerField as $keyword => $field) {
        if (str_contains($industry, $keyword)) {
            $alumni->career_field = $field;
            $alumni->save();
            $fixes['career_field_populated']++;
            $matched = true;
            break;
        }
    }
    
    if (!$matched) {
        $alumni->career_field = 'other';
        $alumni->save();
        $fixes['career_field_populated']++;
    }
}
echo "   Populated: {$fixes['career_field_populated']} records\n\n";

// ═══════════════════════════════════════════════════════
// FIX 4: Populate job_mismatch_reason  
// ═══════════════════════════════════════════════════════
echo "4. POPULATING job_mismatch_reason FOR EMPLOYED ALUMNI\n";
echo "   Problem: 186 employed alumni have NULL mismatch reason (counted as 'good match' by default)\n";

$employedNoMismatch = AlumniProfile::whereIn('employment_status', [
    'employed_full_time', 'employed_part_time', 'self_employed'
])->whereNull('job_mismatch_reason')->get();

foreach ($employedNoMismatch as $alumni) {
    if ($alumni->job_related_to_degree === true || $alumni->job_related_to_degree === 1) {
        // Job IS related to degree → good match
        $alumni->job_mismatch_reason = 'none';
    } elseif ($alumni->job_related_to_degree === false || $alumni->job_related_to_degree === 0) {
        // Job NOT related to degree → assign realistic mismatch
        $reasons = ['overqualified', 'underqualified', 'unfit', 'career_change'];
        $alumni->job_mismatch_reason = $reasons[array_rand($reasons)];
    } else {
        // No job_related_to_degree data → use career_field vs degree_program heuristic
        $careerField = strtolower($alumni->career_field ?? '');
        $degreeProgram = strtolower($alumni->degree_program ?? '');
        
        // Simple heuristic: if career field keyword appears in degree, it's a match
        $isMatch = false;
        $fieldKeywords = [
            'information_technology' => ['computer', 'information', 'technology', 'it', 'software', 'programming'],
            'education' => ['education', 'teaching', 'pedagogy'],
            'business_management' => ['business', 'management', 'administration', 'commerce'],
            'healthcare' => ['nursing', 'medical', 'health', 'pharmacy', 'biology'],
            'engineering' => ['engineering', 'civil', 'mechanical', 'electrical', 'architecture'],
            'finance' => ['accounting', 'finance', 'economics', 'banking'],
            'marketing' => ['marketing', 'communication', 'media', 'journalism'],
            'hospitality' => ['hospitality', 'tourism', 'hotel', 'culinary'],
            'agriculture' => ['agriculture', 'agri', 'fishery', 'forestry'],
        ];
        
        if (isset($fieldKeywords[$careerField])) {
            foreach ($fieldKeywords[$careerField] as $kw) {
                if (str_contains($degreeProgram, $kw)) {
                    $isMatch = true;
                    break;
                }
            }
        }
        
        if ($isMatch) {
            $alumni->job_mismatch_reason = 'none';
        } else {
            // Distribute realistically: 50% good match, 20% overqualified, 15% underqualified, 15% career change
            $rand = mt_rand(1, 100);
            if ($rand <= 50) {
                $alumni->job_mismatch_reason = 'none';
            } elseif ($rand <= 70) {
                $alumni->job_mismatch_reason = 'overqualified';
            } elseif ($rand <= 85) {
                $alumni->job_mismatch_reason = 'underqualified';
            } else {
                $alumni->job_mismatch_reason = 'career_change';
            }
        }
    }
    
    // Also populate job_related_to_degree if null
    if (is_null($alumni->job_related_to_degree)) {
        $alumni->job_related_to_degree = in_array($alumni->job_mismatch_reason, ['none']);
        $fixes['job_related_populated']++;
    }
    
    $alumni->save();
    $fixes['job_mismatch_populated']++;
}
echo "   Populated: {$fixes['job_mismatch_populated']} records\n";
echo "   Also filled job_related_to_degree: {$fixes['job_related_populated']} records\n\n";

// ═══════════════════════════════════════════════════════
// FIX 5: Populate employment_location_type
// ═══════════════════════════════════════════════════════
echo "5. POPULATING employment_location_type\n";
echo "   Adding local/foreign/remote distribution\n";

$allAlumni = AlumniProfile::all();

foreach ($allAlumni as $alumni) {
    if (in_array($alumni->employment_status, ['employed_full_time', 'employed_part_time', 'self_employed'])) {
        // Employed alumni — Philippines stats:
        // ~85% work locally, ~10% OFW/foreign, ~5% remote for foreign companies
        $rand = mt_rand(1, 100);
        if ($rand <= 85) {
            $alumni->employment_location_type = 'local';
        } elseif ($rand <= 95) {
            $alumni->employment_location_type = 'foreign';
        } else {
            $alumni->employment_location_type = 'remote';
        }
    } else {
        $alumni->employment_location_type = 'not_applicable';
    }
    
    $alumni->save();
    $fixes['location_type_populated']++;
}
echo "   Populated: {$fixes['location_type_populated']} records\n\n";

// ═══════════════════════════════════════════════════════
// FIX 6: Populate salary_range for employed alumni 
// ═══════════════════════════════════════════════════════
echo "6. POPULATING salary_range FOR EMPLOYED ALUMNI\n";

$employedNoSalary = AlumniProfile::whereIn('employment_status', [
    'employed_full_time', 'employed_part_time', 'self_employed'
])->whereNull('salary_range')->get();

$salaryDistribution = [
    'below_15k'     => 15,  // 15%
    '15k_25k'       => 30,  // 30%
    '25k_35k'       => 25,  // 25%
    '35k_50k'       => 15,  // 15%
    '50k_75k'       => 8,   // 8%
    '75k_100k'      => 4,   // 4%
    'above_100k'    => 2,   // 2%
    'prefer_not_say' => 1,  // 1%
];

foreach ($employedNoSalary as $alumni) {
    $rand = mt_rand(1, 100);
    $cumulative = 0;
    foreach ($salaryDistribution as $range => $pct) {
        $cumulative += $pct;
        if ($rand <= $cumulative) {
            $alumni->salary_range = $range;
            break;
        }
    }
    $alumni->save();
    $fixes['salary_range_populated']++;
}
echo "   Populated: {$fixes['salary_range_populated']} records\n\n";

// ═══════════════════════════════════════════════════════
// FIX 7: Now fix job_start_date for the newly-employed from Fix 2
// ═══════════════════════════════════════════════════════
echo "7. FIXING JOB START DATES FOR NEWLY-FIXED EMPLOYED ALUMNI\n";

$newlyEmployed = AlumniProfile::whereIn('employment_status', [
    'employed_full_time', 'employed_part_time', 'self_employed'
])->whereNull('job_start_date')->get();

$fixedNewDates = 0;
foreach ($newlyEmployed as $alumni) {
    $gradDate = $alumni->graduation_date
        ? Carbon::parse($alumni->graduation_date)
        : ($alumni->graduation_year 
            ? Carbon::parse($alumni->graduation_year . '-06-01')
            : null);
    
    if (!$gradDate) continue;
    
    $rand = mt_rand(1, 100);
    if ($rand <= 60) {
        $daysAfterGrad = mt_rand(30, 180);
    } elseif ($rand <= 85) {
        $daysAfterGrad = mt_rand(180, 365);
    } else {
        $daysAfterGrad = mt_rand(365, 540);
    }
    
    $newJobStart = $gradDate->copy()->addDays($daysAfterGrad);
    if ($newJobStart->isFuture()) {
        $newJobStart = Carbon::now()->subDays(mt_rand(30, 180));
    }
    
    $alumni->job_start_date = $newJobStart;
    $alumni->save();
    $fixedNewDates++;
}
echo "   Fixed: $fixedNewDates records\n\n";

// ═══════════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════════
echo "═══════════════════════════════════════════════════════\n";
echo "  CLEANUP SUMMARY\n";
echo "═══════════════════════════════════════════════════════\n\n";

foreach ($fixes as $key => $count) {
    echo "  $key: $count\n";
}

// Verify: re-run the avg time to employment calc
echo "\n  VERIFICATION — New Avg Time to Employment:\n";
$employed = AlumniProfile::whereIn('employment_status', [
    'employed_full_time', 'employed_part_time', 'self_employed'
])->whereNotNull('graduation_year')
  ->whereNotNull('job_start_date')
  ->get();

$totalDays = 0;
$valid = 0;
$buckets = ['0-90' => 0, '91-180' => 0, '181-365' => 0, '366-540' => 0, '>540' => 0];

foreach ($employed as $a) {
    $grad = $a->graduation_date 
        ? Carbon::parse($a->graduation_date)
        : Carbon::parse($a->graduation_year . '-06-01');
    $job = Carbon::parse($a->job_start_date);
    $days = $grad->diffInDays($job, false);
    
    if ($days >= 0 && $days <= 1825) {
        $totalDays += $days;
        $valid++;
        
        if ($days <= 90) $buckets['0-90']++;
        elseif ($days <= 180) $buckets['91-180']++;
        elseif ($days <= 365) $buckets['181-365']++;
        elseif ($days <= 540) $buckets['366-540']++;
        else $buckets['>540']++;
    }
}

$avg = $valid > 0 ? round($totalDays / $valid) : 0;
echo "  Total employed with dates: " . count($employed) . "\n";
echo "  Valid records: $valid\n";
echo "  NEW Average: $avg days (~" . round($avg / 30, 1) . " months)\n";
echo "  Distribution:\n";
foreach ($buckets as $b => $c) {
    $pct = $valid > 0 ? round($c / $valid * 100, 1) : 0;
    echo "    $b days: $c ({$pct}%)\n";
}

// Employment location breakdown
echo "\n  LOCATION TYPE BREAKDOWN:\n";
$locTypes = DB::table('alumni_profiles')
    ->whereIn('employment_status', ['employed_full_time','employed_part_time','self_employed'])
    ->selectRaw('employment_location_type, COUNT(*) as cnt')
    ->groupBy('employment_location_type')
    ->get();
foreach ($locTypes as $l) {
    echo "    {$l->employment_location_type}: {$l->cnt}\n";
}

// New employment rate
$totalAll = AlumniProfile::count();
$totalEmp = AlumniProfile::whereIn('employment_status', ['employed_full_time','employed_part_time','self_employed'])->count();
echo "\n  NEW Employment Rate: " . round($totalEmp / $totalAll * 100, 1) . "% ($totalEmp/$totalAll)\n";

echo "\n═══════════════════════════════════════════════════════\n";
echo "  CLEANUP COMPLETE\n";
echo "═══════════════════════════════════════════════════════\n";
