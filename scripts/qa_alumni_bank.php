<?php
/**
 * Comprehensive QA test for AlumniBank — every API endpoint.
 * Run: php scripts/qa_alumni_bank.php
 */

require __DIR__ . '/../vendor/autoload.php';

$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use App\Models\AlumniProfile;
use App\Models\Batch;
use App\Models\Campus;
use App\Models\Course;
use App\Models\Department;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

// ── Authenticate as admin ──
$admin = User::where('role', 'super_admin')->first();
if (!$admin) {
    $admin = User::where('role', 'admin')->first();
}
if (!$admin) {
    echo "✗ No admin user found\n";
    exit(1);
}
Auth::login($admin);
echo "Logged in as: {$admin->email} (role: {$admin->role})\n\n";

$passed = 0;
$failed = 0;
$errors = [];

function test($name, callable $fn) {
    global $passed, $failed, $errors;
    try {
        $result = $fn();
        if ($result === false) {
            throw new \Exception('Test returned false');
        }
        echo "  ✓ {$name}\n";
        $passed++;
    } catch (\Throwable $e) {
        echo "  ✗ {$name}: {$e->getMessage()}\n";
        $failed++;
        $errors[] = ['test' => $name, 'error' => $e->getMessage(), 'file' => $e->getFile(), 'line' => $e->getLine()];
    }
}

function makeRequest($method, $uri, $params = [], $files = []) {
    $request = Request::create('/api/v1/admin/' . ltrim($uri, '/'), $method, $params, [], $files, [
        'HTTP_ACCEPT' => 'application/json',
        'HTTP_X_REQUESTED_WITH' => 'XMLHttpRequest',
    ]);
    $request->setUserResolver(function() {
        return Auth::user();
    });

    $response = app()->handle($request);
    $status = $response->getStatusCode();
    $body = json_decode($response->getContent(), true);
    return ['status' => $status, 'body' => $body, 'raw' => $response->getContent()];
}

// ═══════════════════════════════════════════════
echo "=== 1. GET /alumni (List with pagination) ===\n";
// ═══════════════════════════════════════════════

test('Basic list returns 200', function() {
    $r = makeRequest('GET', 'alumni');
    return $r['status'] === 200;
});

test('Returns paginated data structure', function() {
    $r = makeRequest('GET', 'alumni');
    $b = $r['body'];
    return isset($b['data']) && isset($b['current_page']) && isset($b['total']) && isset($b['last_page']);
});

test('Per page defaults to 15', function() {
    $r = makeRequest('GET', 'alumni');
    return $r['body']['per_page'] == 15;
});

test('Page 2 works', function() {
    $r = makeRequest('GET', 'alumni?page=2');
    return $r['status'] === 200 && $r['body']['current_page'] == 2;
});

// ═══════════════════════════════════════════════
echo "\n=== 2. Search ===\n";
// ═══════════════════════════════════════════════

test('Search by name', function() {
    $r = makeRequest('GET', 'alumni?search=Juan');
    return $r['status'] === 200;
});

test('Search by email', function() {
    $r = makeRequest('GET', 'alumni?search=@gmail.com');
    return $r['status'] === 200;
});

test('Search with no results', function() {
    $r = makeRequest('GET', 'alumni?search=zzzznonexistent999');
    return $r['status'] === 200 && count($r['body']['data']) === 0;
});

// ═══════════════════════════════════════════════
echo "\n=== 3. Filters ===\n";
// ═══════════════════════════════════════════════

test('Filter by employment_status', function() {
    $r = makeRequest('GET', 'alumni?employment_status=employed');
    return $r['status'] === 200;
});

test('Filter by graduation_year', function() {
    $batch = Batch::first();
    if (!$batch) return true; // skip if no batches
    $r = makeRequest('GET', 'alumni?graduation_year=' . $batch->graduation_year);
    return $r['status'] === 200;
});

test('Filter by job_title', function() {
    $r = makeRequest('GET', 'alumni?job_title=Engineer');
    return $r['status'] === 200;
});

test('Filter by employer', function() {
    $r = makeRequest('GET', 'alumni?employer=Google');
    return $r['status'] === 200;
});

test('Filter by career_field', function() {
    $r = makeRequest('GET', 'alumni?career_field=Technology');
    return $r['status'] === 200;
});

test('Filter by campus_id', function() {
    $campus = Campus::first();
    if (!$campus) return true;
    $r = makeRequest('GET', 'alumni?campus_id=' . $campus->id);
    return $r['status'] === 200;
});

test('Multiple filters combined', function() {
    $r = makeRequest('GET', 'alumni?employment_status=employed&search=a');
    return $r['status'] === 200;
});

// ═══════════════════════════════════════════════
echo "\n=== 4. Sorting ===\n";
// ═══════════════════════════════════════════════

$sorts = ['name_asc', 'name_desc', 'grad_year_desc', 'grad_year_asc', 'recent'];
foreach ($sorts as $sort) {
    test("Sort by {$sort}", function() use ($sort) {
        $r = makeRequest('GET', 'alumni?sort=' . $sort);
        return $r['status'] === 200;
    });
}

// ═══════════════════════════════════════════════
echo "\n=== 5. Get Single Alumni Profile ===\n";
// ═══════════════════════════════════════════════

test('Get existing alumni', function() {
    $profile = AlumniProfile::first();
    if (!$profile) return true;
    $r = makeRequest('GET', 'alumni/' . $profile->id);
    return $r['status'] === 200;
});

test('Get non-existent alumni returns 404', function() {
    $r = makeRequest('GET', 'alumni/999999');
    return $r['status'] === 404;
});

// ═══════════════════════════════════════════════
echo "\n=== 6. Create Alumni ===\n";
// ═══════════════════════════════════════════════

DB::beginTransaction();

test('Create alumni with valid data', function() {
    $r = makeRequest('POST', 'alumni', [
        'first_name' => 'QATest',
        'last_name' => 'User',
        'email' => 'qatest_' . time() . '@test.com',
        'phone' => '09171234567',
        'degree_program' => 'BS Computer Science',
        'graduation_year' => 2024,
        'employment_status' => 'employed',
        'employer' => 'Test Corp',
        'job_title' => 'Developer',
    ]);
    if ($r['status'] !== 200 && $r['status'] !== 201) {
        throw new \Exception("Status: {$r['status']}, Body: " . json_encode($r['body']));
    }
    return true;
});

test('Create alumni missing required fields returns error', function() {
    $r = makeRequest('POST', 'alumni', [
        'first_name' => '',
        'last_name' => '',
        'email' => '',
    ]);
    return $r['status'] === 422 || $r['status'] === 400;
});

test('Create alumni duplicate email returns error', function() {
    $existing = User::whereNotNull('email')->first();
    if (!$existing) return true;
    $r = makeRequest('POST', 'alumni', [
        'first_name' => 'Dup',
        'last_name' => 'Test',
        'email' => $existing->email,
    ]);
    return $r['status'] === 422 || $r['status'] === 409 || $r['status'] === 400 || (isset($r['body']['success']) && !$r['body']['success']);
});

DB::rollBack();

// ═══════════════════════════════════════════════
echo "\n=== 7. Update Alumni ===\n";
// ═══════════════════════════════════════════════

DB::beginTransaction();

test('Update alumni with valid data', function() {
    $profile = AlumniProfile::first();
    if (!$profile) return true;
    $r = makeRequest('PUT', 'alumni/' . $profile->id, [
        'first_name' => 'Updated',
        'last_name' => 'Name',
        'email' => $profile->user->email ?? 'updated@test.com',
    ]);
    if ($r['status'] !== 200) {
        throw new \Exception("Status: {$r['status']}, Body: " . json_encode($r['body']));
    }
    return true;
});

test('Update non-existent alumni returns 404', function() {
    $r = makeRequest('PUT', 'alumni/999999', [
        'first_name' => 'Nope',
    ]);
    return $r['status'] === 404;
});

DB::rollBack();

// ═══════════════════════════════════════════════
echo "\n=== 8. Delete Single Alumni ===\n";
// ═══════════════════════════════════════════════

DB::beginTransaction();

test('Delete existing alumni', function() {
    // Create a temp one to delete
    $user = User::create([
        'name' => 'DeleteMe Test',
        'email' => 'deleteme_' . time() . '@test.com',
        'password' => bcrypt('password'),
        'role' => 'alumni',
        'role_id' => 3,
    ]);
    $profile = AlumniProfile::create([
        'user_id' => $user->id,
        'first_name' => 'DeleteMe',
        'last_name' => 'Test',
        'campus_id' => Campus::first()->id ?? 1,
    ]);
    $r = makeRequest('DELETE', 'alumni/' . $profile->id);
    if ($r['status'] !== 200) {
        throw new \Exception("Status: {$r['status']}, Body: " . json_encode($r['body']));
    }
    return true;
});

test('Delete non-existent alumni returns 404', function() {
    $r = makeRequest('DELETE', 'alumni/999999');
    return $r['status'] === 404;
});

DB::rollBack();

// ═══════════════════════════════════════════════
echo "\n=== 9. Bulk Delete ===\n";
// ═══════════════════════════════════════════════

DB::beginTransaction();

test('Bulk delete with valid IDs', function() {
    $users = [];
    $profileIds = [];
    for ($i = 0; $i < 3; $i++) {
        $user = User::create([
            'name' => "BulkDel {$i}",
            'email' => "bulkdel{$i}_" . time() . '@test.com',
            'password' => bcrypt('password'),
            'role' => 'alumni',
            'role_id' => 3,
        ]);
        $profile = AlumniProfile::create([
            'user_id' => $user->id,
            'first_name' => 'Bulk',
            'last_name' => "Del{$i}",
            'campus_id' => Campus::first()->id ?? 1,
        ]);
        $profileIds[] = $profile->id;
    }

    $r = makeRequest('DELETE', 'alumni/bulk-delete', ['ids' => $profileIds]);
    if ($r['status'] !== 200) {
        throw new \Exception("Status: {$r['status']}, Body: " . json_encode($r['body']));
    }
    if (($r['body']['deleted_count'] ?? 0) != 3) {
        throw new \Exception("Expected 3 deleted, got: " . ($r['body']['deleted_count'] ?? '?'));
    }
    return true;
});

test('Bulk delete with empty IDs returns 422', function() {
    $r = makeRequest('DELETE', 'alumni/bulk-delete', ['ids' => []]);
    return $r['status'] === 422;
});

test('Bulk delete with non-existent IDs returns 422', function() {
    $r = makeRequest('DELETE', 'alumni/bulk-delete', ['ids' => [999998, 999999]]);
    return $r['status'] === 422;
});

DB::rollBack();

// ═══════════════════════════════════════════════
echo "\n=== 10. Export ===\n";
// ═══════════════════════════════════════════════

test('Export CSV', function() {
    $r = makeRequest('GET', 'alumni/export?format=csv');
    if ($r['status'] !== 200) {
        throw new \Exception("Status: {$r['status']}, Body: " . substr($r['raw'] ?? '', 0, 200));
    }
    return true;
});

test('Export Excel', function() {
    $r = makeRequest('GET', 'alumni/export?format=excel');
    if ($r['status'] !== 200) {
        throw new \Exception("Status: {$r['status']}, Body: " . substr($r['raw'] ?? '', 0, 200));
    }
    return true;
});

test('Export PDF', function() {
    $r = makeRequest('GET', 'alumni/export?format=pdf');
    if ($r['status'] !== 200) {
        throw new \Exception("Status: {$r['status']}, Body: " . substr($r['raw'] ?? '', 0, 200));
    }
    return true;
});

test('Export with filters', function() {
    $r = makeRequest('GET', 'alumni/export?format=csv&search=a&employment_status=employed');
    if ($r['status'] !== 200) {
        throw new \Exception("Status: {$r['status']}, Body: " . substr($r['raw'] ?? '', 0, 200));
    }
    return true;
});

// ═══════════════════════════════════════════════
echo "\n=== 11. Import Preview ===\n";
// ═══════════════════════════════════════════════

$templatePath = __DIR__ . '/../test_alumni_import.xlsx';
if (file_exists($templatePath)) {
    test('Import preview with test file', function() use ($templatePath) {
        $file = new \Illuminate\Http\UploadedFile($templatePath, 'test_alumni_import.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', null, true);
        $request = Request::create('/api/v1/admin/alumni/import/preview', 'POST', [], [], ['file' => $file], [
            'HTTP_ACCEPT' => 'application/json',
            'HTTP_X_REQUESTED_WITH' => 'XMLHttpRequest',
        ]);
        $request->setUserResolver(function() { return Auth::user(); });
        $response = app()->handle($request);
        $status = $response->getStatusCode();
        $body = json_decode($response->getContent(), true);
        if ($status !== 200) {
            throw new \Exception("Status: {$status}, Body: " . json_encode($body));
        }
        if (!isset($body['total_rows']) || $body['total_rows'] < 1) {
            throw new \Exception("Expected rows > 0, got: " . json_encode($body));
        }
        return true;
    });

    test('Import preview returns correct structure', function() use ($templatePath) {
        $file = new \Illuminate\Http\UploadedFile($templatePath, 'test.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', null, true);
        $request = Request::create('/api/v1/admin/alumni/import/preview', 'POST', [], [], ['file' => $file], [
            'HTTP_ACCEPT' => 'application/json',
        ]);
        $request->setUserResolver(function() { return Auth::user(); });
        $response = app()->handle($request);
        $body = json_decode($response->getContent(), true);
        $required = ['total_rows', 'preview_rows', 'available_batches', 'available_departments', 'warnings', 'duplicates_found'];
        $missing = [];
        foreach ($required as $key) {
            if (!array_key_exists($key, $body)) $missing[] = $key;
        }
        if (!empty($missing)) {
            throw new \Exception("Missing keys: " . implode(', ', $missing));
        }
        return true;
    });
} else {
    echo "  ⚠ Skipping import preview (test_alumni_import.xlsx not found — run scripts/create_test_excel.php first)\n";
}

// ═══════════════════════════════════════════════
echo "\n=== 12. Import Execute ===\n";
// ═══════════════════════════════════════════════

if (file_exists($templatePath)) {
    DB::beginTransaction();

    test('Import execute with test file', function() use ($templatePath) {
        $file = new \Illuminate\Http\UploadedFile($templatePath, 'test_alumni_import.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', null, true);
        $campus = Campus::first();
        $request = Request::create('/api/v1/admin/alumni/import', 'POST', [
            'campus_id' => $campus->id ?? 1,
            'duplicate_action' => 'skip',
        ], [], ['file' => $file], [
            'HTTP_ACCEPT' => 'application/json',
            'HTTP_X_REQUESTED_WITH' => 'XMLHttpRequest',
        ]);
        $request->setUserResolver(function() { return Auth::user(); });
        $response = app()->handle($request);
        $status = $response->getStatusCode();
        $body = json_decode($response->getContent(), true);
        if ($status !== 200) {
            throw new \Exception("Status: {$status}, Body: " . json_encode($body));
        }
        if (!isset($body['data']['imported'])) {
            throw new \Exception("Missing data.imported in response: " . json_encode($body));
        }
        return true;
    });

    DB::rollBack();
} else {
    echo "  ⚠ Skipping import execute (test file not found)\n";
}

// ═══════════════════════════════════════════════
echo "\n=== 13. Download Template ===\n";
// ═══════════════════════════════════════════════

test('Download template', function() {
    $r = makeRequest('GET', 'alumni/import/template');
    if ($r['status'] !== 200) {
        throw new \Exception("Status: {$r['status']}");
    }
    return true;
});

// ═══════════════════════════════════════════════
echo "\n=== 14. Get Batches (for filter dropdown) ===\n";
// ═══════════════════════════════════════════════

test('Get batches', function() {
    $r = makeRequest('GET', 'batches?per_page=100');
    if ($r['status'] !== 200) {
        throw new \Exception("Status: {$r['status']}, Body: " . json_encode($r['body']));
    }
    return true;
});

// ═══════════════════════════════════════════════
echo "\n\n══════════════════════════════\n";
echo "  RESULTS: {$passed} passed, {$failed} failed\n";
echo "══════════════════════════════\n";

if (!empty($errors)) {
    echo "\nFailed tests:\n";
    foreach ($errors as $e) {
        echo "  ✗ {$e['test']}\n";
        echo "    Error: {$e['error']}\n";
        echo "    At: {$e['file']}:{$e['line']}\n\n";
    }
}
