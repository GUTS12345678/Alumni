<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class SystemMetricsController extends Controller
{
    /**
     * Get current system resource metrics
     */
    public function getMetrics()
    {
        try {
            $metrics = [
                'server' => $this->getServerMetrics(),
                'database' => $this->getDatabaseMetrics(),
                'application' => $this->getApplicationMetrics(),
                'storage' => $this->getStorageMetrics(),
                'timestamp' => now()->toDateTimeString()
            ];

            return response()->json([
                'success' => true,
                'data' => $metrics
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch system metrics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get server resource metrics (CPU, RAM, etc.)
     */
    private function getServerMetrics(): array
    {
        $metrics = [];

        // Memory Usage
        $memoryUsage = memory_get_usage(true);
        $memoryPeak = memory_get_peak_usage(true);
        $memoryLimit = $this->parseSize(ini_get('memory_limit'));

        $metrics['memory'] = [
            'current' => $memoryUsage,
            'current_formatted' => $this->formatBytes($memoryUsage),
            'peak' => $memoryPeak,
            'peak_formatted' => $this->formatBytes($memoryPeak),
            'limit' => $memoryLimit,
            'limit_formatted' => $this->formatBytes($memoryLimit),
            'usage_percentage' => $memoryLimit > 0 ? round(($memoryUsage / $memoryLimit) * 100, 2) : 0
        ];

        // Server Load Average (Unix/Linux only)
        if (function_exists('sys_getloadavg')) {
            $load = sys_getloadavg();
            $metrics['cpu'] = [
                'load_1min' => round($load[0], 2),
                'load_5min' => round($load[1], 2),
                'load_15min' => round($load[2], 2),
                'cores' => $this->getCpuCores()
            ];
        } else {
            $metrics['cpu'] = [
                'load_1min' => 0,
                'load_5min' => 0,
                'load_15min' => 0,
                'cores' => 1,
                'note' => 'CPU load not available on Windows'
            ];
        }

        // PHP Info
        $metrics['php'] = [
            'version' => PHP_VERSION,
            'max_execution_time' => ini_get('max_execution_time'),
            'upload_max_filesize' => ini_get('upload_max_filesize'),
            'post_max_size' => ini_get('post_max_size'),
            'opcache_enabled' => function_exists('opcache_get_status') && opcache_get_status() !== false
        ];

        return $metrics;
    }

    /**
     * Get database metrics
     */
    private function getDatabaseMetrics(): array
    {
        $metrics = [];

        try {
            // Database size
            $dbName = DB::connection()->getDatabaseName();
            
            // Get table sizes
            $tables = DB::select("
                SELECT 
                    table_name as 'name',
                    ROUND(((data_length + index_length) / 1024 / 1024), 2) as 'size_mb',
                    table_rows as 'rows'
                FROM information_schema.TABLES 
                WHERE table_schema = ?
                ORDER BY (data_length + index_length) DESC
                LIMIT 10
            ", [$dbName]);

            $totalSize = DB::selectOne("
                SELECT 
                    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) as total_size_mb
                FROM information_schema.TABLES 
                WHERE table_schema = ?
            ", [$dbName]);

            $metrics['database_name'] = $dbName;
            $metrics['total_size_mb'] = $totalSize->total_size_mb ?? 0;
            $metrics['top_tables'] = $tables;

            // Connection info
            $metrics['connections'] = [
                'max_connections' => DB::selectOne("SHOW VARIABLES LIKE 'max_connections'")->Value ?? 'N/A',
                'current' => DB::selectOne("SHOW STATUS LIKE 'Threads_connected'")->Value ?? 0
            ];

        } catch (\Exception $e) {
            $metrics['error'] = 'Could not fetch database metrics: ' . $e->getMessage();
        }

        return $metrics;
    }

    /**
     * Get application metrics
     */
    private function getApplicationMetrics(): array
    {
        $metrics = [];

        try {
            // Cache statistics
            $cacheDriver = config('cache.default');
            $metrics['cache'] = [
                'driver' => $cacheDriver,
                'available' => Cache::getStore() !== null
            ];

            // Record counts
            $metrics['records'] = [
                'users' => DB::table('users')->count(),
                'alumni' => DB::table('alumni_profiles')->count(),
                'surveys' => DB::table('surveys')->count(),
                'survey_responses' => DB::table('survey_responses')->count(),
                'jobs' => DB::table('jobs')->count()
            ];

            // Recent activity (last 24 hours)
            $metrics['activity_24h'] = [
                'new_users' => DB::table('users')
                    ->where('created_at', '>=', now()->subDay())
                    ->count(),
                'survey_responses' => DB::table('survey_responses')
                    ->where('created_at', '>=', now()->subDay())
                    ->count(),
                'job_applications' => DB::table('job_applications')
                    ->where('created_at', '>=', now()->subDay())
                    ->count()
            ];

        } catch (\Exception $e) {
            $metrics['error'] = 'Could not fetch application metrics: ' . $e->getMessage();
        }

        return $metrics;
    }

    /**
     * Get storage metrics
     */
    private function getStorageMetrics(): array
    {
        $metrics = [];

        try {
            $storagePath = storage_path();
            
            if (function_exists('disk_free_space') && function_exists('disk_total_space')) {
                $freeSpace = disk_free_space($storagePath);
                $totalSpace = disk_total_space($storagePath);
                $usedSpace = $totalSpace - $freeSpace;

                $metrics['disk'] = [
                    'total' => $totalSpace,
                    'total_formatted' => $this->formatBytes($totalSpace),
                    'used' => $usedSpace,
                    'used_formatted' => $this->formatBytes($usedSpace),
                    'free' => $freeSpace,
                    'free_formatted' => $this->formatBytes($freeSpace),
                    'usage_percentage' => round(($usedSpace / $totalSpace) * 100, 2)
                ];
            }

            // Application storage folders
            $metrics['storage_folders'] = [
                'logs' => $this->getDirectorySize(storage_path('logs')),
                'framework' => $this->getDirectorySize(storage_path('framework')),
                'app' => $this->getDirectorySize(storage_path('app'))
            ];

        } catch (\Exception $e) {
            $metrics['error'] = 'Could not fetch storage metrics: ' . $e->getMessage();
        }

        return $metrics;
    }

    /**
     * Helper: Parse size string (e.g., "128M") to bytes
     */
    private function parseSize(string $size): int
    {
        $unit = strtoupper(substr($size, -1));
        $value = (int) substr($size, 0, -1);

        switch ($unit) {
            case 'G':
                return $value * 1024 * 1024 * 1024;
            case 'M':
                return $value * 1024 * 1024;
            case 'K':
                return $value * 1024;
            default:
                return (int) $size;
        }
    }

    /**
     * Helper: Format bytes to human-readable format
     */
    private function formatBytes(int $bytes, int $precision = 2): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];

        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, $precision) . ' ' . $units[$i];
    }

    /**
     * Helper: Get number of CPU cores
     */
    private function getCpuCores(): int
    {
        if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
            // Windows
            $process = @popen('wmic cpu get NumberOfCores', 'rb');
            if ($process !== false) {
                fgets($process);
                $cores = (int) fgets($process);
                pclose($process);
                return $cores ?: 1;
            }
        } else {
            // Linux/Unix
            $process = @popen('nproc', 'rb');
            if ($process !== false) {
                $cores = (int) fgets($process);
                pclose($process);
                return $cores ?: 1;
            }
        }

        return 1;
    }

    /**
     * Helper: Get directory size
     */
    private function getDirectorySize(string $path): array
    {
        if (!is_dir($path)) {
            return ['size' => 0, 'size_formatted' => '0 B'];
        }

        $size = 0;
        $files = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($path, \RecursiveDirectoryIterator::SKIP_DOTS)
        );

        foreach ($files as $file) {
            if ($file->isFile()) {
                $size += $file->getSize();
            }
        }

        return [
            'size' => $size,
            'size_formatted' => $this->formatBytes($size)
        ];
    }
}
