<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class SystemMetricsController extends Controller
{
    /**
     * Get current system resource metrics (cached 10s to protect against rapid polling).
     */
    public function getMetrics()
    {
        try {
            $requestStart = microtime(true);

            $metrics = Cache::remember('system_metrics_snapshot', 10, function () {
                return [
                    'server'      => $this->getServerMetrics(),
                    'database'    => $this->getDatabaseMetrics(),
                    'application' => $this->getApplicationMetrics(),
                    'storage'     => $this->getStorageMetrics(),
                    'performance' => $this->getPerformanceBenchmarks(),
                ];
            });

            // Always compute fresh timing for the current request
            $metrics['request_time_ms'] = round((microtime(true) - $requestStart) * 1000, 2);
            $metrics['timestamp'] = now()->toDateTimeString();

            return response()->json([
                'success' => true,
                'data'    => $metrics,
            ]);
        } catch (\Exception $e) {
            Log::error('SystemMetrics error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch system metrics',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Run an on-demand performance benchmark (not cached — intentionally).
     */
    public function runBenchmark()
    {
        try {
            $results = [];

            // 1. DB read benchmark — simple SELECT
            $start = microtime(true);
            DB::table('users')->select('id')->limit(1)->first();
            $results['db_read_ms'] = round((microtime(true) - $start) * 1000, 2);

            // 2. DB write/delete benchmark — insert + delete a temp row
            $benchmarkKey = '_benchmark_' . uniqid();
            $start = microtime(true);
            DB::table('cache')->insert([
                'key'        => $benchmarkKey,
                'value'      => 'test',
                'expiration' => 0,
            ]);
            DB::table('cache')->where('key', $benchmarkKey)->delete();
            $results['db_write_ms'] = round((microtime(true) - $start) * 1000, 2);

            // 3. Cache read/write benchmark
            $start = microtime(true);
            Cache::put('_benchmark_key', 'test', 10);
            Cache::get('_benchmark_key');
            Cache::forget('_benchmark_key');
            $results['cache_rw_ms'] = round((microtime(true) - $start) * 1000, 2);

            // 4. Filesystem benchmark
            $tmpFile = storage_path('framework/benchmark_' . uniqid() . '.tmp');
            $start = microtime(true);
            file_put_contents($tmpFile, str_repeat('A', 1024 * 100)); // 100KB
            file_get_contents($tmpFile);
            @unlink($tmpFile);
            $results['filesystem_ms'] = round((microtime(true) - $start) * 1000, 2);

            // 5. PHP computation benchmark (1M iterations)
            $start = microtime(true);
            $sum = 0;
            for ($i = 0; $i < 1_000_000; $i++) {
                $sum += $i;
            }
            $results['php_compute_ms'] = round((microtime(true) - $start) * 1000, 2);

            // 6. JSON encode/decode benchmark
            $data = array_fill(0, 1000, ['id' => 1, 'name' => 'test', 'email' => 'test@test.com']);
            $start = microtime(true);
            $json = json_encode($data);
            json_decode($json, true);
            $results['json_codec_ms'] = round((microtime(true) - $start) * 1000, 2);

            // 7. Aggregate query benchmark
            $start = microtime(true);
            DB::table('users')
                ->selectRaw('role, COUNT(*) as cnt')
                ->groupBy('role')
                ->get();
            $results['db_aggregate_ms'] = round((microtime(true) - $start) * 1000, 2);

            $results['total_ms'] = round(array_sum($results), 2);
            $results['timestamp'] = now()->toDateTimeString();

            // Determine performance grade
            $total = $results['total_ms'];
            $results['grade'] = match (true) {
                $total < 50  => 'A+',
                $total < 100 => 'A',
                $total < 200 => 'B',
                $total < 500 => 'C',
                default      => 'D',
            };

            return response()->json(['success' => true, 'data' => $results]);
        } catch (\Exception $e) {
            Log::error('Benchmark error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Benchmark failed',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    // ─── Data collectors ────────────────────────────────────────────

    private function getServerMetrics(): array
    {
        $memoryUsage = memory_get_usage(true);
        $memoryPeak  = memory_get_peak_usage(true);
        $memoryLimit = $this->parseSize(ini_get('memory_limit'));

        // CPU — works on both Windows and Linux
        $cpuPercent = $this->getCpuUsage();

        return [
            'memory' => [
                'current'          => $memoryUsage,
                'current_formatted'=> $this->formatBytes($memoryUsage),
                'peak'             => $memoryPeak,
                'peak_formatted'   => $this->formatBytes($memoryPeak),
                'limit'            => $memoryLimit,
                'limit_formatted'  => $this->formatBytes($memoryLimit),
                'usage_percentage' => $memoryLimit > 0 ? round(($memoryUsage / $memoryLimit) * 100, 2) : 0,
            ],
            'cpu' => [
                'usage_percent' => $cpuPercent,
                'cores'         => $this->getCpuCores(),
                'load_1min'     => function_exists('sys_getloadavg') ? round(sys_getloadavg()[0], 2) : $cpuPercent,
                'load_5min'     => function_exists('sys_getloadavg') ? round(sys_getloadavg()[1], 2) : 0,
                'load_15min'    => function_exists('sys_getloadavg') ? round(sys_getloadavg()[2], 2) : 0,
            ],
            'php' => [
                'version'            => PHP_VERSION,
                'os'                 => PHP_OS,
                'sapi'               => php_sapi_name(),
                'max_execution_time' => ini_get('max_execution_time'),
                'upload_max_filesize'=> ini_get('upload_max_filesize'),
                'post_max_size'      => ini_get('post_max_size'),
                'memory_limit'       => ini_get('memory_limit'),
                'opcache_enabled'    => function_exists('opcache_get_status') && @opcache_get_status() !== false,
            ],
            'uptime' => $this->getServerUptime(),
        ];
    }

    private function getDatabaseMetrics(): array
    {
        $metrics = [];

        try {
            $dbName = DB::connection()->getDatabaseName();

            // Single query: top 15 tables + total
            $tables = DB::select("
                SELECT table_name AS name,
                       ROUND((data_length + index_length) / 1024 / 1024, 2) AS size_mb,
                       table_rows AS `rows`,
                       ROUND(index_length / 1024 / 1024, 2) AS index_size_mb
                FROM information_schema.TABLES
                WHERE table_schema = ?
                ORDER BY (data_length + index_length) DESC
                LIMIT 15
            ", [$dbName]);

            $totalSize = DB::selectOne("
                SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS total_size_mb,
                       COUNT(*) AS table_count
                FROM information_schema.TABLES
                WHERE table_schema = ?
            ", [$dbName]);

            // Connection pool + query stats (single batch)
            $maxConn     = DB::selectOne("SHOW VARIABLES LIKE 'max_connections'")->Value ?? 'N/A';
            $curConn     = DB::selectOne("SHOW STATUS LIKE 'Threads_connected'")->Value ?? 0;
            $slowQueries = DB::selectOne("SHOW STATUS LIKE 'Slow_queries'")->Value ?? 0;
            $questions   = DB::selectOne("SHOW STATUS LIKE 'Questions'")->Value ?? 0;
            $uptimeRaw   = DB::selectOne("SHOW STATUS LIKE 'Uptime'")->Value ?? 1;

            $metrics['database_name'] = $dbName;
            $metrics['total_size_mb'] = $totalSize->total_size_mb ?? 0;
            $metrics['table_count']   = $totalSize->table_count ?? 0;
            $metrics['top_tables']    = $tables;
            $metrics['connections']   = [
                'max'     => (int) $maxConn,
                'current' => (int) $curConn,
                'usage_percent' => $maxConn > 0 ? round(($curConn / $maxConn) * 100, 1) : 0,
            ];
            $metrics['query_stats'] = [
                'slow_queries'    => (int) $slowQueries,
                'total_questions' => (int) $questions,
                'queries_per_sec' => $uptimeRaw > 0 ? round($questions / $uptimeRaw, 1) : 0,
                'uptime_hours'    => round($uptimeRaw / 3600, 1),
            ];
        } catch (\Exception $e) {
            $metrics['error'] = $e->getMessage();
        }

        return $metrics;
    }

    private function getApplicationMetrics(): array
    {
        $metrics = [];

        try {
            $metrics['cache'] = [
                'driver'    => config('cache.default'),
                'session'   => config('session.driver'),
                'queue'     => config('queue.default'),
            ];

            // Record counts — single query with UNION for efficiency
            $counts = DB::select("
                SELECT 'users' AS tbl, COUNT(*) AS cnt FROM users
                UNION ALL SELECT 'alumni_profiles', COUNT(*) FROM alumni_profiles
                UNION ALL SELECT 'surveys', COUNT(*) FROM surveys
                UNION ALL SELECT 'survey_responses', COUNT(*) FROM survey_responses
                UNION ALL SELECT 'job_postings', COUNT(*) FROM job_postings
                UNION ALL SELECT 'activity_logs', COUNT(*) FROM activity_logs
                UNION ALL SELECT 'contents', COUNT(*) FROM contents
            ");
            $records = [];
            foreach ($counts as $row) {
                $records[$row->tbl] = (int) $row->cnt;
            }
            $metrics['records'] = $records;

            // Recent 24h activity counts — single query
            $activity = DB::select("
                SELECT 'new_users' AS metric, COUNT(*) AS cnt
                FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
                UNION ALL
                SELECT 'survey_responses', COUNT(*)
                FROM survey_responses WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
                UNION ALL
                SELECT 'new_content', COUNT(*)
                FROM contents WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
            ");
            $act24h = [];
            foreach ($activity as $row) {
                $act24h[$row->metric] = (int) $row->cnt;
            }
            $metrics['activity_24h'] = $act24h;

            // Middleware / configuration notes
            $metrics['config'] = [
                'debug_mode'   => config('app.debug'),
                'app_env'      => config('app.env'),
                'log_channel'  => config('logging.default'),
            ];

        } catch (\Exception $e) {
            $metrics['error'] = $e->getMessage();
        }

        return $metrics;
    }

    private function getStorageMetrics(): array
    {
        $metrics = [];

        try {
            $storagePath = storage_path();

            if (function_exists('disk_free_space') && function_exists('disk_total_space')) {
                $freeSpace  = disk_free_space($storagePath);
                $totalSpace = disk_total_space($storagePath);
                $usedSpace  = $totalSpace - $freeSpace;

                $metrics['disk'] = [
                    'total'            => $totalSpace,
                    'total_formatted'  => $this->formatBytes($totalSpace),
                    'used'             => $usedSpace,
                    'used_formatted'   => $this->formatBytes($usedSpace),
                    'free'             => $freeSpace,
                    'free_formatted'   => $this->formatBytes($freeSpace),
                    'usage_percentage' => round(($usedSpace / $totalSpace) * 100, 2),
                ];
            }

            // Storage folders (fast — only counts top-level sizes)
            $metrics['storage_folders'] = [
                'logs'      => $this->getDirectorySize(storage_path('logs')),
                'framework' => $this->getDirectorySize(storage_path('framework')),
                'app'       => $this->getDirectorySize(storage_path('app')),
            ];
        } catch (\Exception $e) {
            $metrics['error'] = $e->getMessage();
        }

        return $metrics;
    }

    /**
     * Quick inline performance checks (no heavy benchmark — just latency tests).
     */
    private function getPerformanceBenchmarks(): array
    {
        $start = microtime(true);
        DB::selectOne('SELECT 1');
        $dbPingMs = round((microtime(true) - $start) * 1000, 2);

        $start = microtime(true);
        Cache::put('_perf_ping', 1, 5);
        Cache::get('_perf_ping');
        Cache::forget('_perf_ping');
        $cachePingMs = round((microtime(true) - $start) * 1000, 2);

        $start = microtime(true);
        $tmp = storage_path('framework/_perf_ping_' . uniqid());
        @file_put_contents($tmp, '1');
        @file_get_contents($tmp);
        @unlink($tmp);
        $fsPingMs = round((microtime(true) - $start) * 1000, 2);

        return [
            'db_ping_ms'    => $dbPingMs,
            'cache_ping_ms' => $cachePingMs,
            'fs_ping_ms'    => $fsPingMs,
        ];
    }

    // ─── Helpers ────────────────────────────────────────────────────

    private function getCpuUsage(): float
    {
        if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
            try {
                $cmd = 'wmic cpu get LoadPercentage /value';
                $output = @shell_exec($cmd);
                if ($output && preg_match('/LoadPercentage=(\d+)/', $output, $m)) {
                    return (float) $m[1];
                }
            } catch (\Throwable $e) {
                // Fallback
            }
            return 0;
        }

        // Linux: parse /proc/stat
        if (is_readable('/proc/stat')) {
            $stat = file_get_contents('/proc/stat');
            if (preg_match('/^cpu\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/m', $stat, $m)) {
                $total = $m[1] + $m[2] + $m[3] + $m[4];
                $idle  = $m[4];
                return $total > 0 ? round((1 - $idle / $total) * 100, 1) : 0;
            }
        }
        return 0;
    }

    private function getServerUptime(): string
    {
        if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
            $output = @shell_exec('net statistics server 2>&1');
            if ($output && preg_match('/since\s+(.+)/i', $output, $m)) {
                return trim($m[1]);
            }
            return 'N/A';
        }
        $output = @shell_exec('uptime -p 2>/dev/null');
        return $output ? trim($output) : 'N/A';
    }

    private function parseSize(string $size): int
    {
        $unit  = strtoupper(substr($size, -1));
        $value = (int) substr($size, 0, -1);
        return match ($unit) {
            'G' => $value * 1024 * 1024 * 1024,
            'M' => $value * 1024 * 1024,
            'K' => $value * 1024,
            default => (int) $size,
        };
    }

    private function formatBytes(int|float $bytes, int $precision = 2): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }
        return round($bytes, $precision) . ' ' . $units[$i];
    }

    private function getCpuCores(): int
    {
        if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
            $cores = (int) @shell_exec('echo %NUMBER_OF_PROCESSORS%');
            return $cores ?: 1;
        }
        $output = @shell_exec('nproc 2>/dev/null');
        return $output ? (int) $output : 1;
    }

    private function getDirectorySize(string $path): array
    {
        if (!is_dir($path)) {
            return ['size' => 0, 'size_formatted' => '0 B', 'files' => 0];
        }

        $size  = 0;
        $count = 0;
        $iter  = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($path, \RecursiveDirectoryIterator::SKIP_DOTS)
        );
        foreach ($iter as $file) {
            if ($file->isFile()) {
                $size += $file->getSize();
                $count++;
            }
        }

        return [
            'size'           => $size,
            'size_formatted' => $this->formatBytes($size),
            'files'          => $count,
        ];
    }
}
