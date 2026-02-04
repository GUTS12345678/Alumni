<?php
/**
 * Data Distribution Checker
 * 
 * This script checks the actual data counts across the system
 * to understand inconsistencies between pages.
 */

require_once __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use App\Models\AlumniProfile;
use App\Models\Survey;
use App\Models\SurveyResponse;
use App\Models\Batch;
use App\Models\Department;
use App\Models\Course;
use Illuminate\Support\Facades\DB;

echo "\n";
echo "╔══════════════════════════════════════════════════════════════════╗\n";
echo "║           DATA DISTRIBUTION ANALYSIS                              ║\n";
echo "╚══════════════════════════════════════════════════════════════════╝\n\n";

// =============================================================================
// USERS TABLE ANALYSIS
// =============================================================================
echo "┌────────────────────────────────────────────────────────────────────┐\n";
echo "│ 1. USERS TABLE                                                     │\n";
echo "└────────────────────────────────────────────────────────────────────┘\n";

$totalUsers = User::count();
echo "Total Users: $totalUsers\n\n";

// By Role (uses 'role' column directly in users table)
echo "  By Role:\n";
$roleBreakdown = DB::table('users')
    ->select('role', DB::raw('COUNT(*) as count'))
    ->groupBy('role')
    ->get();

foreach ($roleBreakdown as $row) {
    $roleName = $row->role ?? 'no_role';
    echo "    - {$roleName}: {$row->count}\n";
}

// By Campus
echo "\n  By Campus (users.campus_id):\n";
$campusBreakdown = DB::table('users')
    ->leftJoin('campuses', 'users.campus_id', '=', 'campuses.id')
    ->select('campuses.code as campus_code', 'campuses.name as campus_name', DB::raw('COUNT(users.id) as count'))
    ->groupBy('campuses.code', 'campuses.name')
    ->get();

foreach ($campusBreakdown as $row) {
    $code = $row->campus_code ?? 'NULL';
    echo "    - {$code}: {$row->count}\n";
}

// Admins by campus
echo "\n  Admin Users by Campus:\n";
$adminsByCampus = DB::table('users')
    ->leftJoin('campuses', 'users.campus_id', '=', 'campuses.id')
    ->whereIn('role', ['admin', 'super_admin'])
    ->select('campuses.code as campus_code', DB::raw('COUNT(users.id) as count'))
    ->groupBy('campuses.code')
    ->get();

foreach ($adminsByCampus as $row) {
    $code = $row->campus_code ?? 'NULL';
    echo "    - {$code}: {$row->count}\n";
}

// =============================================================================
// ALUMNI_PROFILES TABLE ANALYSIS
// =============================================================================
echo "\n┌────────────────────────────────────────────────────────────────────┐\n";
echo "│ 2. ALUMNI_PROFILES TABLE                                           │\n";
echo "└────────────────────────────────────────────────────────────────────┘\n";

$totalProfiles = AlumniProfile::count();
echo "Total Alumni Profiles: $totalProfiles\n\n";

// By Campus
echo "  By Campus (alumni_profiles.campus_id):\n";
$profileCampusBreakdown = DB::table('alumni_profiles')
    ->leftJoin('campuses', 'alumni_profiles.campus_id', '=', 'campuses.id')
    ->select('campuses.code as campus_code', DB::raw('COUNT(alumni_profiles.id) as count'))
    ->groupBy('campuses.code')
    ->get();

foreach ($profileCampusBreakdown as $row) {
    $code = $row->campus_code ?? 'NULL';
    echo "    - {$code}: {$row->count}\n";
}

// By User's Campus (checking if there's mismatch)
echo "\n  By User's Campus (via user_id -> users.campus_id):\n";
$profileUserCampus = DB::table('alumni_profiles')
    ->join('users', 'alumni_profiles.user_id', '=', 'users.id')
    ->leftJoin('campuses', 'users.campus_id', '=', 'campuses.id')
    ->select('campuses.code as campus_code', DB::raw('COUNT(alumni_profiles.id) as count'))
    ->groupBy('campuses.code')
    ->get();

foreach ($profileUserCampus as $row) {
    $code = $row->campus_code ?? 'NULL';
    echo "    - {$code}: {$row->count}\n";
}

// Check for mismatches between alumni_profiles.campus_id and users.campus_id
$mismatches = DB::table('alumni_profiles')
    ->join('users', 'alumni_profiles.user_id', '=', 'users.id')
    ->whereRaw('alumni_profiles.campus_id != users.campus_id')
    ->count();
echo "\n  ⚠️  Mismatches (profile.campus_id != user.campus_id): $mismatches\n";

// =============================================================================
// SURVEYS ANALYSIS
// =============================================================================
echo "\n┌────────────────────────────────────────────────────────────────────┐\n";
echo "│ 3. SURVEYS TABLE                                                   │\n";
echo "└────────────────────────────────────────────────────────────────────┘\n";

$totalSurveys = Survey::count();
echo "Total Surveys: $totalSurveys\n\n";

// Check if surveys have campus_id column
$hasCampusColumn = DB::getSchemaBuilder()->hasColumn('surveys', 'campus_id');
echo "  Has campus_id column: " . ($hasCampusColumn ? 'YES' : 'NO') . "\n";

if ($hasCampusColumn) {
    $surveyCampus = DB::table('surveys')
        ->leftJoin('campuses', 'surveys.campus_id', '=', 'campuses.id')
        ->select('campuses.code as campus_code', DB::raw('COUNT(surveys.id) as count'))
        ->groupBy('campuses.code')
        ->get();
    
    echo "  By Campus:\n";
    foreach ($surveyCampus as $row) {
        $code = $row->campus_code ?? 'NULL (all campuses)';
        echo "    - {$code}: {$row->count}\n";
    }
}

// Survey Responses
$totalResponses = SurveyResponse::count();
echo "\n  Total Survey Responses: $totalResponses\n";

// =============================================================================
// BATCHES ANALYSIS
// =============================================================================
echo "\n┌────────────────────────────────────────────────────────────────────┐\n";
echo "│ 4. BATCHES TABLE                                                   │\n";
echo "└────────────────────────────────────────────────────────────────────┘\n";

$totalBatches = Batch::count();
echo "Total Batches: $totalBatches\n\n";

$hasCampusColumn = DB::getSchemaBuilder()->hasColumn('batches', 'campus_id');
echo "  Has campus_id column: " . ($hasCampusColumn ? 'YES' : 'NO') . "\n";

if ($hasCampusColumn) {
    $batchCampus = DB::table('batches')
        ->leftJoin('campuses', 'batches.campus_id', '=', 'campuses.id')
        ->select('campuses.code as campus_code', DB::raw('COUNT(batches.id) as count'))
        ->groupBy('campuses.code')
        ->get();
    
    echo "  By Campus:\n";
    foreach ($batchCampus as $row) {
        $code = $row->campus_code ?? 'NULL';
        echo "    - {$code}: {$row->count}\n";
    }
}

// =============================================================================
// DEPARTMENTS ANALYSIS
// =============================================================================
echo "\n┌────────────────────────────────────────────────────────────────────┐\n";
echo "│ 5. DEPARTMENTS TABLE                                               │\n";
echo "└────────────────────────────────────────────────────────────────────┘\n";

$totalDepts = Department::count();
echo "Total Departments: $totalDepts\n\n";

$hasCampusColumn = DB::getSchemaBuilder()->hasColumn('departments', 'campus_id');
echo "  Has campus_id column: " . ($hasCampusColumn ? 'YES' : 'NO') . "\n";

if ($hasCampusColumn) {
    $deptCampus = DB::table('departments')
        ->leftJoin('campuses', 'departments.campus_id', '=', 'campuses.id')
        ->select('campuses.code as campus_code', DB::raw('COUNT(departments.id) as count'))
        ->groupBy('campuses.code')
        ->get();
    
    echo "  By Campus:\n";
    foreach ($deptCampus as $row) {
        $code = $row->campus_code ?? 'NULL';
        echo "    - {$code}: {$row->count}\n";
    }
}

// =============================================================================
// COURSES ANALYSIS
// =============================================================================
echo "\n┌────────────────────────────────────────────────────────────────────┐\n";
echo "│ 6. COURSES TABLE                                                   │\n";
echo "└────────────────────────────────────────────────────────────────────┘\n";

$totalCourses = Course::count();
echo "Total Courses: $totalCourses\n\n";

$hasCampusColumn = DB::getSchemaBuilder()->hasColumn('courses', 'campus_id');
echo "  Has campus_id column: " . ($hasCampusColumn ? 'YES' : 'NO') . "\n";

if ($hasCampusColumn) {
    $courseCampus = DB::table('courses')
        ->leftJoin('campuses', 'courses.campus_id', '=', 'campuses.id')
        ->select('campuses.code as campus_code', DB::raw('COUNT(courses.id) as count'))
        ->groupBy('campuses.code')
        ->get();
    
    echo "  By Campus:\n";
    foreach ($courseCampus as $row) {
        $code = $row->campus_code ?? 'NULL';
        echo "    - {$code}: {$row->count}\n";
    }
}

// =============================================================================
// WHAT PAGES SEE
// =============================================================================
echo "\n";
echo "╔══════════════════════════════════════════════════════════════════╗\n";
echo "║           WHAT EACH PAGE WOULD SEE                                ║\n";
echo "╚══════════════════════════════════════════════════════════════════╝\n\n";

echo "If filtering by MAIN Campus (campus_id = 1):\n";
echo "  - Users: " . User::where('campus_id', 1)->count() . "\n";
echo "  - Alumni Profiles: " . AlumniProfile::where('campus_id', 1)->count() . "\n";

echo "\nIf filtering by CAVITE Campus (campus_id = 2):\n";
echo "  - Users: " . User::where('campus_id', 2)->count() . "\n";
echo "  - Alumni Profiles: " . AlumniProfile::where('campus_id', 2)->count() . "\n";

echo "\nIf NO campus filtering (all data):\n";
echo "  - Users: " . User::count() . "\n";
echo "  - Alumni Profiles: " . AlumniProfile::count() . "\n";

echo "\n";
echo "╔══════════════════════════════════════════════════════════════════╗\n";
echo "║           ANALYSIS COMPLETE                                       ║\n";
echo "╚══════════════════════════════════════════════════════════════════╝\n\n";
