<?php
/**
 * Alumni Tracer System — Comprehensive Benchmark
 * ================================================
 * Tests: API response times, DB query performance, page loads,
 *        concurrent request simulation, memory/resource usage.
 *
 * Run:  php benchmark.php
 */

// ── Bootstrap Laravel ──────────────────────────────────────────────
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

// Boot the application
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

// ── Config ─────────────────────────────────────────────────────────
$BASE_URL       = env('APP_URL', 'http://localhost');
$ITERATIONS     = 5;          // repeat each test N times
$CONCURRENT     = 10;         // simulated concurrent users
$WARMUP         = true;       // warm-up run before timing

// Color helpers for CLI
function c(string $text, string $color): string {
    $codes = ['green' => '32', 'red' => '31', 'yellow' => '33', 'cyan' => '36', 'bold' => '1', 'dim' => '2'];
    return "\033[" . ($codes[$color] ?? '0') . "m{$text}\033[0m";
}

function rating(float $ms): string {
    if ($ms < 100)  return c('EXCELLENT', 'green');
    if ($ms < 300)  return c('GOOD', 'green');
    if ($ms < 600)  return c('FAIR', 'yellow');
    if ($ms < 1000) return c('SLOW', 'yellow');
    return c('CRITICAL', 'red');
}

function formatMs(float $ms): string {
    return str_pad(number_format($ms, 1) . ' ms', 12, ' ', STR_PAD_LEFT);
}

function separator(string $title = ''): void {
    echo "\n" . c(str_repeat('═', 70), 'dim') . "\n";
    if ($title) echo c("  ▶ {$title}", 'bold') . "\n" . c(str_repeat('─', 70), 'dim') . "\n";
}

$results = [];

// ════════════════════════════════════════════════════════════════════
//  1. DATABASE QUERY BENCHMARKS
// ════════════════════════════════════════════════════════════════════
separator('1. DATABASE QUERY PERFORMANCE');

$dbQueries = [
    'COUNT users'             => "SELECT COUNT(*) as cnt FROM users",
    'COUNT alumni_profiles'   => "SELECT COUNT(*) as cnt FROM alumni_profiles",
    'COUNT career_history'    => "SELECT COUNT(*) as cnt FROM career_history",
    'COUNT surveys'           => "SELECT COUNT(*) as cnt FROM surveys",
    'COUNT job_postings'      => "SELECT COUNT(*) as cnt FROM job_postings",
    'COUNT survey_responses'  => "SELECT COUNT(*) as cnt FROM survey_responses",
    'Employment rate calc'    => "SELECT
                                    COUNT(CASE WHEN employment_status IN ('employed_full_time','employed_part_time','self_employed') THEN 1 END) as employed,
                                    COUNT(*) as total
                                  FROM alumni_profiles WHERE employment_status IS NOT NULL AND employment_status != ''",
    'Distinct industries'     => "SELECT COUNT(DISTINCT industry) as cnt FROM career_history WHERE industry IS NOT NULL AND industry != ''",
    'Dashboard aggregate'     => "SELECT
                                    (SELECT COUNT(*) FROM users WHERE role_id = 3) as alumni,
                                    (SELECT COUNT(*) FROM surveys) as surveys,
                                    (SELECT COUNT(*) FROM survey_responses) as responses,
                                    (SELECT COUNT(*) FROM job_postings) as jobs,
                                    (SELECT COUNT(*) FROM announcements) as announcements",
    'Alumni w/ profile JOIN'  => "SELECT u.id, u.email, ap.employment_status
                                  FROM users u
                                  LEFT JOIN alumni_profiles ap ON u.id = ap.user_id
                                  WHERE u.role_id = 3 LIMIT 100",
    'Career history w/ user'  => "SELECT ch.*, u.email
                                  FROM career_history ch
                                  JOIN users u ON ch.user_id = u.id
                                  ORDER BY ch.created_at DESC LIMIT 50",
    'Monthly registrations'   => "SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as cnt
                                  FROM users WHERE role_id = 3
                                  GROUP BY month ORDER BY month DESC LIMIT 12",
    'Batch distribution'      => "SELECT s.id, s.title, COUNT(sr.id) as response_count
                                  FROM surveys s
                                  LEFT JOIN survey_responses sr ON sr.survey_id = s.id
                                  GROUP BY s.id, s.title
                                  ORDER BY response_count DESC LIMIT 20",
    'Full-text user search'   => "SELECT * FROM users WHERE email LIKE '%alumni%' OR email LIKE '%test%' LIMIT 20",
];

$dbResults = [];
foreach ($dbQueries as $name => $sql) {
    $times = [];
    for ($i = 0; $i < $ITERATIONS; $i++) {
        $start = microtime(true);
        try {
            DB::select($sql);
        } catch (\Throwable $e) {
            $times[] = -1;
            continue;
        }
        $times[] = (microtime(true) - $start) * 1000;
    }

    $valid = array_filter($times, fn($t) => $t >= 0);
    if (empty($valid)) {
        echo sprintf("  %-28s  %s\n", $name, c('ERROR - table missing?', 'red'));
        continue;
    }

    $avg = array_sum($valid) / count($valid);
    $min = min($valid);
    $max = max($valid);
    $dbResults[$name] = ['avg' => $avg, 'min' => $min, 'max' => $max];

    echo sprintf(
        "  %-28s  avg:%s  min:%s  max:%s  %s\n",
        $name, formatMs($avg), formatMs($min), formatMs($max), rating($avg)
    );
}
$results['db'] = $dbResults;

// ════════════════════════════════════════════════════════════════════
//  2.  ELOQUENT ORM BENCHMARKS (N+1 detection, relationship loading)
// ════════════════════════════════════════════════════════════════════
separator('2. ELOQUENT ORM PERFORMANCE');

$eloquentTests = [];

// Test: Load alumni with profiles (eager vs lazy)
$testName = 'Alumni + Profile (eager)';
$times = [];
for ($i = 0; $i < $ITERATIONS; $i++) {
    $start = microtime(true);
    try {
        \App\Models\User::where('role_id', 3)->with('alumniProfile')->limit(100)->get();
    } catch(\Throwable $e) { $times[] = -1; continue; }
    $times[] = (microtime(true) - $start) * 1000;
}
$valid = array_filter($times, fn($t) => $t >= 0);
if (!empty($valid)) {
    $avg = array_sum($valid) / count($valid);
    $eloquentTests[$testName] = ['avg' => $avg, 'min' => min($valid), 'max' => max($valid)];
    echo sprintf("  %-35s  avg:%s  %s\n", $testName, formatMs($avg), rating($avg));
}

// Test: Load alumni WITHOUT eager loading (N+1 potential)
$testName = 'Alumni + Profile (lazy — N+1)';
$times = [];
for ($i = 0; $i < $ITERATIONS; $i++) {
    $start = microtime(true);
    try {
        $users = \App\Models\User::where('role_id', 3)->limit(100)->get();
        foreach ($users as $u) { $_ = $u->alumniProfile?->employment_status; }
    } catch(\Throwable $e) { $times[] = -1; continue; }
    $times[] = (microtime(true) - $start) * 1000;
}
$valid = array_filter($times, fn($t) => $t >= 0);
if (!empty($valid)) {
    $avg = array_sum($valid) / count($valid);
    $eloquentTests[$testName] = ['avg' => $avg, 'min' => min($valid), 'max' => max($valid)];
    echo sprintf("  %-35s  avg:%s  %s\n", $testName, formatMs($avg), rating($avg));
}

// Test: Survey with responses count
$testName = 'Surveys + responsesCount';
$times = [];
for ($i = 0; $i < $ITERATIONS; $i++) {
    $start = microtime(true);
    try {
        \App\Models\Survey::withCount('responses')->get();
    } catch(\Throwable $e) { $times[] = -1; continue; }
    $times[] = (microtime(true) - $start) * 1000;
}
$valid = array_filter($times, fn($t) => $t >= 0);
if (!empty($valid)) {
    $avg = array_sum($valid) / count($valid);
    $eloquentTests[$testName] = ['avg' => $avg, 'min' => min($valid), 'max' => max($valid)];
    echo sprintf("  %-35s  avg:%s  %s\n", $testName, formatMs($avg), rating($avg));
}

// Test: Dashboard-equivalent aggregate
$testName = 'Dashboard full aggregate query';
$times = [];
for ($i = 0; $i < $ITERATIONS; $i++) {
    $start = microtime(true);
    try {
        $totalAlumni = \App\Models\User::where('role_id', 3)->count();
        $totalSurveys = \App\Models\Survey::count();
        $totalResponses = DB::table('survey_responses')->count();
        $employed = \App\Models\AlumniProfile::whereIn('employment_status', ['employed_full_time', 'employed_part_time', 'self_employed'])->count();
        $totalProfiles = \App\Models\AlumniProfile::whereNotNull('employment_status')->where('employment_status', '!=', '')->count();
        $industries = DB::table('career_histories')->whereNotNull('industry')->where('industry', '!=', '')->distinct()->count('industry');
        $recentRegistrations = \App\Models\User::where('role_id', 3)->where('created_at', '>=', now()->subDays(30))->count();
    } catch(\Throwable $e) { $times[] = -1; continue; }
    $times[] = (microtime(true) - $start) * 1000;
}
$valid = array_filter($times, fn($t) => $t >= 0);
if (!empty($valid)) {
    $avg = array_sum($valid) / count($valid);
    $eloquentTests[$testName] = ['avg' => $avg, 'min' => min($valid), 'max' => max($valid)];
    echo sprintf("  %-35s  avg:%s  %s\n", $testName, formatMs($avg), rating($avg));
}

$results['eloquent'] = $eloquentTests;

// ════════════════════════════════════════════════════════════════════
//  3.  HTTP ENDPOINT BENCHMARKS (response time via cURL)
// ════════════════════════════════════════════════════════════════════
separator('3. HTTP ENDPOINT RESPONSE TIMES');

// Warmup: hit the homepage once to prime OPcache / framework bootup
$wch = curl_init($BASE_URL . '/');
curl_setopt_array($wch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 15,
    CURLOPT_SSL_VERIFYPEER => false, CURLOPT_SSL_VERIFYHOST => 0]);
curl_exec($wch); curl_close($wch);

$publicEndpoints = [
    'GET  /'                         => ['GET', '/'],
    'GET  /login'                    => ['GET', '/login'],
    'GET  /api/v1/public/appearance' => ['GET', '/api/v1/public/appearance'],
];

// Authenticated endpoints need a session — we'll test public ones via cURL
// and note authenticated ones as "requires auth"
$authEndpoints = [
    'GET  /admin/dashboard (page)'   => ['GET', '/admin/dashboard'],
    'GET  /api/v1/admin/dashboard'   => ['GET', '/api/v1/admin/dashboard'],
    'GET  /api/v1/admin/jobs'        => ['GET', '/api/v1/admin/jobs?per_page=5'],
    'GET  /api/v1/admin/alumni'      => ['GET', '/api/v1/admin/alumni?per_page=20'],
];

function curlBench(string $method, string $url, int $iterations, string $cookie = ''): array {
    $times = [];
    $statusCodes = [];
    $sizes = [];

    for ($i = 0; $i < $iterations; $i++) {
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL            => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_TIMEOUT        => 30,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => 0,
            CURLOPT_HTTPHEADER     => [
                'Accept: text/html,application/json',
                'X-Requested-With: XMLHttpRequest',
            ],
        ]);

        if ($cookie) {
            curl_setopt($ch, CURLOPT_COOKIE, $cookie);
        }

        if ($method === 'POST') {
            curl_setopt($ch, CURLOPT_POST, true);
        }

        $start = microtime(true);
        $body = curl_exec($ch);
        $elapsed = (microtime(true) - $start) * 1000;

        $statusCodes[] = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $sizes[] = strlen($body ?: '');
        $times[] = $elapsed;

        curl_close($ch);
    }

    return [
        'times'   => $times,
        'avg'     => array_sum($times) / count($times),
        'min'     => min($times),
        'max'     => max($times),
        'status'  => $statusCodes[0] ?? 0,
        'avgSize' => (int)(array_sum($sizes) / count($sizes)),
    ];
}

echo "  " . c("Public endpoints (no auth):", 'cyan') . "\n";
$httpResults = [];
foreach ($publicEndpoints as $name => $ep) {
    $url = $BASE_URL . $ep[1];
    $r = curlBench($ep[0], $url, $ITERATIONS);
    $httpResults[$name] = $r;
    $sizeStr = $r['avgSize'] > 1024 ? number_format($r['avgSize'] / 1024, 1) . ' KB' : $r['avgSize'] . ' B';
    echo sprintf(
        "  %-38s  HTTP %d  avg:%s  size: %s  %s\n",
        $name, $r['status'], formatMs($r['avg']), str_pad($sizeStr, 10), rating($r['avg'])
    );
}

echo "\n  " . c("Auth-protected endpoints (will return 302/401/403):", 'cyan') . "\n";
foreach ($authEndpoints as $name => $ep) {
    $url = $BASE_URL . $ep[1];
    $r = curlBench($ep[0], $url, $ITERATIONS);
    $httpResults[$name] = $r;
    $sizeStr = $r['avgSize'] > 1024 ? number_format($r['avgSize'] / 1024, 1) . ' KB' : $r['avgSize'] . ' B';
    echo sprintf(
        "  %-38s  HTTP %d  avg:%s  size: %s  %s\n",
        $name, $r['status'], formatMs($r['avg']), str_pad($sizeStr, 10), rating($r['avg'])
    );
}

$results['http'] = $httpResults;

// ════════════════════════════════════════════════════════════════════
//  4.  CONCURRENT LOAD TEST (curl_multi)
// ════════════════════════════════════════════════════════════════════
separator('4. CONCURRENT LOAD TEST (' . $CONCURRENT . ' simultaneous requests)');

$loadTestUrls = [
    'Landing page'     => $BASE_URL . '/',
    'Login page'       => $BASE_URL . '/login',
    'Public API'       => $BASE_URL . '/api/v1/public/appearance',
];

foreach ($loadTestUrls as $label => $url) {
    $mh = curl_multi_init();
    $handles = [];

    for ($i = 0; $i < $CONCURRENT; $i++) {
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL            => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 30,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => 0,
        ]);
        curl_multi_add_handle($mh, $ch);
        $handles[] = $ch;
    }

    $startAll = microtime(true);
    $running = null;
    do {
        curl_multi_exec($mh, $running);
        curl_multi_select($mh);
    } while ($running > 0);
    $totalTime = (microtime(true) - $startAll) * 1000;

    $responseTimes = [];
    $statuses = [];
    foreach ($handles as $ch) {
        $responseTimes[] = curl_getinfo($ch, CURLINFO_TOTAL_TIME) * 1000;
        $statuses[] = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_multi_remove_handle($mh, $ch);
        curl_close($ch);
    }
    curl_multi_close($mh);

    $avgResp = array_sum($responseTimes) / count($responseTimes);
    $p95idx  = (int)ceil(0.95 * count($responseTimes)) - 1;
    sort($responseTimes);
    $p95 = $responseTimes[$p95idx] ?? end($responseTimes);
    $successCount = count(array_filter($statuses, fn($s) => $s >= 200 && $s < 400));
    $rps = ($CONCURRENT / $totalTime) * 1000;

    echo sprintf(
        "  %-20s  total:%s  avg:%s  p95:%s  rps: %.1f  success: %d/%d  %s\n",
        $label,
        formatMs($totalTime),
        formatMs($avgResp),
        formatMs($p95),
        $rps,
        $successCount,
        $CONCURRENT,
        rating($avgResp)
    );
}

// ════════════════════════════════════════════════════════════════════
//  5.  DATABASE TABLE STATS & INDEX CHECK
// ════════════════════════════════════════════════════════════════════
separator('5. DATABASE TABLE STATISTICS');

$tables = ['users', 'alumni_profiles', 'career_histories', 'surveys', 'survey_responses',
           'job_postings', 'announcements', 'batches', 'departments', 'courses',
           'campuses', 'sessions', 'activity_logs'];

echo sprintf("  %-25s  %10s  %12s  %8s\n", 'Table', 'Rows', 'Data Size', 'Indexes');
echo "  " . str_repeat('─', 60) . "\n";

$totalRows = 0;
$totalSize = 0;
foreach ($tables as $table) {
    try {
        $info = DB::select("SELECT
            TABLE_ROWS as row_count,
            ROUND(DATA_LENGTH / 1024, 1) as data_kb,
            ROUND(INDEX_LENGTH / 1024, 1) as index_kb
            FROM information_schema.TABLES
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?",
            [env('DB_DATABASE'), $table]
        );

        if (!empty($info)) {
            $row = $info[0];
            $totalRows += $row->row_count ?? 0;
            $totalSize += ($row->data_kb ?? 0) + ($row->index_kb ?? 0);

            // Count indexes
            $indexes = DB::select("SHOW INDEX FROM `{$table}`");
            $indexCount = count(array_unique(array_column($indexes, 'Key_name')));

            echo sprintf(
                "  %-25s  %10s  %10s KB  %8d\n",
                $table,
                number_format($row->row_count ?? 0),
                number_format($row->data_kb ?? 0, 1),
                $indexCount
            );
        }
    } catch (\Throwable $e) {
        echo sprintf("  %-25s  %s\n", $table, c('TABLE NOT FOUND', 'red'));
    }
}
echo "  " . str_repeat('─', 60) . "\n";
echo sprintf("  %-25s  %10s  %10s KB\n", c('TOTALS', 'bold'), number_format($totalRows), number_format($totalSize, 1));

// ════════════════════════════════════════════════════════════════════
//  6.  MISSING INDEX DETECTION
// ════════════════════════════════════════════════════════════════════
separator('6. INDEX ANALYSIS — POTENTIAL MISSING INDEXES');

$indexChecks = [
    ['alumni_profiles', 'user_id',           'FK lookups for profile by user'],
    ['alumni_profiles', 'employment_status',  'Employment rate filtering'],
    ['career_history',    'user_id',           'Careers by user'],
    ['career_history',    'industry',          'Industry aggregation'],
    ['survey_responses', 'user_id',           'Responses by user'],
    ['survey_responses', 'survey_id',         'Responses per survey'],
    ['survey_responses', 'status',            'Response status filtering'],
    ['job_postings',     'status',            'Job filtering by status'],
    ['job_postings',     'campus_id',         'Jobs by campus'],
    ['users',            'role_id',           'User role filtering'],
    ['users',            'email',             'Login lookups'],
    ['announcements',    'is_published',      'Published announcements filter'],
    ['sessions',         'user_id',           'Session lookups'],
    ['activity_logs',    'user_id',           'Logs by user'],
];

$missingIndexes = 0;
foreach ($indexChecks as [$table, $column, $reason]) {
    try {
        $indexes = DB::select("SHOW INDEX FROM `{$table}` WHERE Column_name = ?", [$column]);
        $hasIndex = !empty($indexes);
        $status = $hasIndex ? c('✓ INDEXED', 'green') : c('✗ NO INDEX', 'red');
        if (!$hasIndex) {
            $missingIndexes++;
            echo sprintf("  %-20s.%-20s  %s  (%s)\n", $table, $column, $status, $reason);
            echo sprintf("    → %s\n", c("ALTER TABLE `{$table}` ADD INDEX `idx_{$table}_{$column}` (`{$column}`);", 'yellow'));
        }
    } catch (\Throwable $e) {
        // Table doesn't exist, skip
    }
}

if ($missingIndexes === 0) {
    echo "  " . c("All checked columns are properly indexed!", 'green') . "\n";
} else {
    echo "\n  " . c("Found {$missingIndexes} missing index(es). Adding them can significantly improve query speed.", 'yellow') . "\n";
}

// ════════════════════════════════════════════════════════════════════
//  7.  MEMORY & RESOURCE USAGE
// ════════════════════════════════════════════════════════════════════
separator('7. PHP RESOURCE USAGE');

echo sprintf("  PHP Version:           %s\n", phpversion());
echo sprintf("  Memory Limit:          %s\n", ini_get('memory_limit'));
echo sprintf("  Peak Memory (bench):   %s KB\n", number_format(memory_get_peak_usage(true) / 1024, 1));
echo sprintf("  Current Memory:        %s KB\n", number_format(memory_get_usage(true) / 1024, 1));
echo sprintf("  Max Execution Time:    %s s\n", ini_get('max_execution_time'));
echo sprintf("  OPcache Enabled:       %s\n", function_exists('opcache_get_status') && opcache_get_status() ? c('Yes', 'green') : c('No', 'yellow'));
echo sprintf("  MySQL Version:         %s\n", DB::select("SELECT VERSION() as v")[0]->v ?? 'Unknown');

// Check for slow query log
try {
    $slowLog = DB::select("SHOW VARIABLES LIKE 'slow_query_log'");
    $longQuery = DB::select("SHOW VARIABLES LIKE 'long_query_time'");
    echo sprintf("  Slow Query Log:        %s\n", ($slowLog[0]->Value ?? 'OFF'));
    echo sprintf("  Long Query Threshold:  %s s\n", ($longQuery[0]->Value ?? '10'));
} catch (\Throwable $e) {}

// ════════════════════════════════════════════════════════════════════
//  8.  FRONTEND BUNDLE ANALYSIS
// ════════════════════════════════════════════════════════════════════
separator('8. FRONTEND BUNDLE ANALYSIS');

$buildDir = __DIR__ . '/public/build/assets';
$jsFiles = glob($buildDir . '/*.js');
$cssFiles = glob($buildDir . '/*.css');

$totalJS = 0;
$totalCSS = 0;
$largeChunks = [];

foreach ($jsFiles as $f) {
    $size = filesize($f);
    $totalJS += $size;
    if ($size > 50 * 1024) {
        $largeChunks[] = [basename($f), $size];
    }
}
foreach ($cssFiles as $f) {
    $totalCSS += filesize($f);
}

echo sprintf("  Total JS bundles:      %d files (%s KB / %s MB)\n", count($jsFiles), number_format($totalJS / 1024, 1), number_format($totalJS / 1048576, 1));
echo sprintf("  Total CSS bundles:     %d files (%s KB)\n", count($cssFiles), number_format($totalCSS / 1024, 1));
echo sprintf("  Total assets:          %s MB\n", number_format(($totalJS + $totalCSS) / 1048576, 1));

if (!empty($largeChunks)) {
    echo "\n  " . c("Large chunks (>50 KB — consider code splitting):", 'yellow') . "\n";
    usort($largeChunks, fn($a, $b) => $b[1] - $a[1]);
    foreach ($largeChunks as [$name, $size]) {
        $sizeKb = number_format($size / 1024, 1);
        $flag = $size > 200 * 1024 ? c('⚠ LARGE', 'red') : c('⚡ WARN', 'yellow');
        echo sprintf("    %-45s  %8s KB  %s\n", $name, $sizeKb, $flag);
    }
} else {
    echo "  " . c("All chunks under 50 KB — good code splitting!", 'green') . "\n";
}

// ════════════════════════════════════════════════════════════════════
//  9.  OVERALL SCORE
// ════════════════════════════════════════════════════════════════════
separator('9. BENCHMARK SUMMARY & SCORE');

// Calculate scores (logarithmic scale — 1ms=100, 10ms=90, 100ms=75, 500ms=50, 2000ms=25)
function scoreMs(float $ms): float {
    if ($ms <= 0) return 100;
    // log₁₀ scale: 0ms→100, 1ms→100, 10ms→90, 100ms→75, 1000ms→50, 10000ms→25
    return max(0, min(100, 100 - 25 * log10(max($ms, 1))));
}

$dbAvgs = array_column($dbResults, 'avg');
$dbScore = empty($dbAvgs) ? 0 : array_sum(array_map('scoreMs', $dbAvgs)) / count($dbAvgs);

// Exclude intentional N+1 test from ORM scoring
$ormScoreTests = array_filter($eloquentTests, fn($v, $k) => !str_contains($k, 'N+1'), ARRAY_FILTER_USE_BOTH);
$ormAvgs = array_column($ormScoreTests, 'avg');
$ormScore = empty($ormAvgs) ? 0 : array_sum(array_map('scoreMs', $ormAvgs)) / count($ormAvgs);

$httpAvgs = array_column($httpResults, 'avg');
$httpScore = empty($httpAvgs) ? 0 : array_sum(array_map('scoreMs', $httpAvgs)) / count($httpAvgs);

$bundleScore = max(0, 100 - ($totalJS / 1048576) * 15);  // penalize per MB
$indexScore  = max(0, 100 - ($missingIndexes * 10));

$overallScore = ($dbScore * 0.25) + ($ormScore * 0.25) + ($httpScore * 0.20) + ($bundleScore * 0.15) + ($indexScore * 0.15);

echo sprintf("  DB Query Speed:         %5.1f / 100\n", $dbScore);
echo sprintf("  Eloquent ORM Speed:     %5.1f / 100\n", $ormScore);
echo sprintf("  HTTP Response Speed:    %5.1f / 100\n", $httpScore);
echo sprintf("  Bundle Optimization:    %5.1f / 100\n", $bundleScore);
echo sprintf("  Index Coverage:         %5.1f / 100\n", $indexScore);
echo "\n";

$color = $overallScore >= 80 ? 'green' : ($overallScore >= 60 ? 'yellow' : 'red');
$grade = $overallScore >= 90 ? 'A' : ($overallScore >= 80 ? 'B' : ($overallScore >= 70 ? 'C' : ($overallScore >= 60 ? 'D' : 'F')));
echo sprintf("  " . c("OVERALL SCORE: %.1f / 100  (Grade: %s)", $color) . "\n", $overallScore, $grade);

echo "\n" . c(str_repeat('═', 70), 'dim') . "\n";
echo c("  Benchmark complete. " . date('Y-m-d H:i:s'), 'dim') . "\n\n";
