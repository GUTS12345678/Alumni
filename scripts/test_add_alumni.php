<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\User;

$admin = User::where('role', 'super_admin')->first();
Auth::guard('web')->login($admin);

echo "Testing Add Alumni with full survey fields...\n";

DB::beginTransaction();

$request = Request::create('/api/v1/admin/alumni', 'POST', [
    'first_name' => 'Test',
    'last_name' => 'SurveyAlumni',
    'maiden_name' => 'DelaCruz',
    'email' => 'test.survey.alumni.' . time() . '@test.com',
    'student_id' => '2020-99999',
    'age' => 25,
    'gender' => 'Female',
    'place_of_birth' => 'Manila',
    'civil_status' => 'Single',
    'current_address' => '123 Test St, Manila',
    'phone' => '02-1234567',
    'mobile_no' => '09171234567',
    'campus_id' => 1,
    'degree_program' => 'BS Information Technology',
    'major' => 'Web Development',
    'graduation_year' => 2024,
    'enrollment_year' => 2020,
    'honors_awards' => 'Cum Laude',
    'presently_employed' => 'Yes',
    'employment_location' => 'Local',
    'current_employer' => 'Test Corp',
    'company_address' => '456 Business Ave, Makati',
    'current_job_title' => 'Software Engineer',
    'date_hired' => '2024-06-01',
    'years_of_service' => 1.5,
    'job_aligned_to_course' => 'Yes',
    'average_monthly_income' => '25,001.00 & up',
    'employment_status' => 'Permanent',
    'job_level_position' => 'Professional',
    'major_line_of_business' => 'Information Tech./Arts',
    'achievements' => 'Best Thesis Award',
    'about_me' => 'Proud EARIST graduate.',
], [], [], [
    'HTTP_ACCEPT' => 'application/json',
    'HTTP_X_REQUESTED_WITH' => 'XMLHttpRequest',
]);
$request->setUserResolver(fn() => Auth::user());

try {
    $response = app()->handle($request);
} catch (\Throwable $e) {
    echo "✗ Exception: " . $e->getMessage() . "\n";
    echo "  File: " . $e->getFile() . ":" . $e->getLine() . "\n";
    DB::rollBack();
    exit(1);
}
$status = $response->getStatusCode();
$body = json_decode($response->getContent(), true);

if ($status === 201 && ($body['success'] ?? false)) {
    echo "✓ Alumni created successfully (HTTP {$status})\n";
    $profile = $body['data'] ?? [];
    echo "  ID: {$profile['id']}\n";
    echo "  Name: {$profile['first_name']} {$profile['last_name']}\n";
    echo "  Maiden: " . ($profile['maiden_name'] ?? 'N/A') . "\n";
    echo "  Gender: " . ($profile['gender'] ?? 'N/A') . "\n";
    echo "  Student ID: " . ($profile['student_id'] ?? 'N/A') . "\n";
    echo "  Campus ID: " . ($profile['campus_id'] ?? 'N/A') . "\n";
    echo "  Degree: " . ($profile['degree_program'] ?? 'N/A') . "\n";
    echo "  Employer: " . ($profile['current_employer'] ?? 'N/A') . "\n";
    echo "  Monthly Income: " . ($profile['average_monthly_income'] ?? 'N/A') . "\n";
    echo "  Achievements: " . ($profile['achievements'] ?? 'N/A') . "\n";
    echo "  About Me: " . ($profile['about_me'] ?? 'N/A') . "\n";
    echo "  Job Level: " . ($profile['job_level_position'] ?? 'N/A') . "\n";
    echo "  Honors: " . ($profile['honors_awards'] ?? 'N/A') . "\n";
} else {
    echo "✗ Failed (HTTP {$status})\n";
    echo "  Message: " . ($body['message'] ?? 'Unknown') . "\n";
    echo "  Error: " . ($body['error'] ?? 'N/A') . "\n";
    if (isset($body['errors'])) {
        foreach ($body['errors'] as $field => $errs) {
            echo "  {$field}: " . implode(', ', $errs) . "\n";
        }
    }
}

DB::rollBack();
echo "\nDone (rolled back).\n";
