<?php
/**
 * COMPREHENSIVE QA TEST — ALL Admin + Alumni + Auth + Public endpoints
 * Run: php scripts/qa_full_system.php
 */

require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\AlumniProfile;
use App\Models\Batch;
use App\Models\Campus;
use App\Models\Department;
use App\Models\Course;

// ── Globals ──
$passed = 0; $failed = 0; $skipped = 0; $errors = [];
$currentSection = '';

function section($name) {
    global $currentSection;
    $currentSection = $name;
    echo "\n=== {$name} ===\n";
}

function test($name, callable $fn) {
    global $passed, $failed, $skipped, $errors, $currentSection;
    try {
        $result = $fn();
        if ($result === 'skip') { echo "  ⚠ {$name} (skipped)\n"; $skipped++; return; }
        if ($result === false) throw new \Exception('returned false');
        echo "  ✓ {$name}\n";
        $passed++;
    } catch (\Throwable $e) {
        $msg = $e->getMessage();
        if (strlen($msg) > 200) $msg = substr($msg, 0, 200) . '...';
        echo "  ✗ {$name}: {$msg}\n";
        $failed++;
        $errors[] = ['section' => $currentSection, 'test' => $name, 'error' => $msg];
    }
}

function api($method, $uri, $params = [], $expectStatus = 200) {
    $fullUri = '/' . ltrim($uri, '/');
    $request = Request::create($fullUri, $method, $params, [], [], [
        'HTTP_ACCEPT' => 'application/json',
        'HTTP_X_REQUESTED_WITH' => 'XMLHttpRequest',
    ]);
    $request->setUserResolver(fn() => Auth::user());
    try {
        $response = app()->handle($request);
    } catch (\Throwable $e) {
        return ['status' => 500, 'body' => ['error' => $e->getMessage()], 'raw' => $e->getMessage()];
    }
    $s = $response->getStatusCode();
    $raw = $response->getContent();
    $body = json_decode($raw, true);
    return ['status' => $s, 'body' => $body, 'raw' => $raw];
}

function expectOk($r, $label = '') {
    if ($r['status'] >= 400) {
        $msg = $r['body']['message'] ?? $r['body']['error'] ?? substr($r['raw'] ?? '', 0, 150);
        throw new \Exception("HTTP {$r['status']}: {$msg}");
    }
    return true;
}

// ── Auth as super_admin ──
$admin = User::where('role', 'super_admin')->first() ?? User::where('role', 'admin')->first();
if (!$admin) { echo "✗ No admin user\n"; exit(1); }
Auth::guard('web')->login($admin);
echo "QA user: {$admin->email} ({$admin->role})\n";
echo "Started: " . date('Y-m-d H:i:s') . "\n";

// ═══════════════════════════════════════════════════════
// ADMIN API ENDPOINTS
// ═══════════════════════════════════════════════════════

// ── Dashboard ──
section('Admin Dashboard');
test('GET /api/v1/admin/dashboard', fn() => expectOk(api('GET', '/api/v1/admin/dashboard')));

// ── Alumni (already tested in detail, quick recheck) ──
section('Admin Alumni');
test('GET alumni list', fn() => expectOk(api('GET', '/api/v1/admin/alumni')));
test('GET alumni with filters', fn() => expectOk(api('GET', '/api/v1/admin/alumni?search=a&sort=name_asc')));
test('GET alumni export CSV', fn() => expectOk(api('GET', '/api/v1/admin/alumni/export?format=csv')));
test('GET alumni export Excel', fn() => expectOk(api('GET', '/api/v1/admin/alumni/export?format=excel')));
test('GET alumni export PDF', fn() => expectOk(api('GET', '/api/v1/admin/alumni/export?format=pdf')));
test('GET import template', fn() => expectOk(api('GET', '/api/v1/admin/alumni/import/template')));
test('GET single alumni', function() {
    $p = AlumniProfile::first();
    return $p ? expectOk(api('GET', "/api/v1/admin/alumni/{$p->id}")) : 'skip';
});
test('GET alumni 404', function() {
    $r = api('GET', '/api/v1/admin/alumni/999999');
    return $r['status'] === 404;
});

// ── Batches ──
section('Admin Batches');
test('GET batches', fn() => expectOk(api('GET', '/api/v1/admin/batches')));
test('GET batches paged', fn() => expectOk(api('GET', '/api/v1/admin/batches?per_page=100')));
test('CRUD batch', function() {
    DB::beginTransaction();
    $campus = Campus::first();
    $r = api('POST', '/api/v1/admin/batches', ['name' => 'QA Batch', 'graduation_year' => 2030, 'status' => 'active', 'campus_id' => $campus->id ?? 1]);
    expectOk($r);
    $id = $r['body']['data']['id'] ?? $r['body']['id'] ?? null;
    if ($id) {
        expectOk(api('PUT', "/api/v1/admin/batches/{$id}", ['name' => 'QA Batch Updated', 'graduation_year' => 2030, 'status' => 'active', 'campus_id' => $campus->id ?? 1]));
        expectOk(api('DELETE', "/api/v1/admin/batches/{$id}"));
    }
    DB::rollBack();
    return true;
});
test('GET batches export', fn() => expectOk(api('GET', '/api/v1/admin/batches/export')));

// ── Surveys ──
section('Admin Surveys');
test('GET surveys', fn() => expectOk(api('GET', '/api/v1/admin/surveys')));
test('GET surveys export', fn() => expectOk(api('GET', '/api/v1/admin/surveys/export')));

// ── Survey Analytics ──
section('Admin Survey Analytics');
test('GET analytics overview', fn() => expectOk(api('GET', '/api/v1/admin/analytics/overview')));

// ── Users ──
section('Admin Users');
test('GET users', fn() => expectOk(api('GET', '/api/v1/admin/users')));
test('GET users with search', fn() => expectOk(api('GET', '/api/v1/admin/users?search=admin')));
test('GET users export', fn() => expectOk(api('GET', '/api/v1/admin/users/export')));
test('CRUD user', function() {
    DB::beginTransaction();
    $email = 'qa_user_' . time() . '@test.com';
    $r = api('POST', '/api/v1/admin/users', ['name' => 'QA User', 'email' => $email, 'password' => 'Password123!', 'password_confirmation' => 'Password123!', 'role' => 'alumni', 'status' => 'active']);
    expectOk($r);
    $id = $r['body']['data']['id'] ?? $r['body']['user']['id'] ?? null;
    if ($id) {
        expectOk(api('PUT', "/api/v1/admin/users/{$id}", ['name' => 'QA Updated', 'email' => $email, 'role' => 'alumni']));
        expectOk(api('DELETE', "/api/v1/admin/users/{$id}"));
    }
    DB::rollBack();
    return true;
});

// ── Roles & Permissions ──
section('Admin Roles & Permissions');
test('GET roles', fn() => expectOk(api('GET', '/api/v1/admin/roles')));
test('GET permissions', fn() => expectOk(api('GET', '/api/v1/admin/permissions')));
test('GET permission stats', fn() => expectOk(api('GET', '/api/v1/admin/permissions/stats')));

// ── Activity Logs ──
section('Admin Activity Logs');
test('GET activity logs', fn() => expectOk(api('GET', '/api/v1/admin/activity-logs')));
test('GET activity logs filtered', fn() => expectOk(api('GET', '/api/v1/admin/activity-logs?action=login')));
test('GET activity logs export', fn() => expectOk(api('GET', '/api/v1/admin/activity-logs/export')));

// ── Email Templates ──
section('Admin Email Templates');
test('GET email templates', fn() => expectOk(api('GET', '/api/v1/admin/email-templates')));
test('GET email template stats', fn() => expectOk(api('GET', '/api/v1/admin/email-templates/stats')));
test('GET email templates export', fn() => expectOk(api('GET', '/api/v1/admin/email-templates/export')));

// ── Backups ──
section('Admin Backups');
test('GET backups', fn() => expectOk(api('GET', '/api/v1/admin/backups')));
test('GET system info', fn() => expectOk(api('GET', '/api/v1/admin/system/info')));

// ── Jobs (Admin) ──
section('Admin Jobs');
test('GET admin jobs', fn() => expectOk(api('GET', '/api/v1/admin/jobs')));
test('GET job statistics', fn() => expectOk(api('GET', '/api/v1/admin/jobs/statistics')));
test('GET job categories', fn() => expectOk(api('GET', '/api/v1/jobs/categories')));
test('GET admin jobs export', fn() => expectOk(api('GET', '/api/v1/admin/jobs/export')));

// ── Announcements (Admin) ──
section('Admin Announcements');
test('GET admin announcements', fn() => expectOk(api('GET', '/api/v1/announcements/admin/list')));
test('GET admin batch-years', fn() => expectOk(api('GET', '/api/v1/announcements/admin/batch-years')));
test('GET admin announcements export', fn() => expectOk(api('GET', '/api/v1/announcements/admin/export')));

// ── Content Management ──
section('Admin Content Management');
test('GET content list', fn() => expectOk(api('GET', '/api/v1/content/admin/list')));
test('GET content stats', fn() => expectOk(api('GET', '/api/v1/content/admin/statistics')));
test('GET content categories', fn() => expectOk(api('GET', '/api/v1/content/categories')));

// ── Landing Content ──
section('Admin Landing Content');
test('GET landing content', fn() => expectOk(api('GET', '/api/v1/admin/landing-content')));
test('GET landing content stats', fn() => expectOk(api('GET', '/api/v1/admin/landing-content/statistics')));

// ── Messaging ──
section('Admin Messaging');
test('GET archive conversations', fn() => expectOk(api('GET', '/api/v1/messaging/archive/conversations')));

// ── Archive ──
section('Admin Archive');
test('GET archived items', fn() => expectOk(api('GET', '/api/v1/admin/archive')));

// ── Campus Management ──
section('Admin Campuses');
test('GET campuses', fn() => expectOk(api('GET', '/api/v1/campuses')));
test('GET campus comparison', fn() => expectOk(api('GET', '/api/v1/campuses/comparison')));
test('GET campus stats', function() {
    $c = Campus::first();
    return $c ? expectOk(api('GET', "/api/v1/campuses/{$c->id}/statistics")) : 'skip';
});

// ── Sessions ──
section('Admin Sessions');
test('GET sessions', fn() => expectOk(api('GET', '/api/v1/admin/sessions')));

// ── Profile ──
section('Profile');
test('GET profile', fn() => expectOk(api('GET', '/api/v1/profile')));
test('GET profile sessions', fn() => expectOk(api('GET', '/api/v1/profile/sessions')));

// ── Analytics ──
section('Admin Analytics');
test('GET time-to-job', fn() => expectOk(api('GET', '/api/v1/admin/analytics/time-to-job')));
test('GET comprehensive', fn() => expectOk(api('GET', '/api/v1/admin/analytics/comprehensive')));

// ═══════════════════════════════════════════════════════
// SUPER ADMIN ENDPOINTS
// ═══════════════════════════════════════════════════════

section('Super Admin Departments');
test('GET departments', fn() => expectOk(api('GET', '/api/v1/admin/super-admin/departments')));
test('GET department stats', fn() => expectOk(api('GET', '/api/v1/admin/super-admin/departments/statistics')));
test('GET active departments', fn() => expectOk(api('GET', '/api/v1/admin/departments/active')));
test('GET single department', function() {
    $d = Department::first();
    return $d ? expectOk(api('GET', "/api/v1/admin/super-admin/departments/{$d->id}")) : 'skip';
});
test('GET department analytics', function() {
    $d = Department::first();
    return $d ? expectOk(api('GET', "/api/v1/admin/departments/{$d->id}/analytics")) : 'skip';
});
test('GET department alumni', function() {
    $d = Department::first();
    return $d ? expectOk(api('GET', "/api/v1/admin/departments/{$d->id}/alumni")) : 'skip';
});

section('Super Admin Courses');
test('GET courses', fn() => expectOk(api('GET', '/api/v1/admin/super-admin/courses')));
test('GET course stats', fn() => expectOk(api('GET', '/api/v1/admin/super-admin/courses/statistics')));

section('Super Admin Appearance');
test('GET appearance', fn() => expectOk(api('GET', '/api/v1/admin/appearance')));

section('Super Admin System Metrics');
test('GET system-metrics', fn() => expectOk(api('GET', '/api/v1/admin/system-metrics')));

// ═══════════════════════════════════════════════════════
// PUBLIC ENDPOINTS (no auth required)
// ═══════════════════════════════════════════════════════

section('Public Endpoints');
test('GET public announcements', fn() => expectOk(api('GET', '/api/v1/public/announcements?limit=6')));
test('GET public jobs', fn() => expectOk(api('GET', '/api/v1/public/jobs?limit=6')));
test('GET public stats', fn() => expectOk(api('GET', '/api/v1/public/stats')));
test('GET public appearance', fn() => expectOk(api('GET', '/api/v1/public/appearance')));
test('POST check-email', fn() => expectOk(api('POST', '/api/v1/check-email', ['email' => 'nonexistent@test.com'])));
test('POST check-student-id', fn() => expectOk(api('POST', '/api/v1/check-student-id', ['student_id' => '0000-00000'])));

// ═══════════════════════════════════════════════════════
// ALUMNI ENDPOINTS (switch to alumni user)
// ═══════════════════════════════════════════════════════

$alumniUser = User::where('role', 'alumni')->whereHas('alumniProfile')->first();
if ($alumniUser) {
    Auth::guard('web')->login($alumniUser);
    echo "\n--- Switched to alumni: {$alumniUser->email} ---\n";

    section('Alumni Profile');
    test('GET alumni profile', fn() => expectOk(api('GET', '/api/v1/alumni/profile')));

    section('Alumni Surveys');
    test('GET my-surveys', fn() => expectOk(api('GET', '/api/v1/my-surveys')));
    test('GET my-responses', fn() => expectOk(api('GET', '/api/v1/my-responses')));

    section('Alumni Certificates');
    test('GET certificates', fn() => expectOk(api('GET', '/api/v1/certificates')));

    section('Alumni Jobs');
    test('GET public jobs list', fn() => expectOk(api('GET', '/api/v1/jobs')));
    test('GET featured jobs', fn() => expectOk(api('GET', '/api/v1/jobs/featured')));

    section('Alumni Announcements');
    test('GET announcements', fn() => expectOk(api('GET', '/api/v1/announcements')));
    test('GET unread count', fn() => expectOk(api('GET', '/api/v1/announcements/unread-count')));

    section('Alumni Content');
    test('GET content feed', fn() => expectOk(api('GET', '/api/v1/content')));

    section('Alumni Messaging');
    test('GET conversations', fn() => expectOk(api('GET', '/api/v1/messaging/conversations')));

    // Re-login as admin for remaining tests
    Auth::guard('web')->login($admin);
} else {
    echo "\n⚠ No alumni user with profile found — skipping alumni tests\n";
    $skipped += 10;
}

// ═══════════════════════════════════════════════════════
// AUTH ENDPOINTS (no auth context needed)
// ═══════════════════════════════════════════════════════
section('Auth Endpoints');
test('POST check-login with bad creds', function() {
    $r = api('POST', '/api/v1/check-login', ['login' => 'fake@fake.com', 'password' => 'wrong']);
    // Should return 200 with success=false, NOT 500
    return $r['status'] < 500;
});
test('GET force-change-password route exists', function() {
    // Just verify it doesn't 404 when hitting the web route via artisan
    $routes = app('router')->getRoutes();
    $found = false;
    foreach ($routes as $route) {
        if (str_contains($route->uri(), 'force-change-password') && in_array('GET', $route->methods())) {
            $found = true;
            break;
        }
    }
    return $found;
});

// ═══════════════════════════════════════════════════════
// RESULTS
// ═══════════════════════════════════════════════════════

echo "\n\n" . str_repeat('═', 50) . "\n";
echo "  TOTAL: " . ($passed + $failed + $skipped) . " tests\n";
echo "  ✓ Passed:  {$passed}\n";
echo "  ✗ Failed:  {$failed}\n";
echo "  ⚠ Skipped: {$skipped}\n";
echo str_repeat('═', 50) . "\n";

if (!empty($errors)) {
    echo "\n── FAILURES ──\n";
    $bySection = [];
    foreach ($errors as $e) {
        $bySection[$e['section']][] = $e;
    }
    foreach ($bySection as $sec => $errs) {
        echo "\n[{$sec}]\n";
        foreach ($errs as $e) {
            echo "  ✗ {$e['test']}\n    → {$e['error']}\n";
        }
    }
}

echo "\nFinished: " . date('Y-m-d H:i:s') . "\n";
