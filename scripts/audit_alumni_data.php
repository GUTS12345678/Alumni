<?php

/**
 * Data Audit Script - Alumni Tracer System
 * 
 * This script identifies data inconsistencies and issues across all alumni-related tables.
 * Run this before implementing any major changes to understand data quality.
 * 
 * Usage: php scripts/audit_alumni_data.php
 */

require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use App\Models\AlumniProfile;
use App\Models\Employment;
use App\Models\Course;
use App\Models\Batch;
use Illuminate\Support\Facades\DB;

echo "\n╔════════════════════════════════════════════════════════════════╗\n";
echo "║       ALUMNI TRACER SYSTEM - DATA AUDIT REPORT                ║\n";
echo "║       Date: " . date('Y-m-d H:i:s') . "                            ║\n";
echo "╚════════════════════════════════════════════════════════════════╝\n\n";

$issues = [];
$totalIssues = 0;

// ============================================================================
// 1. USER & PROFILE DATA AUDIT
// ============================================================================
echo "📋 [1/10] Auditing User & Profile Data...\n";

// Missing profiles
$usersWithoutProfiles = User::whereDoesntHave('alumniProfile')
    ->where('role', 'alumni')
    ->count();
$issues['users_without_profiles'] = $usersWithoutProfiles;
if ($usersWithoutProfiles > 0) {
    echo "   ⚠️  {$usersWithoutProfiles} alumni users have no profile\n";
    $totalIssues += $usersWithoutProfiles;
}

// Orphaned profiles
$orphanedProfiles = AlumniProfile::whereDoesntHave('user')->count();
$issues['orphaned_profiles'] = $orphanedProfiles;
if ($orphanedProfiles > 0) {
    echo "   ⚠️  {$orphanedProfiles} alumni profiles have no user account\n";
    $totalIssues += $orphanedProfiles;
}

// Missing email addresses
$missingEmails = User::whereNull('email')
    ->orWhere('email', '')
    ->count();
$issues['missing_emails'] = $missingEmails;
if ($missingEmails > 0) {
    echo "   ⚠️  {$missingEmails} users have no email address\n";
    $totalIssues += $missingEmails;
}

echo "   ✓ User & Profile audit complete\n\n";

// ============================================================================
// 2. GRADUATION DATA AUDIT
// ============================================================================
echo "📋 [2/10] Auditing Graduation Data...\n";

// Missing graduation year
$missingGraduationYear = AlumniProfile::whereNull('graduation_year')
    ->orWhere('graduation_year', '')
    ->orWhere('graduation_year', 0)
    ->count();
$issues['missing_graduation_year'] = $missingGraduationYear;
if ($missingGraduationYear > 0) {
    echo "   ⚠️  {$missingGraduationYear} alumni have no graduation year\n";
    $totalIssues += $missingGraduationYear;
}

// Invalid graduation years (too old or future)
$invalidGraduationYears = AlumniProfile::where(function($q) {
    $q->where('graduation_year', '<', 1978)
      ->orWhere('graduation_year', '>', date('Y') + 1);
})->count();
$issues['invalid_graduation_years'] = $invalidGraduationYears;
if ($invalidGraduationYears > 0) {
    echo "   ⚠️  {$invalidGraduationYears} alumni have invalid graduation years\n";
    $totalIssues += $invalidGraduationYears;
}

echo "   ✓ Graduation data audit complete\n\n";

// ============================================================================
// 3. COURSE & DEPARTMENT DATA AUDIT
// ============================================================================
echo "📋 [3/10] Auditing Course & Department Data...\n";

// Missing course assignment
$missingCourse = AlumniProfile::whereNull('course_id')
    ->orWhere('course_id', 0)
    ->count();
$issues['missing_course'] = $missingCourse;
if ($missingCourse > 0) {
    echo "   ⚠️  {$missingCourse} alumni have no course assignment\n";
    $totalIssues += $missingCourse;
}

// Invalid course IDs
$invalidCourseIds = AlumniProfile::whereNotNull('course_id')
    ->whereNotIn('course_id', Course::pluck('id'))
    ->count();
$issues['invalid_course_ids'] = $invalidCourseIds;
if ($invalidCourseIds > 0) {
    echo "   ⚠️  {$invalidCourseIds} alumni assigned to non-existent courses\n";
    $totalIssues += $invalidCourseIds;
}

// Missing department
$missingDepartment = AlumniProfile::whereNull('department_id')
    ->orWhere('department_id', 0)
    ->count();
$issues['missing_department'] = $missingDepartment;
if ($missingDepartment > 0) {
    echo "   ⚠️  {$missingDepartment} alumni have no department assignment\n";
    $totalIssues += $missingDepartment;
}

echo "   ✓ Course & Department audit complete\n\n";

// ============================================================================
// 4. BATCH DATA AUDIT
// ============================================================================
echo "📋 [4/10] Auditing Batch Data...\n";

// Missing batch assignment
$missingBatch = AlumniProfile::whereNull('batch_id')
    ->orWhere('batch_id', 0)
    ->count();
$issues['missing_batch'] = $missingBatch;
if ($missingBatch > 0) {
    echo "   ⚠️  {$missingBatch} alumni have no batch assignment\n";
    $totalIssues += $missingBatch;
}

// Invalid batch IDs
$invalidBatchIds = AlumniProfile::whereNotNull('batch_id')
    ->whereNotIn('batch_id', Batch::pluck('id'))
    ->count();
$issues['invalid_batch_ids'] = $invalidBatchIds;
if ($invalidBatchIds > 0) {
    echo "   ⚠️  {$invalidBatchIds} alumni assigned to non-existent batches\n";
    $totalIssues += $invalidBatchIds;
}

echo "   ✓ Batch data audit complete\n\n";

// ============================================================================
// 5. EMPLOYMENT DATA AUDIT
// ============================================================================
echo "📋 [5/10] Auditing Employment Data...\n";

// Invalid employment dates (end before start)
$invalidEmploymentDates = Employment::whereNotNull('end_date')
    ->whereRaw('end_date < start_date')
    ->count();
$issues['invalid_employment_dates'] = $invalidEmploymentDates;
if ($invalidEmploymentDates > 0) {
    echo "   ⚠️  {$invalidEmploymentDates} employment records have end_date before start_date\n";
    $totalIssues += $invalidEmploymentDates;
}

// Future start dates
$futureStartDates = Employment::where('start_date', '>', now())
    ->count();
$issues['future_employment_start'] = $futureStartDates;
if ($futureStartDates > 0) {
    echo "   ⚠️  {$futureStartDates} employment records have future start dates\n";
    $totalIssues += $futureStartDates;
}

// Missing company name
$missingCompany = Employment::whereNull('company_name')
    ->orWhere('company_name', '')
    ->count();
$issues['missing_company_name'] = $missingCompany;
if ($missingCompany > 0) {
    echo "   ⚠️  {$missingCompany} employment records have no company name\n";
    $totalIssues += $missingCompany;
}

// Missing job title (position)
$missingJobTitle = Employment::whereNull('position')
    ->orWhere('position', '')
    ->count();
$issues['missing_job_title'] = $missingJobTitle;
if ($missingJobTitle > 0) {
    echo "   ⚠️  {$missingJobTitle} employment records have no job title (position)\n";
    $totalIssues += $missingJobTitle;
}

// Orphaned employment records
$orphanedEmployment = Employment::whereDoesntHave('alumni')->count();
$issues['orphaned_employment'] = $orphanedEmployment;
if ($orphanedEmployment > 0) {
    echo "   ⚠️  {$orphanedEmployment} employment records have no associated user\n";
    $totalIssues += $orphanedEmployment;
}

echo "   ✓ Employment data audit complete\n\n";

// ============================================================================
// 6. CONTACT INFORMATION AUDIT
// ============================================================================
echo "📋 [6/10] Auditing Contact Information...\n";

// Missing contact numbers
$missingContact = AlumniProfile::whereNull('contact_number')
    ->orWhere('contact_number', '')
    ->count();
$issues['missing_contact_number'] = $missingContact;
if ($missingContact > 0) {
    echo "   ⚠️  {$missingContact} alumni have no contact number\n";
    $totalIssues += $missingContact;
}

// Invalid email formats
$invalidEmails = User::whereNotNull('email')
    ->where('email', '!=', '')
    ->whereRaw("email NOT REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'")
    ->count();
$issues['invalid_email_format'] = $invalidEmails;
if ($invalidEmails > 0) {
    echo "   ⚠️  {$invalidEmails} users have invalid email formats\n";
    $totalIssues += $invalidEmails;
}

echo "   ✓ Contact information audit complete\n\n";

// ============================================================================
// 7. DATA COMPLETENESS AUDIT
// ============================================================================
echo "📋 [7/10] Auditing Data Completeness...\n";

// Incomplete profiles (missing critical data)
$incompleteProfiles = AlumniProfile::where(function($q) {
    $q->whereNull('first_name')
      ->orWhereNull('last_name')
      ->orWhereNull('graduation_year')
      ->orWhereNull('course_id');
})->count();
$issues['incomplete_profiles'] = $incompleteProfiles;
if ($incompleteProfiles > 0) {
    echo "   ⚠️  {$incompleteProfiles} profiles are incomplete (missing critical data)\n";
    $totalIssues += $incompleteProfiles;
}

echo "   ✓ Data completeness audit complete\n\n";

// ============================================================================
// 8. COURSE-JOB ALIGNMENT AUDIT
// ============================================================================
echo "📋 [8/10] Auditing Course-Job Alignment Data...\n";

// Employment records without alignment status
$missingAlignment = Employment::whereNull('is_course_aligned')->count();
$issues['missing_alignment_status'] = $missingAlignment;
if ($missingAlignment > 0) {
    echo "   ⚠️  {$missingAlignment} employment records missing course alignment status\n";
    $totalIssues += $missingAlignment;
}

// Employment records without job category
$missingJobCategory = Employment::whereNull('job_category')
    ->orWhere('job_category', '')
    ->count();
$issues['missing_job_category'] = $missingJobCategory;
if ($missingJobCategory > 0) {
    echo "   ⚠️  {$missingJobCategory} employment records missing job category\n";
    $totalIssues += $missingJobCategory;
}

echo "   ✓ Course-Job alignment audit complete\n\n";

// ============================================================================
// 9. SURVEY RESPONSE AUDIT
// ============================================================================
echo "📋 [9/10] Auditing Survey Responses...\n";

// Count survey responses
$totalSurveyResponses = DB::table('survey_responses')->count();
$incompleteSurveyResponses = DB::table('survey_responses')
    ->where('is_complete', false)
    ->count();
$issues['incomplete_survey_responses'] = $incompleteSurveyResponses;

echo "   ℹ️  Total survey responses: {$totalSurveyResponses}\n";
if ($incompleteSurveyResponses > 0) {
    echo "   ⚠️  {$incompleteSurveyResponses} incomplete survey responses\n";
}

echo "   ✓ Survey response audit complete\n\n";

// ============================================================================
// 10. SUMMARY STATISTICS
// ============================================================================
echo "📋 [10/10] Generating Summary Statistics...\n\n";

$totalAlumni = User::where('role', 'alumni')->count();
$totalProfiles = AlumniProfile::count();
$totalEmploymentRecords = Employment::count();
$totalCourses = Course::count();
$totalBatches = Batch::count();

echo "═══════════════════════════════════════════════════════════════════\n";
echo "                        SUMMARY STATISTICS                          \n";
echo "═══════════════════════════════════════════════════════════════════\n";
echo sprintf("Total Alumni Users:        %6d\n", $totalAlumni);
echo sprintf("Total Alumni Profiles:     %6d\n", $totalProfiles);
echo sprintf("Total Employment Records:  %6d\n", $totalEmploymentRecords);
echo sprintf("Total Courses:             %6d\n", $totalCourses);
echo sprintf("Total Batches:             %6d\n", $totalBatches);
echo "═══════════════════════════════════════════════════════════════════\n\n";

// ============================================================================
// ISSUE SUMMARY
// ============================================================================
echo "═══════════════════════════════════════════════════════════════════\n";
echo "                         ISSUE SUMMARY                              \n";
echo "═══════════════════════════════════════════════════════════════════\n";

if ($totalIssues === 0) {
    echo "✅ No data issues found! Your database is clean.\n";
} else {
    echo "⚠️  TOTAL ISSUES FOUND: {$totalIssues}\n\n";
    
    echo "Critical Issues (Fix First):\n";
    echo "─────────────────────────────────────────────────────────────────\n";
    if (isset($issues['orphaned_profiles']) && $issues['orphaned_profiles'] > 0) {
        echo "  • {$issues['orphaned_profiles']} orphaned profiles\n";
    }
    if (isset($issues['invalid_employment_dates']) && $issues['invalid_employment_dates'] > 0) {
        echo "  • {$issues['invalid_employment_dates']} invalid employment dates\n";
    }
    if (isset($issues['invalid_graduation_years']) && $issues['invalid_graduation_years'] > 0) {
        echo "  • {$issues['invalid_graduation_years']} invalid graduation years\n";
    }
    
    echo "\nHigh Priority Issues:\n";
    echo "─────────────────────────────────────────────────────────────────\n";
    if (isset($issues['missing_graduation_year']) && $issues['missing_graduation_year'] > 0) {
        echo "  • {$issues['missing_graduation_year']} missing graduation years\n";
    }
    if (isset($issues['missing_course']) && $issues['missing_course'] > 0) {
        echo "  • {$issues['missing_course']} missing course assignments\n";
    }
    if (isset($issues['missing_batch']) && $issues['missing_batch'] > 0) {
        echo "  • {$issues['missing_batch']} missing batch assignments\n";
    }
    
    echo "\nMedium Priority Issues:\n";
    echo "─────────────────────────────────────────────────────────────────\n";
    if (isset($issues['missing_alignment_status']) && $issues['missing_alignment_status'] > 0) {
        echo "  • {$issues['missing_alignment_status']} missing alignment status\n";
    }
    if (isset($issues['missing_contact_number']) && $issues['missing_contact_number'] > 0) {
        echo "  • {$issues['missing_contact_number']} missing contact numbers\n";
    }
}

echo "═══════════════════════════════════════════════════════════════════\n\n";

// ============================================================================
// RECOMMENDATIONS
// ============================================================================
echo "💡 RECOMMENDATIONS:\n";
echo "═══════════════════════════════════════════════════════════════════\n";
echo "1. Run cleanup script: php scripts/cleanup_alumni_data.php --dry-run\n";
echo "2. Review the cleanup preview and verify the changes\n";
echo "3. Run actual cleanup: php scripts/cleanup_alumni_data.php\n";
echo "4. Contact alumni with missing critical information\n";
echo "5. Re-run this audit after cleanup to verify fixes\n";
echo "═══════════════════════════════════════════════════════════════════\n\n";

// Export detailed report to JSON
$reportData = [
    'audit_date' => date('Y-m-d H:i:s'),
    'total_issues' => $totalIssues,
    'issues' => $issues,
    'statistics' => [
        'total_alumni' => $totalAlumni,
        'total_profiles' => $totalProfiles,
        'total_employment_records' => $totalEmploymentRecords,
        'total_courses' => $totalCourses,
        'total_batches' => $totalBatches,
    ],
];

$reportPath = __DIR__ . '/audit_report_' . date('Y-m-d_His') . '.json';
file_put_contents($reportPath, json_encode($reportData, JSON_PRETTY_PRINT));
echo "📄 Detailed report saved to: {$reportPath}\n\n";

echo "Audit complete!\n";
