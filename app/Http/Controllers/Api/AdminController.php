<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\AlumniProfile;
use App\Models\Batch;
use App\Models\Survey;
use App\Models\SurveyResponse;
use App\Models\SurveyAnswer;
use App\Models\ActivityLog;
use App\Models\EmailTemplate;
use App\Models\AdminSetting;
use App\Models\Department;
use App\Models\Course;
use App\Services\EmailNotificationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class AdminController extends Controller
{
    /**
     * Get dashboard metrics and overview data with robust caching
     */
    public function dashboard(Request $request): JsonResponse
    {
        try {
            // Get campus_id filter if provided
            $campusId = $request->input('campus_id');
            
            // Cache key based on campus filter
            $cacheKey = 'dashboard_metrics_' . ($campusId ?? 'all');
            
            // Try to get from cache first
            $cachedData = Cache::get($cacheKey);
            
            // Validate cached data - if invalid, fetch fresh
            if ($cachedData && $this->isValidDashboardData($cachedData)) {
                return response()->json([
                    'success' => true,
                    'data' => $cachedData,
                    'cached' => true,
                    'source' => 'cache'
                ]);
            }
            
            // Cache miss or invalid - use locking to prevent race conditions
            $lock = Cache::lock('dashboard_fetch_' . ($campusId ?? 'all'), 10);
            
            try {
                // Try to acquire lock
                if ($lock->get()) {
                    // Fetch fresh data
                    $data = $this->getDashboardMetrics($campusId);
                    
                    // Only cache if data is valid
                    if ($this->isValidDashboardData($data)) {
                        Cache::put($cacheKey, $data, 180); // 3 minutes (reduced from 5)
                    }
                    
                    return response()->json([
                        'success' => true,
                        'data' => $data,
                        'cached' => false,
                        'source' => 'database'
                    ]);
                } else {
                    // Couldn't get lock, wait and try cache again
                    sleep(1);
                    $cachedData = Cache::get($cacheKey);
                    
                    if ($cachedData && $this->isValidDashboardData($cachedData)) {
                        return response()->json([
                            'success' => true,
                            'data' => $cachedData,
                            'cached' => true,
                            'source' => 'cache_retry'
                        ]);
                    }
                    
                    // Still no valid cache, fetch without locking
                    $data = $this->getDashboardMetrics($campusId);
                    
                    return response()->json([
                        'success' => true,
                        'data' => $data,
                        'cached' => false,
                        'source' => 'fallback'
                    ]);
                }
            } finally {
                $lock->release();
            }
            
        } catch (\Exception $e) {
            \Log::error('Dashboard fetch error', [
                'error' => $e->getMessage(),
                'campus_id' => $campusId ?? 'all'
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch dashboard data',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Validate dashboard data to ensure it's not empty or corrupted
     */
    private function isValidDashboardData($data): bool
    {
        if (!is_array($data)) {
            return false;
        }
        
        // Check required keys exist
        $requiredKeys = ['overview', 'employment_metrics', 'batch_distribution'];
        foreach ($requiredKeys as $key) {
            if (!isset($data[$key])) {
                return false;
            }
        }
        
        // Check overview has actual data (not all zeros)
        if (isset($data['overview'])) {
            $overview = $data['overview'];
            // At least one metric should be > 0 for a valid system
            if (
                ($overview['total_alumni'] ?? 0) === 0 &&
                ($overview['total_surveys'] ?? 0) === 0 &&
                ($overview['total_batches'] ?? 0) === 0
            ) {
                // Fresh system might have no data, log it
                \Log::warning('Dashboard has no data - might be fresh system or data issue');
            }
        }
        
        return true;
    }
    
    /**
     * Manual cache refresh endpoint for admins
     */
    public function refreshDashboardCache(Request $request): JsonResponse
    {
        try {
            $campusId = $request->input('campus_id');
            $cacheKey = 'dashboard_metrics_' . ($campusId ?? 'all');
            
            // Clear existing cache
            Cache::forget($cacheKey);
            
            // Fetch fresh data
            $data = $this->getDashboardMetrics($campusId);
            
            // Cache it
            if ($this->isValidDashboardData($data)) {
                Cache::put($cacheKey, $data, 180);
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Dashboard cache refreshed successfully',
                'data' => $data
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to refresh dashboard cache',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Clear all system caches (for debugging)
     */
    public function clearAllCaches(Request $request): JsonResponse
    {
        try {
            // Get all campus IDs
            $campusIds = \App\Models\Campus::pluck('id')->toArray();
            
            $clearedKeys = [];
            
            // Clear dashboard caches
            foreach (array_merge(['all'], $campusIds) as $campusId) {
                $keys = [
                    'dashboard_metrics_' . $campusId,
                    'alumni_stats_' . $campusId,
                    'analytics_overview_' . $campusId,
                    'analytics_time_to_job_' . $campusId . '_all',
                    'analytics_comprehensive_' . $campusId,
                ];
                
                foreach ($keys as $key) {
                    if (Cache::forget($key)) {
                        $clearedKeys[] = $key;
                    }
                }
            }
            
            return response()->json([
                'success' => true,
                'message' => 'All caches cleared successfully',
                'cleared_keys' => $clearedKeys,
                'count' => count($clearedKeys)
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to clear caches',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Check cache health status
     */
    public function cacheHealthCheck(Request $request): JsonResponse
    {
        try {
            $campusIds = \App\Models\Campus::pluck('id')->toArray();
            
            $health = [
                'redis_connected' => false,
                'cache_driver' => config('cache.default'),
                'cached_dashboards' => [],
                'cached_analytics' => [],
                'total_cached_keys' => 0,
                'redis_memory' => 'N/A',
                'issues' => []
            ];
            
            // Test Redis connection
            try {
                Cache::put('health_check_test', 'ok', 10);
                $test = Cache::get('health_check_test');
                $health['redis_connected'] = ($test === 'ok');
                Cache::forget('health_check_test');
            } catch (\Exception $e) {
                $health['issues'][] = 'Redis connection failed: ' . $e->getMessage();
            }
            
            // Check each campus cache
            foreach (array_merge(['all'], $campusIds) as $campusId) {
                $dashboardKey = 'dashboard_metrics_' . $campusId;
                $statsKey = 'alumni_stats_' . $campusId;
                $analyticsKey = 'analytics_overview_' . $campusId;
                
                $dashboardCached = Cache::has($dashboardKey);
                $statsCached = Cache::has($statsKey);
                $analyticsCached = Cache::has($analyticsKey);
                
                if ($dashboardCached || $statsCached || $analyticsCached) {
                    $health['cached_dashboards'][$campusId] = [
                        'dashboard' => $dashboardCached,
                        'stats' => $statsCached,
                        'analytics' => $analyticsCached
                    ];
                    
                    $health['total_cached_keys'] += ($dashboardCached ? 1 : 0) + ($statsCached ? 1 : 0) + ($analyticsCached ? 1 : 0);
                    
                    // Validate cached data
                    if ($dashboardCached) {
                        $data = Cache::get($dashboardKey);
                        if (!$this->isValidDashboardData($data)) {
                            $health['issues'][] = "Invalid dashboard data cached for campus: {$campusId}";
                        }
                    }
                }
            }
            
            // Get Redis memory if available
            try {
                $redis = app('redis')->connection();
                $info = $redis->info('memory');
                $health['redis_memory'] = $info['used_memory_human'] ?? 'N/A';
            } catch (\Exception $e) {
                $health['issues'][] = 'Could not get Redis memory info';
            }
            
            return response()->json([
                'success' => true,
                'health' => $health,
                'healthy' => empty($health['issues'])
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Health check failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get dashboard metrics (extracted for caching)
     */
    private function getDashboardMetrics($campusId): array
    {
        // Get campus_id filter if provided
        $campusId = $campusId;
            
            // Build base queries with optional campus filtering
            $alumniQuery = AlumniProfile::query();
            $surveyQuery = Survey::query();
            $batchQuery = Batch::query();
            $responseQuery = SurveyResponse::where('status', 'completed');
            $userQuery = User::query();
            
            if ($campusId) {
                $alumniQuery->where('campus_id', $campusId);
                $surveyQuery->where(function($q) use ($campusId) {
                    $q->where('campus_id', $campusId)->orWhere('is_multi_campus', true);
                });
                $batchQuery->where('campus_id', $campusId);
                $responseQuery->where('campus_id', $campusId);
                $userQuery->where('campus_id', $campusId);
            }
            
            // Total counts
            $totalAlumni = $alumniQuery->count();
            $totalSurveys = (clone $surveyQuery)->count();
            $totalBatches = $batchQuery->count();
            $totalResponses = $responseQuery->count();
            
            // System-level counts (for Super Admin analytics)
            $totalUsers = $userQuery->count();
            $totalDepartments = $campusId ? Department::where('campus_id', $campusId)->count() : Department::count();
            $totalCourses = $campusId ? Course::where('campus_id', $campusId)->count() : Course::count();
            $activeSurveys = (clone $surveyQuery)->where('status', 'active')->count();

            // Response rate calculation
            $invitationQuery = SurveyResponse::query();
            if ($campusId) {
                $invitationQuery->where('campus_id', $campusId);
            }
            $totalInvitations = $invitationQuery->count();
            $responseRate = $totalInvitations > 0 ? round(($totalResponses / $totalInvitations) * 100, 2) : 0;

            // Recent activity (last 30 days)
            $recentAlumniQuery = AlumniProfile::where('created_at', '>=', Carbon::now()->subDays(30));
            $recentResponseQuery = SurveyResponse::where('status', 'completed')
                ->where('updated_at', '>=', Carbon::now()->subDays(30));
            if ($campusId) {
                $recentAlumniQuery->where('campus_id', $campusId);
                $recentResponseQuery->where('campus_id', $campusId);
            }
            $recentRegistrations = $recentAlumniQuery->count();
            $recentResponses = $recentResponseQuery->count();

            // Batch distribution - Use graduation_year from alumni_profiles directly
            // This handles alumni who have graduation_year set but may not have batch_id
            $batchDistQuery = AlumniProfile::select('graduation_year', DB::raw('COUNT(*) as alumni_count'))
                ->whereNotNull('graduation_year');
            if ($campusId) {
                $batchDistQuery->where('campus_id', $campusId);
            }
            $batchDistribution = $batchDistQuery->groupBy('graduation_year')
                ->orderBy('graduation_year', 'desc')
                ->get()
                ->map(function ($record) {
                    return [
                        'batch_name' => 'Class of ' . $record->graduation_year,
                        'batch_year' => (int) $record->graduation_year,
                        'alumni_count' => (int) $record->alumni_count
                    ];
                });

            // Employment status distribution
            $empStatsQuery = AlumniProfile::select('employment_status')
                ->whereNotNull('employment_status');
            if ($campusId) {
                $empStatsQuery->where('campus_id', $campusId);
            }
            $employmentStats = $empStatsQuery->groupBy('employment_status')
                ->selectRaw('employment_status, COUNT(*) as count')
                ->get()
                ->pluck('count', 'employment_status');

            // Recent surveys
            // Recent surveys — eager-load creator and count completed responses to avoid N+1
            $recentSurveysQuery = Survey::with('creator:id,email')
                ->withCount(['responses as responses_count' => function ($q) use ($campusId) {
                    $q->where('status', 'completed');
                    if ($campusId) {
                        $q->where('campus_id', $campusId);
                    }
                }]);
            if ($campusId) {
                $recentSurveysQuery->where(function($q) use ($campusId) {
                    $q->where('campus_id', $campusId)->orWhere('is_multi_campus', true);
                });
            }
            $recentSurveys = $recentSurveysQuery->orderBy('created_at', 'desc')
                ->take(5)
                ->get()
                ->map(function ($survey) {
                    return [
                        'id' => $survey->id,
                        'title' => $survey->title,
                        'status' => $survey->status,
                        'created_by' => $survey->creator->email ?? 'Unknown',
                        'created_at' => $survey->created_at->format('Y-m-d H:i:s'),
                        'responses_count' => $survey->responses_count
                    ];
                });

            // Monthly registration trend (last 12 months)
            $monthlyTrend = [];
            for ($i = 11; $i >= 0; $i--) {
                $month = Carbon::now()->subMonths($i);
                $trendQuery = AlumniProfile::whereYear('created_at', $month->year)
                    ->whereMonth('created_at', $month->month);
                if ($campusId) {
                    $trendQuery->where('campus_id', $campusId);
                }
                $count = $trendQuery->count();

                $monthlyTrend[] = [
                    'month' => $month->format('Y-m'),
                    'registrations' => $count
                ];
            }

            // ============================================
            // EMPLOYMENT METRICS - Critical for Tracer System
            // ============================================
            
            // 1. Employment Rate Calculation
            $employedAlumniQuery = AlumniProfile::whereIn('employment_status', [
                'employed_full_time', 
                'employed_part_time', 
                'self_employed'
            ]);
            if ($campusId) {
                $employedAlumniQuery->where('campus_id', $campusId);
            }
            $totalEmployed = $employedAlumniQuery->count();
            $employmentRate = $totalAlumni > 0 ? round(($totalEmployed / $totalAlumni) * 100, 2) : 0;

            // 2. Average Days to First Job
            $timeToJobQuery = AlumniProfile::whereIn('employment_status', [
                'employed_full_time', 
                'employed_part_time', 
                'self_employed'
            ])
            ->whereNotNull('graduation_year')
            ->whereNotNull('job_start_date');
            
            if ($campusId) {
                $timeToJobQuery->where('campus_id', $campusId);
            }
            
            $alumniWithJobDates = $timeToJobQuery->get();
            $totalDays = 0;
            $validRecords = 0;
            
            foreach ($alumniWithJobDates as $alumni) {
                // Use actual graduation_date if available, otherwise assume June 1st
                $graduationDate = $alumni->graduation_date 
                    ? Carbon::parse($alumni->graduation_date)
                    : Carbon::parse($alumni->graduation_year . '-06-01');
                $jobStartDate = Carbon::parse($alumni->job_start_date);
                
                // Only count if job started after graduation AND within 5 years (1825 days)
                if ($jobStartDate->greaterThanOrEqualTo($graduationDate)) {
                    $daysToJob = $graduationDate->diffInDays($jobStartDate);
                    if ($daysToJob <= 1825) { // 5-year cap to filter outliers
                        $totalDays += $daysToJob;
                        $validRecords++;
                    }
                }
            }
            
            $avgDaysToJob = $validRecords > 0 ? round($totalDays / $validRecords) : 0;

            // 3. Job Alignment Analysis — standardized: aligned = NULL or 'none' job_mismatch_reason
            $alignmentQuery = AlumniProfile::whereIn('employment_status', [
                'employed_full_time', 
                'employed_part_time', 
                'self_employed'
            ]);
            if ($campusId) {
                $alignmentQuery->where('campus_id', $campusId);
            }
            
            $alignedJobs = (clone $alignmentQuery)->where(function($q) {
                $q->whereNull('job_mismatch_reason')
                  ->orWhere('job_mismatch_reason', 'none');
            })->count();
            $jobAlignmentRate = $totalEmployed > 0 ? round(($alignedJobs / $totalEmployed) * 100, 2) : 0;

            // 4. Job Mismatch Breakdown
            $mismatchStats = [
                'overqualified' => (clone $alignmentQuery)->where('job_mismatch_reason', 'overqualified')->count(),
                'underqualified' => (clone $alignmentQuery)->where('job_mismatch_reason', 'underqualified')->count(),
                'unfit' => (clone $alignmentQuery)->where('job_mismatch_reason', 'unfit')->count(),
                'good_match' => (clone $alignmentQuery)->where(function($q) {
                    $q->whereNull('job_mismatch_reason')
                      ->orWhere('job_mismatch_reason', 'none');
                })->count()
            ];

            // 5. Unemployment Breakdown
            $unemployedQuery = AlumniProfile::query();
            if ($campusId) {
                $unemployedQuery->where('campus_id', $campusId);
            }
            $unemploymentStats = [
                'seeking' => (clone $unemployedQuery)->where('employment_status', 'unemployed_seeking')->count(),
                'not_seeking' => (clone $unemployedQuery)->where('employment_status', 'unemployed_not_seeking')->count(),
                'continuing_education' => (clone $unemployedQuery)->where('employment_status', 'continuing_education')->count()
            ];

            // 6. Employment Location Breakdown (Local vs Foreign)
            $locationQuery = AlumniProfile::whereIn('employment_status', [
                'employed_full_time', 'employed_part_time', 'self_employed'
            ]);
            if ($campusId) {
                $locationQuery->where('campus_id', $campusId);
            }
            $employmentLocationStats = [
                'local' => (clone $locationQuery)->where('employment_location_type', 'local')->count(),
                'foreign' => (clone $locationQuery)->where('employment_location_type', 'foreign')->count(),
                'remote' => (clone $locationQuery)->where('employment_location_type', 'remote')->count(),
            ];

            return [
                'overview' => [
                    'total_alumni' => $totalAlumni,
                    'total_surveys' => $totalSurveys,
                    'total_batches' => $totalBatches,
                    'total_responses' => $totalResponses,
                    'response_rate' => $responseRate,
                    'total_users' => $totalUsers,
                    'total_departments' => $totalDepartments,
                    'total_courses' => $totalCourses,
                    'active_surveys' => $activeSurveys
                ],
                'employment_metrics' => [
                    'employment_rate' => $employmentRate,
                    'total_employed' => $totalEmployed,
                    'avg_days_to_job' => $avgDaysToJob,
                    'job_alignment_rate' => $jobAlignmentRate,
                    'aligned_jobs_count' => $alignedJobs
                ],
                'mismatch_stats' => $mismatchStats,
                'unemployment_stats' => $unemploymentStats,
                'employment_location_stats' => $employmentLocationStats,
                'recent_activity' => [
                    'recent_registrations' => $recentRegistrations,
                    'recent_responses' => $recentResponses
                ],
                'batch_distribution' => $batchDistribution,
                'employment_stats' => $employmentStats,
                'recent_surveys' => $recentSurveys,
                'monthly_trend' => $monthlyTrend
            ];
    }
    /**
     * Get all alumni with comprehensive filtering and pagination (Alumni Bank)
     */
    public function getAlumni(Request $request): JsonResponse
    {
        try {
            $query = AlumniProfile::with(['user:id,email', 'batch:id,name,graduation_year', 'campus:id,name,code'])
                ->orderBy('created_at', 'desc');

            // Campus filter (priority filter - always apply if provided)
            if ($request->has('campus_id') && $request->campus_id) {
                $query->where('campus_id', $request->campus_id);
            }

            // Apply filters
            if ($request->has('batch_id') && $request->batch_id) {
                $query->where('batch_id', $request->batch_id);
            }

            if ($request->has('graduation_year') && $request->graduation_year) {
                $query->whereHas('batch', function ($q) use ($request) {
                    $q->where('graduation_year', $request->graduation_year);
                });
            }

            if ($request->has('employment_status') && $request->employment_status) {
                $status = $request->employment_status;
                // Map frontend filter values to database values
                $statusMapping = [
                    'employed' => ['employed_full_time', 'employed_part_time'],
                    'unemployed' => ['unemployed_seeking', 'unemployed_not_seeking'],
                    'self-employed' => ['self_employed'],
                    'pursuing_education' => ['continuing_education'],
                ];
                
                if (isset($statusMapping[$status])) {
                    $query->whereIn('employment_status', $statusMapping[$status]);
                } else {
                    // Direct match for exact values
                    $query->where('employment_status', $status);
                }
            }

            if ($request->has('degree_program') && $request->degree_program) {
                $query->where('degree_program', 'like', "%{$request->degree_program}%");
            }

            if ($request->has('major') && $request->major) {
                $query->where('major', 'like', "%{$request->major}%");
            }

            if ($request->has('company') && $request->company) {
                $query->where('current_employer', 'like', "%{$request->company}%");
            }

            if ($request->has('job_title') && $request->job_title) {
                $query->where('current_job_title', 'like', "%{$request->job_title}%");
            }

            if ($request->has('employer') && $request->employer) {
                $query->where('current_employer', 'like', "%{$request->employer}%");
            }

            if ($request->has('career_field') && $request->career_field) {
                $query->where('career_field', $request->career_field);
            }

            if ($request->has('location') && $request->location) {
                $query->where(function ($q) use ($request) {
                    $location = $request->location;
                    $q->where('city', 'like', "%{$location}%")
                        ->orWhere('state_province', 'like', "%{$location}%")
                        ->orWhere('country', 'like', "%{$location}%");
                });
            }

            if ($request->has('willing_to_mentor') && $request->willing_to_mentor !== '') {
                $query->where('willing_to_mentor', (bool) $request->willing_to_mentor);
            }

            if ($request->has('willing_to_hire') && $request->willing_to_hire !== '') {
                $query->where('willing_to_hire_alumni', (bool) $request->willing_to_hire);
            }

            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('middle_name', 'like', "%{$search}%")
                        ->orWhere('student_id', 'like', "%{$search}%")
                        ->orWhere('current_job_title', 'like', "%{$search}%")
                        ->orWhere('current_employer', 'like', "%{$search}%")
                        ->orWhereHas('user', function ($userQuery) use ($search) {
                            $userQuery->where('email', 'like', "%{$search}%");
                        });
                });
            }

            // Sorting options - handle both old format (sort_by/sort_order) and new format (sort)
            if ($request->has('sort') && $request->sort) {
                $sort = $request->sort;
                switch ($sort) {
                    case 'name_asc':
                        $query->orderBy('first_name', 'asc')->orderBy('last_name', 'asc');
                        break;
                    case 'name_desc':
                        $query->orderBy('first_name', 'desc')->orderBy('last_name', 'desc');
                        break;
                    case 'grad_year_desc':
                        $query->leftJoin('batches', 'alumni_profiles.batch_id', '=', 'batches.id')
                            ->orderBy('batches.graduation_year', 'desc')
                            ->select('alumni_profiles.*');
                        break;
                    case 'grad_year_asc':
                        $query->leftJoin('batches', 'alumni_profiles.batch_id', '=', 'batches.id')
                            ->orderBy('batches.graduation_year', 'asc')
                            ->select('alumni_profiles.*');
                        break;
                    case 'recent':
                        $query->orderBy('updated_at', 'desc');
                        break;
                    default:
                        $query->orderBy('created_at', 'desc');
                        break;
                }
            } else {
                // Fallback to old sorting format for backward compatibility
                $sortBy = $request->get('sort_by', 'created_at');
                $sortOrder = $request->get('sort_order', 'desc');

                switch ($sortBy) {
                    case 'name':
                        $query->orderBy('first_name', $sortOrder)->orderBy('last_name', $sortOrder);
                        break;
                    case 'graduation_year':
                        $query->leftJoin('batches', 'alumni_profiles.batch_id', '=', 'batches.id')
                            ->orderBy('batches.graduation_year', $sortOrder)
                            ->select('alumni_profiles.*');
                        break;
                    case 'employment_status':
                        $query->orderBy('employment_status', $sortOrder);
                        break;
                    case 'created_at':
                    default:
                        $query->orderBy('created_at', $sortOrder);
                        break;
                }
            }

            // Pagination
            $perPage = $request->get('per_page', 15);
            $alumni = $query->paginate($perPage);

            // Add summary statistics for current filter
            $totalFiltered = $query->count();
            $employmentBreakdown = AlumniProfile::query()
                ->when($request->has('batch_id'), function ($q) use ($request) {
                    $q->where('batch_id', $request->batch_id);
                })
                ->when($request->has('graduation_year'), function ($q) use ($request) {
                    $q->whereHas('batch', function ($batchQuery) use ($request) {
                        $batchQuery->where('graduation_year', $request->graduation_year);
                    });
                })
                ->select('employment_status', DB::raw('count(*) as count'))
                ->whereNotNull('employment_status')
                ->groupBy('employment_status')
                ->pluck('count', 'employment_status');

            return response()->json([
                'success' => true,
                'data' => $alumni,
                'filter_summary' => [
                    'total_filtered' => $totalFiltered,
                    'employment_breakdown' => $employmentBreakdown
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch alumni data',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get detailed alumni profile by ID
     */
    public function getAlumniProfile(Request $request, $id): JsonResponse
    {
        try {
            $alumni = AlumniProfile::with([
                'user:id,email,status',
                'batch:id,name,graduation_year,description',
            ])->findOrFail($id);

            // Get survey responses for this alumni
            $surveyResponses = SurveyResponse::with(['survey:id,title', 'answers.surveyQuestion'])
                ->where('user_id', $alumni->user_id)
                ->where('status', 'completed')
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'profile' => $alumni,
                    'survey_responses' => $surveyResponses,
                    'response_count' => $surveyResponses->count()
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Alumni profile not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Get alumni statistics and analytics with robust caching
     */
    public function getAlumniStats(Request $request): JsonResponse
    {
        try {
            $campusId = $request->get('campus_id');
            
            // Create cache key
            $cacheKey = 'alumni_stats_' . ($campusId ?? 'all');
            
            // Try cache with validation
            $cachedData = Cache::get($cacheKey);
            if ($cachedData && is_array($cachedData) && isset($cachedData['overview'])) {
                return response()->json([
                    'success' => true,
                    'data' => $cachedData,
                    'cached' => true
                ]);
            }
            
            // Use locking
            $lock = Cache::lock('alumni_stats_' . ($campusId ?? 'all'), 10);
            
            try {
                if ($lock->get()) {
                    // Fetch data
                    $data = $this->calculateAlumniStats($campusId);
                    
                    // Cache if valid
                    if (!empty($data) && isset($data['overview'])) {
                        Cache::put($cacheKey, $data, 180); // 3 minutes
                    }
                    
                    return response()->json([
                        'success' => true,
                        'data' => $data,
                        'cached' => false
                    ]);
                } else {
                    // Wait and retry
                    sleep(1);
                    $cachedData = Cache::get($cacheKey);
                    if ($cachedData && is_array($cachedData)) {
                        return response()->json([
                            'success' => true,
                            'data' => $cachedData,
                            'cached' => true
                        ]);
                    }
                    
                    // Fallback
                    $data = $this->calculateAlumniStats($campusId);
                    return response()->json([
                        'success' => true,
                        'data' => $data,
                        'cached' => false
                    ]);
                }
            } finally {
                $lock->release();
            }
        } catch (\Exception $e) {
            \Log::error('Alumni stats error', [
                'error' => $e->getMessage(),
                'campus_id' => $campusId ?? 'all'
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch alumni statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Calculate alumni statistics
     */
    private function calculateAlumniStats($campusId)
    {
                // Base query with optional campus filter
                $baseQuery = AlumniProfile::query();
                if ($campusId) {
                    $baseQuery->where('campus_id', $campusId);
                }
                
                // Overall statistics
                $totalAlumni = (clone $baseQuery)->count();

                // Batch-wise distribution
                $batchQuery = Batch::withCount('alumniProfiles');
                if ($campusId) {
                    $batchQuery->where('campus_id', $campusId);
                }
                $batchStats = $batchQuery->orderBy('graduation_year', 'desc')
                    ->get()
                    ->map(function ($batch) {
                        return [
                            'batch_id' => $batch->id,
                            'batch_name' => $batch->name,
                            'graduation_year' => $batch->graduation_year,
                            'alumni_count' => $batch->alumni_profiles_count
                        ];
                    });

                // Employment status distribution
                $empQuery = (clone $baseQuery)->select('employment_status', DB::raw('count(*) as count'))
                    ->whereNotNull('employment_status')
                    ->groupBy('employment_status');
                $employmentStats = $empQuery->get()->pluck('count', 'employment_status');

                // Top employers
                $employerQuery = (clone $baseQuery)->select('current_employer', DB::raw('count(*) as count'))
                    ->whereNotNull('current_employer')
                    ->where('current_employer', '!=', '')
                    ->groupBy('current_employer')
                    ->orderBy('count', 'desc')
                    ->limit(10);
                $topEmployers = $employerQuery->get();

                // Degree program distribution
                $degreeQuery = (clone $baseQuery)->select('degree_program', DB::raw('count(*) as count'))
                    ->whereNotNull('degree_program')
                    ->groupBy('degree_program')
                    ->orderBy('count', 'desc');
                $degreePrograms = $degreeQuery->get()->pluck('count', 'degree_program');

                // Major distribution
                $majorQuery = (clone $baseQuery)->select('major', DB::raw('count(*) as count'))
                    ->whereNotNull('major')
                    ->groupBy('major')
                    ->orderBy('count', 'desc')
                    ->limit(15);
                $majors = $majorQuery->get()->pluck('count', 'major');

                // Geographic distribution
                $locationQuery = (clone $baseQuery)->select('city', 'state_province', 'country', DB::raw('count(*) as count'))
                    ->whereNotNull('city')
                    ->groupBy('city', 'state_province', 'country')
                    ->orderBy('count', 'desc')
                    ->limit(20);
                $locations = $locationQuery->get();

                // Mentorship and hiring willingness
                $mentoringStats = [
                    'willing_to_mentor' => (clone $baseQuery)->where('willing_to_mentor', true)->count(),
                    'willing_to_hire' => (clone $baseQuery)->where('willing_to_hire_alumni', true)->count(),
                    'total_alumni' => $totalAlumni
                ];
                
                return [
                    'overview' => [
                        'total_alumni' => $totalAlumni,
                        'total_batches' => $batchStats->count()
                    ],
                    'batch_distribution' => $batchStats,
                    'employment_stats' => $employmentStats,
                    'top_employers' => $topEmployers,
                    'degree_programs' => $degreePrograms,
                    'majors' => $majors,
                    'geographic_distribution' => $locations,
                    'mentoring_stats' => $mentoringStats
                ];
    }
    
    /**
     * Get all surveys with comprehensive filtering and statistics
     */
    public function getSurveys(Request $request): JsonResponse
    {
        try {
            $campusId = $request->input('campus_id');
            
            $query = Survey::with(['creator:id,email'])
                ->withCount(['questions']);

            // Add campus-filtered responses count
            if ($campusId) {
                $query->withCount(['responses as responses_count' => function ($query) use ($campusId) {
                    $query->whereHas('user', function ($q) use ($campusId) {
                        $q->where('campus_id', $campusId);
                    });
                }]);
            } else {
                $query->withCount(['responses as responses_count']);
            }

            $query->orderBy('created_at', 'desc');

            // Filter by campus
            if ($campusId) {
                $query->where(function ($q) use ($campusId) {
                    $q->where('campus_id', $campusId)
                      ->orWhere('is_multi_campus', true)
                      ->orWhereNull('campus_id');
                });
            }

            // Filter by status
            if ($request->has('status') && $request->status) {
                $query->where('status', $request->status);
            }

            // Filter by survey type
            if ($request->has('type') && $request->type) {
                $query->where('type', $request->type);
            }

            // Filter by registration surveys
            if ($request->has('is_registration_survey') && $request->is_registration_survey !== '') {
                $query->where('is_registration_survey', (bool) $request->is_registration_survey);
            }

            // Filter by anonymous surveys
            if ($request->has('is_anonymous') && $request->is_anonymous !== '') {
                $query->where('is_anonymous', (bool) $request->is_anonymous);
            }

            // Filter by authentication requirement
            if ($request->has('require_authentication') && $request->require_authentication !== '') {
                $query->where('require_authentication', (bool) $request->require_authentication);
            }

            // Filter by multiple responses allowed
            if ($request->has('allow_multiple_responses') && $request->allow_multiple_responses !== '') {
                $query->where('allow_multiple_responses', (bool) $request->allow_multiple_responses);
            }

            // Filter by creator
            if ($request->has('created_by') && $request->created_by) {
                $query->where('created_by', $request->created_by);
            }

            // Filter by date range
            if ($request->has('start_date_from')) {
                $query->where('start_date', '>=', $request->start_date_from);
            }
            if ($request->has('start_date_to')) {
                $query->where('start_date', '<=', $request->start_date_to);
            }

            // Filter by end date range
            if ($request->has('end_date_from')) {
                $query->where('end_date', '>=', $request->end_date_from);
            }
            if ($request->has('end_date_to')) {
                $query->where('end_date', '<=', $request->end_date_to);
            }

            // Filter by target graduation years
            if ($request->has('target_graduation_year') && $request->target_graduation_year) {
                $query->whereJsonContains('target_graduation_years', (int) $request->target_graduation_year);
            }

            // Filter by target batches
            if ($request->has('target_batch_id') && $request->target_batch_id) {
                $query->whereJsonContains('target_batches', (int) $request->target_batch_id);
            }

            // Filter by response count range
            if ($request->has('min_responses')) {
                $query->having('responses_count', '>=', $request->min_responses);
            }
            if ($request->has('max_responses')) {
                $query->having('responses_count', '<=', $request->max_responses);
            }

            // Filter by question count range
            if ($request->has('min_questions')) {
                $query->having('questions_count', '>=', $request->min_questions);
            }
            if ($request->has('max_questions')) {
                $query->having('questions_count', '<=', $request->max_questions);
            }

            // Search functionality
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhere('instructions', 'like', "%{$search}%");
                });
            }

            // Sorting options
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');

            switch ($sortBy) {
                case 'title':
                    $query->orderBy('title', $sortOrder);
                    break;
                case 'type':
                    $query->orderBy('type', $sortOrder);
                    break;
                case 'status':
                    $query->orderBy('status', $sortOrder);
                    break;
                case 'start_date':
                    $query->orderBy('start_date', $sortOrder);
                    break;
                case 'end_date':
                    $query->orderBy('end_date', $sortOrder);
                    break;
                case 'responses_count':
                    $query->orderBy('responses_count', $sortOrder);
                    break;
                case 'questions_count':
                    $query->orderBy('questions_count', $sortOrder);
                    break;
                case 'created_at':
                default:
                    $query->orderBy('created_at', $sortOrder);
                    break;
            }

            $perPage = $request->get('per_page', 15);
            $surveys = $query->paginate($perPage);

            // Add completion rate and additional statistics for each survey
            $surveys->getCollection()->transform(function ($survey) {
                $completedResponses = $survey->responses()->where('status', 'completed')->count();
                $survey->completion_rate = $survey->responses_count > 0
                    ? round(($completedResponses / $survey->responses_count) * 100, 2)
                    : 0;
                $survey->completed_responses = $completedResponses;
                $survey->in_progress_responses = $survey->responses()->where('status', 'in_progress')->count();

                // Calculate average completion time in minutes
                $avgCompletionTime = $survey->responses()
                    ->whereNotNull('completed_at')
                    ->selectRaw('AVG(TIMESTAMPDIFF(MINUTE, created_at, completed_at)) as avg_time')
                    ->value('avg_time');
                $survey->avg_completion_time = $avgCompletionTime ? round((float) $avgCompletionTime, 1) : null;

                // Calculate response rate if survey has targets
                if ($survey->target_batches || $survey->target_graduation_years) {
                    // This would require calculating total target alumni
                    $survey->target_response_rate = 0; // Placeholder for now
                }

                return $survey;
            });

            // Generate filter summary
            $totalFiltered = $query->count();
            $statusBreakdown = Survey::query()
                ->when($request->has('type'), function ($q) use ($request) {
                    $q->where('type', $request->type);
                })
                ->select('status', DB::raw('count(*) as count'))
                ->groupBy('status')
                ->pluck('count', 'status');

            $typeBreakdown = Survey::query()
                ->when($request->has('status'), function ($q) use ($request) {
                    $q->where('status', $request->status);
                })
                ->select('type', DB::raw('count(*) as count'))
                ->groupBy('type')
                ->pluck('count', 'type');

            return response()->json([
                'success' => true,
                'data' => $surveys,
                'filter_summary' => [
                    'total_filtered' => $totalFiltered,
                    'status_breakdown' => $statusBreakdown,
                    'type_breakdown' => $typeBreakdown
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch surveys data',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get survey responses and analytics
     */
    public function getSurveyResponses(Request $request, $surveyId): JsonResponse
    {
        try {
            $survey = Survey::with(['questions.answers'])
                ->findOrFail($surveyId);

            $query = SurveyResponse::with(['user:id,email', 'answers.surveyQuestion'])
                ->where('survey_id', $surveyId)
                ->where('status', 'completed');

            // Apply filters
            if ($request->has('batch_id') && $request->batch_id) {
                $query->whereHas('user.alumniProfile', function ($q) use ($request) {
                    $q->where('batch_id', $request->batch_id);
                });
            }

            $responses = $query->get();

            // Generate analytics for each question
            $analytics = $survey->questions->map(function ($question) use ($responses) {
                $questionResponses = $responses->flatMap(function ($response) use ($question) {
                    return $response->answers->where('survey_question_id', $question->id);
                });

                $analytics = [
                    'question_id' => $question->id,
                    'question_text' => $question->question_text,
                    'question_type' => $question->question_type,
                    'total_responses' => $questionResponses->count()
                ];

                if (in_array($question->question_type, ['radio', 'checkbox', 'select'])) {
                    // For choice-based questions, count each option
                    $optionCounts = [];
                    foreach ($question->options as $option) {
                        $count = $questionResponses->where('answer_text', $option)->count();
                        $optionCounts[$option] = $count;
                    }
                    $analytics['option_counts'] = $optionCounts;
                } else {
                    // For text/number questions, provide sample responses
                    $analytics['sample_responses'] = $questionResponses
                        ->take(10)
                        ->pluck('answer_text')
                        ->filter()
                        ->values();
                }

                return $analytics;
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'survey' => $survey,
                    'total_responses' => $responses->count(),
                    'analytics' => $analytics,
                    'responses' => $request->get('include_responses', false) ? $responses : []
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch survey responses',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all batches with alumni counts
     */
    public function getBatches(Request $request): JsonResponse
    {
        try {
            $perPage = (int) $request->get('per_page', 15);
            $search = $request->get('search');
            $campusId = $request->get('campus_id');

            $query = Batch::withCount(['alumniProfiles as alumni_count'])
                ->orderBy('graduation_year', 'desc')
                ->orderBy('name');

            // Apply campus filter
            if ($campusId) {
                $query->where('campus_id', $campusId);
            }

            // Apply search filter
            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('graduation_year', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%");
                });
            }

            $batches = $query->paginate($perPage);

            // Get total alumni count across all batches (not just current page)
            $totalAlumniQuery = AlumniProfile::query();
            if ($campusId) {
                $totalAlumniQuery->where('campus_id', $campusId);
            }
            $totalAlumniCount = $totalAlumniQuery->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'data' => $batches->items(),
                    'current_page' => $batches->currentPage(),
                    'last_page' => $batches->lastPage(),
                    'per_page' => $batches->perPage(),
                    'total' => $batches->total(),
                    'from' => $batches->firstItem(),
                    'to' => $batches->lastItem(),
                    'total_alumni' => $totalAlumniCount,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch batches',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export batches data in various formats
     */
    public function exportBatches(Request $request)
    {
        $format = $request->get('format', 'csv');
        
        // Get batches with same filtering as getBatches
        $search = $request->get('search');
        $campusId = $request->get('campus_id');

        $query = Batch::withCount(['alumniProfiles as alumni_count'])
            ->orderBy('graduation_year', 'desc')
            ->orderBy('name');

        // Apply campus filter
        if ($campusId) {
            $query->where('campus_id', $campusId);
        }

        // Apply search filter
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('graduation_year', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Limit to 5000 records for performance
        $batches = $query->limit(5000)->get();

        // Export based on format
        switch ($format) {
            case 'excel':
                return $this->exportBatchesToExcel($batches);
            case 'pdf':
                return $this->exportBatchesToPdf($batches);
            case 'csv':
            default:
                return $this->exportBatchesToCsv($batches);
        }
    }

    /**
     * Export batches to CSV
     */
    private function exportBatchesToCsv($batches)
    {
        $handle = fopen('php://temp', 'w+');
        
        // CSV Headers
        fputcsv($handle, [
            'Batch ID',
            'Batch Name',
            'Graduation Year',
            'Description',
            'Status',
            'Alumni Count',
            'Created Date'
        ]);
        
        // Data rows
        foreach ($batches as $batch) {
            fputcsv($handle, [
                $batch->id,
                $batch->name,
                $batch->graduation_year,
                $batch->description,
                ucfirst($batch->status),
                $batch->alumni_count ?? 0,
                Carbon::parse($batch->created_at)->format('Y-m-d')
            ]);
        }
        
        rewind($handle);
        $csv = stream_get_contents($handle);
        fclose($handle);
        
        return response($csv, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="batches-' . date('Y-m-d') . '.csv"',
        ]);
    }

    /**
     * Export batches to Excel
     */
    private function exportBatchesToExcel($batches)
    {
        $handle = fopen('php://temp', 'w+');
        
        // Add UTF-8 BOM for Excel
        fwrite($handle, "\xEF\xBB\xBF");
        
        // CSV Headers
        fputcsv($handle, [
            'Batch ID',
            'Batch Name',
            'Graduation Year',
            'Description',
            'Status',
            'Alumni Count',
            'Created Date'
        ]);
        
        // Data rows
        foreach ($batches as $batch) {
            fputcsv($handle, [
                $batch->id,
                $batch->name,
                $batch->graduation_year,
                $batch->description,
                ucfirst($batch->status),
                $batch->alumni_count ?? 0,
                Carbon::parse($batch->created_at)->format('Y-m-d')
            ]);
        }
        
        rewind($handle);
        $csv = stream_get_contents($handle);
        fclose($handle);
        
        return response($csv, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="batches-' . date('Y-m-d') . '.xlsx"',
        ]);
    }

    /**
     * Export batches to PDF
     */
    private function exportBatchesToPdf($batches)
    {
        $html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #7c2d3f; border-bottom: 3px solid #7c2d3f; padding-bottom: 10px; }
            .header-info { margin: 15px 0; color: #666; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #7c2d3f; color: white; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
        </style></head><body>';
        
        $html .= '<h1>Batch Management Report</h1>';
        $html .= '<div class="header-info">Generated on: ' . date('Y-m-d H:i:s') . '<br>';
        $html .= 'Total Records: ' . count($batches) . '</div>';
        
        $html .= '<table><thead><tr>';
        $html .= '<th>Batch Name</th><th>Graduation Year</th><th>Alumni Count</th><th>Status</th><th>Created</th>';
        $html .= '</tr></thead><tbody>';
        
        foreach ($batches as $batch) {
            $html .= '<tr>';
            $html .= '<td>' . htmlspecialchars($batch->name) . '</td>';
            $html .= '<td>' . $batch->graduation_year . '</td>';
            $html .= '<td>' . ($batch->alumni_count ?? 0) . '</td>';
            $html .= '<td>' . ucfirst($batch->status) . '</td>';
            $html .= '<td>' . Carbon::parse($batch->created_at)->format('Y-m-d') . '</td>';
            $html .= '</tr>';
        }
        
        $html .= '</tbody></table></body></html>';
        
        return response($html, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="batches-' . date('Y-m-d') . '.pdf"',
        ]);
    }

    /**
     * Create a new batch
     */
    public function createBatch(Request $request): JsonResponse
    {
        try {
            $validatedData = $request->validate([
                'name' => 'required|string|max:255',
                'graduation_year' => 'required|integer|min:1900|max:2050',
                'description' => 'nullable|string|max:1000',
                'status' => 'required|in:active,inactive'
            ]);

            // Check if batch with same name and year already exists
            $existingBatch = Batch::where('name', $validatedData['name'])
                ->where('graduation_year', $validatedData['graduation_year'])
                ->first();

            if ($existingBatch) {
                return response()->json([
                    'success' => false,
                    'message' => 'A batch with this name and graduation year already exists'
                ], 422);
            }

            $batch = Batch::create($validatedData);

            // Load alumni count
            $batch->loadCount(['alumniProfiles as alumni_count']);

            return response()->json([
                'success' => true,
                'data' => $batch,
                'message' => 'Batch created successfully'
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create batch',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update batch
     */
    public function updateBatch(Request $request, $id): JsonResponse
    {
        try {
            $batch = Batch::findOrFail($id);

            $validatedData = $request->validate([
                'name' => 'sometimes|string|max:255',
                'graduation_year' => 'sometimes|integer|min:1900|max:2050',
                'description' => 'nullable|string|max:1000',
                'status' => 'sometimes|in:active,inactive,archived'
            ]);

            // Check for unique name/year combination if being updated
            if (isset($validatedData['name']) || isset($validatedData['graduation_year'])) {
                $name = $validatedData['name'] ?? $batch->name;
                $year = $validatedData['graduation_year'] ?? $batch->graduation_year;

                $existingBatch = Batch::where('name', $name)
                    ->where('graduation_year', $year)
                    ->where('id', '!=', $id)
                    ->first();

                if ($existingBatch) {
                    return response()->json([
                        'success' => false,
                        'message' => 'A batch with this name and graduation year already exists'
                    ], 422);
                }
            }

            $batch->update($validatedData);

            // Load alumni count
            $batch->loadCount(['alumniProfiles as alumni_count']);

            return response()->json([
                'success' => true,
                'data' => $batch,
                'message' => 'Batch updated successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update batch',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete batch
     */
    public function deleteBatch($id): JsonResponse
    {
        try {
            $batch = Batch::findOrFail($id);

            // Check if batch has any alumni profiles
            $alumniCount = $batch->alumniProfiles()->count();
            if ($alumniCount > 0) {
                return response()->json([
                    'success' => false,
                    'message' => "Cannot delete batch. It has {$alumniCount} alumni profiles associated with it."
                ], 422);
            }

            $batchName = $batch->name;
            $batch->delete();

            return response()->json([
                'success' => true,
                'message' => "Batch '{$batchName}' deleted successfully"
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete batch',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new alumni profile with user account
     */
    public function createAlumni(Request $request): JsonResponse
    {
        try {
            $validatedData = $request->validate([
                // Personal
                'first_name' => 'required|string|max:255',
                'last_name' => 'required|string|max:255',
                'maiden_name' => 'nullable|string|max:255',
                'email' => 'required|email|unique:users,email',
                'student_id' => 'nullable|string|max:50',
                'age' => 'nullable|integer|min:1|max:150',
                'gender' => 'nullable|string|in:Male,Female',
                'place_of_birth' => 'nullable|string|max:255',
                'civil_status' => 'nullable|string|in:Single,Married,Separated,Widowed',
                'spouse_name' => 'nullable|string|max:255',
                'number_of_children' => 'nullable|integer|min:0',
                'current_address' => 'nullable|string|max:1000',
                'phone' => 'nullable|string|max:20',
                'mobile_no' => 'nullable|string|max:20',

                // School
                'campus_id' => 'nullable|integer|exists:campuses,id',
                'department_id' => 'nullable|integer|exists:departments,id',
                'course_id' => 'nullable|integer|exists:courses,id',
                'degree_program' => 'nullable|string|max:255',
                'major' => 'nullable|string|max:255',
                'graduation_year' => 'nullable|integer|min:1900|max:' . (date('Y') + 10),
                'enrollment_year' => 'nullable|integer|min:1900|max:' . (date('Y') + 10),
                'honors_awards' => 'nullable|string|max:1000',

                // Employment
                'presently_employed' => 'nullable|string|in:Yes,No',
                'employment_location' => 'nullable|string|max:255',
                'not_employed_reason' => 'nullable|string|max:1000',
                'current_employer' => 'nullable|string|max:255',
                'company_address' => 'nullable|string|max:500',
                'current_job_title' => 'nullable|string|max:255',
                'date_hired' => 'nullable|date',
                'years_of_service' => 'nullable|numeric|min:0',
                'job_aligned_to_course' => 'nullable|string|in:Yes,No',
                'average_monthly_income' => 'nullable|string|max:255',
                'employment_status' => 'nullable|string|max:255',
                'job_level_position' => 'nullable|string|max:255',
                'major_line_of_business' => 'nullable|string|max:255',

                // Additional
                'achievements' => 'nullable|string|max:2000',
                'about_me' => 'nullable|string|max:2000',
                'batch_id' => 'nullable|integer|exists:batches,id',
            ]);

            DB::beginTransaction();

            // Create user account
            $user = User::create([
                'name' => $validatedData['first_name'] . ' ' . $validatedData['last_name'],
                'email' => $validatedData['email'],
                'password' => bcrypt('alumni' . date('Y')), // Default password
                'role' => 'alumni',
                'status' => 'active',
            ]);

            // Build profile data from all validated fields
            $profileFields = [
                'user_id', 'first_name', 'last_name', 'maiden_name', 'student_id',
                'gender', 'current_address', 'phone',
                'campus_id', 'department_id', 'course_id', 'degree_program', 'major',
                'graduation_year',
                'current_employer', 'company_address', 'current_job_title',
                'employment_status', 'batch_id',
            ];

            $profileData = ['user_id' => $user->id];
            foreach ($profileFields as $field) {
                if ($field === 'user_id') continue;
                if (isset($validatedData[$field])) {
                    $profileData[$field] = $validatedData[$field];
                }
            }

            // Map additional survey-style fields that go into alumni_profiles as JSON or extra columns
            $extraMappings = [
                'presently_employed', 'date_hired', 'years_of_service', 'job_aligned_to_course',
                'average_monthly_income', 'job_level_position', 'major_line_of_business',
                'achievements', 'about_me', 'honors_awards', 'enrollment_year',
                'place_of_birth', 'civil_status', 'spouse_name', 'number_of_children',
                'mobile_no', 'age', 'maiden_name',
            ];

            // Store extra survey fields in the profile's metadata or direct columns if they exist
            $alumniProfileFillable = (new AlumniProfile())->getFillable();
            foreach ($extraMappings as $field) {
                if (isset($validatedData[$field]) && in_array($field, $alumniProfileFillable)) {
                    $profileData[$field] = $validatedData[$field];
                }
            }

            // Map fields with different names between form and DB
            if (isset($validatedData['employment_location'])) {
                $profileData['employment_location_type'] = $validatedData['employment_location'];
            }
            if (isset($validatedData['not_employed_reason'])) {
                $profileData['unemployment_reason'] = $validatedData['not_employed_reason'];
            }

            $alumni = AlumniProfile::create($profileData);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Alumni profile created successfully. Default password: alumni' . date('Y'),
                'data' => $alumni->load(['user:id,email', 'batch:id,name,graduation_year'])
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to create alumni profile',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update alumni profile
     */
    public function updateAlumni(Request $request, $id): JsonResponse
    {
        try {
            $alumni = AlumniProfile::findOrFail($id);

            $validatedData = $request->validate([
                'first_name' => 'sometimes|string|max:255',
                'last_name' => 'sometimes|string|max:255',
                'phone' => 'sometimes|nullable|string|max:20',
                'degree_program' => 'sometimes|string|max:255',
                'graduation_year' => 'sometimes|integer|min:1900|max:' . (date('Y') + 10),
                'employment_status' => 'sometimes|in:employed_full_time,employed_part_time,self_employed,unemployed_seeking,unemployed_not_seeking,continuing_education,military_service,other',
                'current_employer' => 'sometimes|nullable|string|max:255',
                'current_job_title' => 'sometimes|nullable|string|max:255',
            ]);

            $alumni->update($validatedData);

            return response()->json([
                'success' => true,
                'message' => 'Alumni profile updated successfully',
                'data' => $alumni->load(['user:id,email', 'batch:id,name,graduation_year'])
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Alumni not found'
            ], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update alumni profile',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete alumni profile
     */
    public function deleteAlumni($id): JsonResponse
    {
        try {
            $alumni = AlumniProfile::with('user')->findOrFail($id);
            $alumniName = $alumni->first_name . ' ' . $alumni->last_name;
            
            // Delete the associated user account if it exists
            if ($alumni->user) {
                $alumni->user->delete();
            }
            
            // Delete the alumni profile
            $alumni->delete();

            return response()->json([
                'success' => true,
                'message' => "Alumni profile for {$alumniName} has been deleted successfully"
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Alumni not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete alumni profile',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Bulk delete alumni profiles
     */
    public function bulkDeleteAlumni(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'ids' => 'required|array|min:1',
                'ids.*' => 'integer|exists:alumni_profiles,id'
            ]);

            DB::beginTransaction();
            
            $ids = $request->input('ids');
            $count = 0;
            
            // Get alumni profiles with their associated users
            $alumniProfiles = AlumniProfile::with('user')->whereIn('id', $ids)->get();
            
            foreach ($alumniProfiles as $alumni) {
                // Delete the associated user account if it exists
                if ($alumni->user) {
                    $alumni->user->delete();
                }
                
                // Delete the alumni profile
                $alumni->delete();
                $count++;
            }
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => "{$count} alumni profile(s) deleted successfully",
                'deleted_count' => $count
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Bulk delete alumni failed: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete alumni profiles',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export alumni data to CSV, Excel, or PDF
     */
    public function exportAlumni(Request $request)
    {
        try {
            $format = $request->get('format', 'csv');
            $query = AlumniProfile::with(['user:id,email', 'batch:id,name,graduation_year']);

            // Apply same filters as getAlumni
            if ($request->has('batch_id') && $request->batch_id) {
                $query->where('batch_id', $request->batch_id);
            }

            if ($request->has('employment_status') && $request->employment_status) {
                $query->where('employment_status', $request->employment_status);
            }

            $alumni = $query->get();

            switch ($format) {
                case 'excel':
                    return $this->exportAlumniToExcel($alumni);
                case 'pdf':
                    return $this->exportAlumniToPdf($alumni);
                case 'csv':
                default:
                    return $this->exportAlumniToCsv($alumni);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to export alumni data',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function exportAlumniToCsv($alumni)
    {
        $csvData = "Name,Email,Phone,Batch,Year,Employment Status,Current Position,Company,Industry,Job Related to Degree,Job Mismatch Reason,Job Satisfaction,Registration Date\n";

        foreach ($alumni as $alumnus) {
            $csvData .= sprintf(
                "\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\"\n",
                $alumnus->full_name ?? '',
                $alumnus->user->email ?? '',
                $alumnus->phone ?? '',
                $alumnus->batch->name ?? '',
                $alumnus->batch->graduation_year ?? '',
                $alumnus->employment_status ?? '',
                $alumnus->current_job_title ?? '',
                $alumnus->current_employer ?? '',
                $alumnus->company_industry ?? '',
                $alumnus->job_related_to_degree ? 'Yes' : 'No',
                $alumnus->job_mismatch_reason ?? '',
                $alumnus->job_satisfaction ?? '',
                $alumnus->created_at->format('Y-m-d H:i:s')
            );
        }

        return response($csvData, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="alumni_export_' . date('Y-m-d_H-i-s') . '.csv"',
        ]);
    }

    private function exportAlumniToExcel($alumni)
    {
        $csvData = "\xEF\xBB\xBF"; // UTF-8 BOM for Excel
        $csvData .= "Name,Email,Phone,Batch,Year,Employment Status,Current Position,Company,Industry,Job Related to Degree,Job Mismatch Reason,Job Satisfaction,Registration Date\n";

        foreach ($alumni as $alumnus) {
            $csvData .= sprintf(
                "\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\"\n",
                $alumnus->full_name ?? '',
                $alumnus->user->email ?? '',
                $alumnus->phone ?? '',
                $alumnus->batch->name ?? '',
                $alumnus->batch->graduation_year ?? '',
                $alumnus->employment_status ?? '',
                $alumnus->current_job_title ?? '',
                $alumnus->current_employer ?? '',
                $alumnus->company_industry ?? '',
                $alumnus->job_related_to_degree ? 'Yes' : 'No',
                $alumnus->job_mismatch_reason ?? '',
                $alumnus->job_satisfaction ?? '',
                $alumnus->created_at->format('Y-m-d H:i:s')
            );
        }

        return response($csvData, 200, [
            'Content-Type' => 'application/vnd.ms-excel',
            'Content-Disposition' => 'attachment; filename="alumni_export_' . date('Y-m-d_H-i-s') . '.xlsx"',
        ]);
    }

    private function exportAlumniToPdf($alumni)
    {
        $html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Alumni Directory</title><style>
            body { font-family: Arial, sans-serif; font-size: 10px; margin: 20px; }
            h1 { font-size: 18px; margin-bottom: 10px; color: #800000; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
            th { background-color: #800000; color: white; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .header-info { margin-bottom: 15px; font-size: 11px; }
        </style></head><body>';
        
        $html .= '<h1>Alumni Directory Report</h1>';
        $html .= '<div class="header-info">Generated on: ' . date('Y-m-d H:i:s') . '<br>';
        $html .= 'Total Alumni: ' . count($alumni) . '</div>';
        
        $html .= '<table><thead><tr>';
        $html .= '<th>Name</th><th>Email</th><th>Batch</th><th>Year</th><th>Employment</th><th>Position</th><th>Company</th>';
        $html .= '</tr></thead><tbody>';
        
        foreach ($alumni as $alumnus) {
            $html .= '<tr>';
            $html .= '<td>' . htmlspecialchars($alumnus->full_name ?? '') . '</td>';
            $html .= '<td>' . htmlspecialchars($alumnus->user->email ?? '') . '</td>';
            $html .= '<td>' . htmlspecialchars($alumnus->batch->name ?? '') . '</td>';
            $html .= '<td>' . htmlspecialchars($alumnus->batch->graduation_year ?? '') . '</td>';
            $html .= '<td>' . htmlspecialchars($alumnus->employment_status ?? '') . '</td>';
            $html .= '<td>' . htmlspecialchars($alumnus->current_job_title ?? '') . '</td>';
            $html .= '<td>' . htmlspecialchars($alumnus->current_employer ?? '') . '</td>';
            $html .= '</tr>';
        }
        
        $html .= '</tbody></table></body></html>';
        
        return response($html, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="alumni_export_' . date('Y-m-d_H-i-s') . '.pdf"',
        ]);
    }

    /**
     * Export surveys list to CSV, Excel, or PDF
     */
    public function exportSurveys(Request $request)
    {
        try {
            $format = $request->get('format', 'csv');
            $query = Survey::with('questions');

            // Apply campus filter
            if ($request->has('campus_id') && $request->campus_id) {
                $query->where(function ($q) use ($request) {
                    $q->where('campus_id', $request->campus_id)
                      ->orWhere('is_multi_campus', true)
                      ->orWhereNull('campus_id');
                });
            }

            // Apply search if provided
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'like', '%' . $search . '%')
                        ->orWhere('description', 'like', '%' . $search . '%');
                });
            }

            $surveys = $query->orderBy('created_at', 'desc')->get();

            switch ($format) {
                case 'excel':
                    return $this->exportSurveysToExcel($surveys);
                case 'pdf':
                    return $this->exportSurveysToPdf($surveys);
                case 'csv':
                default:
                    return $this->exportSurveysToCsv($surveys);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to export surveys',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function exportSurveysToCsv($surveys)
    {
        $csvData = "ID,Title,Description,Status,Target Audience,Questions Count,Responses Count,Created Date,Start Date,End Date\n";

        foreach ($surveys as $survey) {
            $row = sprintf(
                '%d,"%s","%s","%s","%s",%d,%d,"%s","%s","%s"',
                $survey->id,
                str_replace('"', '""', $survey->title),
                str_replace('"', '""', $survey->description ?? ''),
                $survey->status,
                str_replace('"', '""', $survey->target_audience ?? ''),
                $survey->questions->count(),
                $survey->responses()->count(),
                $survey->created_at->format('Y-m-d H:i:s'),
                $survey->start_date ? \Carbon\Carbon::parse($survey->start_date)->format('Y-m-d') : '',
                $survey->end_date ? \Carbon\Carbon::parse($survey->end_date)->format('Y-m-d') : ''
            );
            $csvData .= $row . "\n";
        }

        return response($csvData, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="surveys_export_' . date('Y-m-d_H-i-s') . '.csv"',
        ]);
    }

    private function exportSurveysToExcel($surveys)
    {
        $csvData = "\xEF\xBB\xBF"; // UTF-8 BOM
        $csvData .= "ID,Title,Description,Status,Target Audience,Questions Count,Responses Count,Created Date,Start Date,End Date\n";

        foreach ($surveys as $survey) {
            $row = sprintf(
                '%d,"%s","%s","%s","%s",%d,%d,"%s","%s","%s"',
                $survey->id,
                str_replace('"', '""', $survey->title),
                str_replace('"', '""', $survey->description ?? ''),
                $survey->status,
                str_replace('"', '""', $survey->target_audience ?? ''),
                $survey->questions->count(),
                $survey->responses()->count(),
                $survey->created_at->format('Y-m-d H:i:s'),
                $survey->start_date ? \Carbon\Carbon::parse($survey->start_date)->format('Y-m-d') : '',
                $survey->end_date ? \Carbon\Carbon::parse($survey->end_date)->format('Y-m-d') : ''
            );
            $csvData .= $row . "\n";
        }

        return response($csvData, 200, [
            'Content-Type' => 'application/vnd.ms-excel',
            'Content-Disposition' => 'attachment; filename="surveys_export_' . date('Y-m-d_H-i-s') . '.xlsx"',
        ]);
    }

    private function exportSurveysToPdf($surveys)
    {
        $html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Surveys Report</title><style>
            body { font-family: Arial, sans-serif; font-size: 10px; margin: 20px; }
            h1 { font-size: 18px; margin-bottom: 10px; color: #800000; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
            th { background-color: #800000; color: white; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .header-info { margin-bottom: 15px; font-size: 11px; }
        </style></head><body>';
        
        $html .= '<h1>Surveys Report</h1>';
        $html .= '<div class="header-info">Generated on: ' . date('Y-m-d H:i:s') . '<br>';
        $html .= 'Total Surveys: ' . count($surveys) . '</div>';
        
        $html .= '<table><thead><tr>';
        $html .= '<th>ID</th><th>Title</th><th>Status</th><th>Questions</th><th>Responses</th><th>Created</th>';
        $html .= '</tr></thead><tbody>';
        
        foreach ($surveys as $survey) {
            $html .= '<tr>';
            $html .= '<td>' . $survey->id . '</td>';
            $html .= '<td>' . htmlspecialchars($survey->title) . '</td>';
            $html .= '<td>' . htmlspecialchars($survey->status) . '</td>';
            $html .= '<td>' . $survey->questions->count() . '</td>';
            $html .= '<td>' . $survey->responses()->count() . '</td>';
            $html .= '<td>' . $survey->created_at->format('Y-m-d') . '</td>';
            $html .= '</tr>';
        }
        
        $html .= '</tbody></table></body></html>';
        
        return response($html, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="surveys_export_' . date('Y-m-d_H-i-s') . '.pdf"',
        ]);
    }

    /**
     * Export survey responses to CSV
     */
    public function exportSurveyResponses(Request $request, $surveyId)
    {
        try {
            $survey = Survey::with('questions')->findOrFail($surveyId);

            $responses = SurveyResponse::with(['user:id,email', 'answers.surveyQuestion'])
                ->where('survey_id', $surveyId)
                ->where('status', 'completed')
                ->get();

            // Build CSV header
            $csvData = "Respondent Email,Submitted At";
            foreach ($survey->questions as $question) {
                $csvData .= ',"' . str_replace('"', '""', $question->question_text) . '"';
            }
            $csvData .= "\n";

            // Build CSV rows
            foreach ($responses as $response) {
                $row = sprintf(
                    '"%s","%s"',
                    $response->user->email ?? '',
                    $response->updated_at->format('Y-m-d H:i:s')
                );

                foreach ($survey->questions as $question) {
                    $answer = $response->answers->where('survey_question_id', $question->id)->first();
                    $answerText = $answer ? ($answer->answer_text ?? $answer->answer_number ?? $answer->answer_date ?? '') : '';
                    $row .= ',"' . str_replace('"', '""', $answerText) . '"';
                }

                $csvData .= $row . "\n";
            }

            $filename = 'survey_responses_' . preg_replace('/[^A-Za-z0-9_\-]/', '_', $survey->title) . '_' . date('Y-m-d_H-i-s') . '.csv';

            return response($csvData, 200, [
                'Content-Type' => 'text/csv',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to export survey responses',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new survey
     */
    public function createSurvey(Request $request): JsonResponse
    {
        try {
            $validator = \Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'instructions' => 'nullable|string',
                'type' => 'required|in:registration,follow_up,annual,custom',
                'status' => 'required|in:draft,active,inactive,archived',
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date|after:start_date',
                'target_batches' => 'nullable|array',
                'target_graduation_years' => 'nullable|array',
                'is_anonymous' => 'boolean',
                'allow_multiple_responses' => 'boolean',
                'require_authentication' => 'boolean',
                'is_registration_survey' => 'boolean',
                'email_subject' => 'nullable|string|max:255',
                'email_body' => 'nullable|string',
                'send_reminder_emails' => 'boolean',
                'reminder_interval_days' => 'nullable|integer|min:1|max:30',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $survey = Survey::create([
                'title' => $request->title,
                'description' => $request->description,
                'instructions' => $request->instructions,
                'type' => $request->type,
                'status' => $request->status,
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
                'target_batches' => $request->target_batches,
                'target_graduation_years' => $request->target_graduation_years,
                'is_anonymous' => $request->boolean('is_anonymous', false),
                'allow_multiple_responses' => $request->boolean('allow_multiple_responses', false),
                'require_authentication' => $request->boolean('require_authentication', true),
                'is_registration_survey' => $request->boolean('is_registration_survey', false),
                'email_subject' => $request->email_subject,
                'email_body' => $request->email_body,
                'send_reminder_emails' => $request->boolean('send_reminder_emails', false),
                'reminder_interval_days' => $request->reminder_interval_days ?? 7,
                'created_by' => $request->user()->id,
            ]);

            // Send email notifications if survey is active
            $emailInfo = '';
            if ($survey->status === 'active') {
                try {
                    $emailService = app(EmailNotificationService::class);
                    $emailResult = $emailService->sendSurveyNotificationBulk($survey);
                    
                    $emailInfo = $emailResult['success'] 
                        ? " Email invitations queued for {$emailResult['total_recipients']} alumni."
                        : '';
                } catch (\Exception $e) {
                    \Log::error('Failed to send survey emails: ' . $e->getMessage());
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Survey created successfully' . $emailInfo,
                'data' => $survey->load('creator:id,email')
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create survey',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update an existing survey
     */
    public function updateSurvey(Request $request, $id): JsonResponse
    {
        try {
            $survey = Survey::findOrFail($id);
            $wasNotActive = $survey->status !== 'active';

            $request->validate([
                'title' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string',
                'instructions' => 'nullable|string',
                'type' => 'sometimes|required|in:registration,follow_up,annual,custom',
                'status' => 'sometimes|required|in:draft,active,inactive,archived',
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date|after:start_date',
                'target_batches' => 'nullable|array',
                'target_graduation_years' => 'nullable|array',
                'is_anonymous' => 'boolean',
                'allow_multiple_responses' => 'boolean',
                'require_authentication' => 'boolean',
                'is_registration_survey' => 'boolean',
                'email_subject' => 'nullable|string|max:255',
                'email_body' => 'nullable|string',
                'send_reminder_emails' => 'boolean',
                'reminder_interval_days' => 'nullable|integer|min:1|max:30',
            ]);

            $survey->update($request->only([
                'title',
                'description',
                'instructions',
                'type',
                'status',
                'start_date',
                'end_date',
                'target_batches',
                'target_graduation_years',
                'is_anonymous',
                'allow_multiple_responses',
                'require_authentication',
                'is_registration_survey',
                'email_subject',
                'email_body',
                'send_reminder_emails',
                'reminder_interval_days'
            ]));

            // Send email notifications if survey was just activated
            $emailInfo = '';
            if ($wasNotActive && $survey->status === 'active') {
                try {
                    $emailService = app(EmailNotificationService::class);
                    $emailResult = $emailService->sendSurveyNotificationBulk($survey);
                    
                    $emailInfo = $emailResult['success'] 
                        ? " Email invitations queued for {$emailResult['total_recipients']} alumni."
                        : '';
                } catch (\Exception $e) {
                    \Log::error('Failed to send survey emails: ' . $e->getMessage());
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Survey updated successfully' . $emailInfo,
                'data' => $survey->load('creator:id,email')
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update survey',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a survey
     */
    public function deleteSurvey($id): JsonResponse
    {
        try {
            $survey = Survey::findOrFail($id);

            // Check if survey has responses
            $hasResponses = $survey->responses()->exists();
            if ($hasResponses) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete survey with existing responses'
                ], 400);
            }

            $survey->delete();

            return response()->json([
                'success' => true,
                'message' => 'Survey deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete survey',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get survey details with questions
     */
    public function getSurveyDetails($id): JsonResponse
    {
        try {
            $survey = Survey::with([
                'creator:id,email',
                'questions' => function ($query) {
                    $query->orderBy('order')->orderBy('id');
                }
            ])->findOrFail($id);

            // Add response statistics
            $totalResponses = $survey->responses()->count();
            $completedResponses = $survey->responses()->where('status', 'completed')->count();
            $inProgressResponses = $survey->responses()->where('status', 'in_progress')->count();

            $survey->statistics = [
                'total_responses' => $totalResponses,
                'completed_responses' => $completedResponses,
                'in_progress_responses' => $inProgressResponses,
                'completion_rate' => $totalResponses > 0 ? round(($completedResponses / $totalResponses) * 100, 2) : 0
            ];

            return response()->json([
                'success' => true,
                'data' => $survey
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Survey not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Create a new survey question
     */
    public function createSurveyQuestion(Request $request, $surveyId): JsonResponse
    {
        try {
            $survey = Survey::findOrFail($surveyId);

            $request->validate([
                'question_text' => 'required|string',
                'description' => 'nullable|string',
                'question_type' => 'required|in:text,textarea,email,phone,number,date,single_choice,multiple_choice,dropdown,checkbox,rating,matrix,file_upload,boolean',
                'options' => 'nullable|array',
                'validation_rules' => 'nullable|array',
                'is_required' => 'boolean',
                'order' => 'nullable|integer',
                'conditional_logic' => 'nullable|array',
                'matrix_rows' => 'nullable|array',
                'matrix_columns' => 'nullable|array',
                'rating_min' => 'nullable|integer',
                'rating_max' => 'nullable|integer',
                'rating_min_label' => 'nullable|string',
                'rating_max_label' => 'nullable|string',
                'placeholder' => 'nullable|string',
                'help_text' => 'nullable|string',
            ]);

            // Auto-assign order if not provided
            if (!$request->has('order')) {
                $maxOrder = $survey->questions()->max('order') ?? 0;
                $request->merge(['order' => $maxOrder + 1]);
            }

            $question = $survey->questions()->create([
                'question_text' => $request->question_text,
                'description' => $request->description,
                'question_type' => $request->question_type,
                'options' => $request->options,
                'validation_rules' => $request->validation_rules,
                'is_required' => $request->boolean('is_required', false),
                'order' => $request->order,
                'conditional_logic' => $request->conditional_logic,
                'matrix_rows' => $request->matrix_rows,
                'matrix_columns' => $request->matrix_columns,
                'rating_min' => $request->rating_min,
                'rating_max' => $request->rating_max,
                'rating_min_label' => $request->rating_min_label,
                'rating_max_label' => $request->rating_max_label,
                'placeholder' => $request->placeholder,
                'help_text' => $request->help_text,
                'is_active' => true,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Question created successfully',
                'data' => $question
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create question',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update a survey question
     */
    public function updateSurveyQuestion(Request $request, $surveyId, $questionId): JsonResponse
    {
        try {
            $survey = Survey::findOrFail($surveyId);
            $question = $survey->questions()->findOrFail($questionId);

            $request->validate([
                'question_text' => 'sometimes|required|string',
                'description' => 'nullable|string',
                'question_type' => 'sometimes|required|in:text,textarea,email,phone,number,date,single_choice,multiple_choice,dropdown,checkbox,rating,matrix,file_upload,boolean',
                'options' => 'nullable|array',
                'validation_rules' => 'nullable|array',
                'is_required' => 'boolean',
                'order' => 'nullable|integer',
                'is_active' => 'boolean',
                'conditional_logic' => 'nullable|array',
                'matrix_rows' => 'nullable|array',
                'matrix_columns' => 'nullable|array',
                'rating_min' => 'nullable|integer',
                'rating_max' => 'nullable|integer',
                'rating_min_label' => 'nullable|string',
                'rating_max_label' => 'nullable|string',
                'placeholder' => 'nullable|string',
                'help_text' => 'nullable|string',
            ]);

            $question->update($request->only([
                'question_text',
                'description',
                'question_type',
                'options',
                'validation_rules',
                'is_required',
                'order',
                'is_active',
                'conditional_logic',
                'matrix_rows',
                'matrix_columns',
                'rating_min',
                'rating_max',
                'rating_min_label',
                'rating_max_label',
                'placeholder',
                'help_text'
            ]));

            return response()->json([
                'success' => true,
                'message' => 'Question updated successfully',
                'data' => $question
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update question',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a survey question
     */
    public function deleteSurveyQuestion($surveyId, $questionId): JsonResponse
    {
        try {
            $survey = Survey::findOrFail($surveyId);
            $question = $survey->questions()->findOrFail($questionId);

            // Check if question has answers
            $hasAnswers = $question->answers()->exists();
            if ($hasAnswers) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete question with existing answers'
                ], 400);
            }

            $question->delete();

            return response()->json([
                'success' => true,
                'message' => 'Question deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete question',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reorder survey questions
     */
    public function reorderSurveyQuestions(Request $request, $surveyId): JsonResponse
    {
        try {
            $survey = Survey::findOrFail($surveyId);

            $request->validate([
                'questions' => 'required|array',
                'questions.*.id' => 'required|integer|exists:survey_questions,id',
                'questions.*.order' => 'required|integer',
            ]);

            foreach ($request->questions as $questionData) {
                $survey->questions()
                    ->where('id', $questionData['id'])
                    ->update(['order' => $questionData['order']]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Questions reordered successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to reorder questions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Duplicate a survey
     */
    public function duplicateSurvey($id): JsonResponse
    {
        try {
            $originalSurvey = Survey::with('questions')->findOrFail($id);

            $newSurvey = $originalSurvey->replicate();
            $newSurvey->title = $originalSurvey->title . ' (Copy)';
            $newSurvey->status = 'draft';
            $newSurvey->created_by = request()->user()->id;
            $newSurvey->save();

            // Duplicate questions
            foreach ($originalSurvey->questions as $question) {
                $newQuestion = $question->replicate();
                $newQuestion->survey_id = $newSurvey->id;
                $newQuestion->save();
            }

            return response()->json([
                'success' => true,
                'message' => 'Survey duplicated successfully',
                'data' => $newSurvey->load(['creator:id,email', 'questions'])
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to duplicate survey',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get activity logs with pagination and filtering
     */
    public function getActivityLogs(Request $request): JsonResponse
    {
        try {
            $perPage = (int) $request->get('per_page', 20);
            $page = (int) $request->get('page', 1);
            $search = $request->get('search');
            $action = $request->get('action');
            $userId = $request->get('user_id');
            $dateFilter = $request->get('date_filter');

            $query = ActivityLog::with('user:id,name,email')
                ->orderBy('created_at', 'desc');

            // Apply search filter
            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('description', 'like', "%{$search}%")
                      ->orWhere('action', 'like', "%{$search}%")
                      ->orWhere('entity_type', 'like', "%{$search}%")
                      ->orWhereHas('user', function ($userQuery) use ($search) {
                          $userQuery->where('name', 'like', "%{$search}%")
                                   ->orWhere('email', 'like', "%{$search}%");
                      });
                });
            }

            // Apply action filter
            if ($action && $action !== 'all') {
                $query->where('action', $action);
            }

            // Apply user filter
            if ($userId && $userId !== 'all') {
                if ($userId === 'admin') {
                    $adminUserIds = User::where('role', 'admin')->pluck('id');
                    $query->whereIn('user_id', $adminUserIds);
                } elseif ($userId === 'alumni') {
                    $alumniUserIds = User::where('role', 'alumni')->pluck('id');
                    $query->whereIn('user_id', $alumniUserIds);
                } else {
                    $query->where('user_id', $userId);
                }
            }

            // Apply date filter
            if ($dateFilter && $dateFilter !== 'all') {
                $now = Carbon::now();
                switch ($dateFilter) {
                    case 'today':
                        $query->whereDate('created_at', $now->toDateString());
                        break;
                    case 'week':
                        $query->whereBetween('created_at', [$now->startOfWeek(), $now->endOfWeek()]);
                        break;
                    case 'month':
                        $query->whereMonth('created_at', $now->month)
                              ->whereYear('created_at', $now->year);
                        break;
                    case 'year':
                        $query->whereYear('created_at', $now->year);
                        break;
                }
            }

            $activities = $query->paginate($perPage, ['*'], 'page', $page);

            // Server-side stats (accurate, not page-limited)
            $statsQuery = ActivityLog::query();
            $todayStr = Carbon::today()->toDateString();

            $stats = [
                'total' => ActivityLog::count(),
                'today' => ActivityLog::whereDate('created_at', $todayStr)->count(),
                'crud_operations' => ActivityLog::whereIn('action', ['create', 'update', 'delete'])->count(),
                'unique_users' => ActivityLog::whereNotNull('user_id')->distinct('user_id')->count('user_id'),
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'data' => $activities->items(),
                    'current_page' => $activities->currentPage(),
                    'last_page' => $activities->lastPage(),
                    'per_page' => $activities->perPage(),
                    'total' => $activities->total(),
                ],
                'stats' => $stats,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch activity logs',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export activity logs to CSV, Excel, or PDF
     */
    public function exportActivityLogs(Request $request)
    {
        try {
            $format = $request->get('format', 'csv');
            $search = $request->get('search');
            $action = $request->get('action');
            $userId = $request->get('user_id');
            $dateFilter = $request->get('date_filter');

            $query = ActivityLog::with('user:id,name,email')
                ->orderBy('created_at', 'desc');

            // Apply same filters as getActivityLogs
            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('description', 'like', "%{$search}%")
                      ->orWhere('action', 'like', "%{$search}%")
                      ->orWhere('entity_type', 'like', "%{$search}%")
                      ->orWhereHas('user', function ($userQuery) use ($search) {
                          $userQuery->where('name', 'like', "%{$search}%")
                                   ->orWhere('email', 'like', "%{$search}%");
                      });
                });
            }

            if ($action && $action !== 'all') {
                $query->where('action', $action);
            }

            if ($userId && $userId !== 'all') {
                if ($userId === 'admin') {
                    $adminUserIds = User::where('role', 'admin')->pluck('id');
                    $query->whereIn('user_id', $adminUserIds);
                } elseif ($userId === 'alumni') {
                    $alumniUserIds = User::where('role', 'alumni')->pluck('id');
                    $query->whereIn('user_id', $alumniUserIds);
                } else {
                    $query->where('user_id', $userId);
                }
            }

            if ($dateFilter && $dateFilter !== 'all') {
                $now = Carbon::now();
                switch ($dateFilter) {
                    case 'today':
                        $query->whereDate('created_at', $now->toDateString());
                        break;
                    case 'week':
                        $query->whereBetween('created_at', [$now->startOfWeek(), $now->endOfWeek()]);
                        break;
                    case 'month':
                        $query->whereMonth('created_at', $now->month)
                              ->whereYear('created_at', $now->year);
                        break;
                    case 'year':
                        $query->whereYear('created_at', $now->year);
                        break;
                }
            }

            $activities = $query->limit(5000)->get(); // Limit for performance

            switch ($format) {
                case 'excel':
                    return $this->exportActivityLogsToExcel($activities);
                case 'pdf':
                    return $this->exportActivityLogsToPdf($activities);
                case 'csv':
                default:
                    return $this->exportActivityLogsToCsv($activities);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to export activity logs',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function exportActivityLogsToCsv($activities)
    {
        $csvData = "Timestamp,User,Email,Action,Entity Type,Entity ID,Description,IP Address\n";
        
        foreach ($activities as $activity) {
            $csvData .= sprintf(
                "%s,%s,%s,%s,%s,%s,\"%s\",%s\n",
                $activity->created_at->format('Y-m-d H:i:s'),
                $activity->user ? $activity->user->name : 'Unknown',
                $activity->user ? $activity->user->email : '',
                $activity->action,
                $activity->entity_type ?: '',
                $activity->entity_id ?: '',
                str_replace('"', '""', $activity->description),
                $activity->ip_address ?: ''
            );
        }

        return response($csvData, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="activity-logs-' . date('Y-m-d') . '.csv"',
        ]);
    }

    private function exportActivityLogsToExcel($activities)
    {
        // Excel format (using CSV with proper Excel headers)
        $csvData = "\xEF\xBB\xBF"; // UTF-8 BOM for Excel
        $csvData .= "Timestamp,User,Email,Action,Entity Type,Entity ID,Description,IP Address\n";
        
        foreach ($activities as $activity) {
            $csvData .= sprintf(
                "%s,%s,%s,%s,%s,%s,\"%s\",%s\n",
                $activity->created_at->format('Y-m-d H:i:s'),
                $activity->user ? $activity->user->name : 'Unknown',
                $activity->user ? $activity->user->email : '',
                $activity->action,
                $activity->entity_type ?: '',
                $activity->entity_id ?: '',
                str_replace('"', '""', $activity->description),
                $activity->ip_address ?: ''
            );
        }

        return response($csvData, 200, [
            'Content-Type' => 'application/vnd.ms-excel',
            'Content-Disposition' => 'attachment; filename="activity-logs-' . date('Y-m-d') . '.xlsx"',
        ]);
    }

    private function exportActivityLogsToPdf($activities)
    {
        $html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Activity Logs</title><style>
            body { font-family: Arial, sans-serif; font-size: 10px; margin: 20px; }
            h1 { font-size: 18px; margin-bottom: 10px; color: #800000; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
            th { background-color: #800000; color: white; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .header-info { margin-bottom: 15px; font-size: 11px; }
        </style></head><body>';
        
        $html .= '<h1>Activity Logs Report</h1>';
        $html .= '<div class="header-info">Generated on: ' . date('Y-m-d H:i:s') . '<br>';
        $html .= 'Total Records: ' . count($activities) . '</div>';
        
        $html .= '<table><thead><tr>';
        $html .= '<th>Timestamp</th><th>User</th><th>Action</th><th>Entity</th><th>Description</th><th>IP Address</th>';
        $html .= '</tr></thead><tbody>';
        
        foreach ($activities as $activity) {
            $html .= '<tr>';
            $html .= '<td>' . $activity->created_at->format('Y-m-d H:i:s') . '</td>';
            $html .= '<td>' . htmlspecialchars($activity->user ? $activity->user->name : 'Unknown') . '</td>';
            $html .= '<td>' . htmlspecialchars($activity->action) . '</td>';
            $html .= '<td>' . htmlspecialchars($activity->entity_type ?: '') . '</td>';
            $html .= '<td>' . htmlspecialchars(substr($activity->description, 0, 100)) . '</td>';
            $html .= '<td>' . htmlspecialchars($activity->ip_address ?: '') . '</td>';
            $html .= '</tr>';
        }
        
        $html .= '</tbody></table></body></html>';
        
        return response($html, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="activity-logs-' . date('Y-m-d') . '.pdf"',
        ]);
    }

    /**
     * Export users data in various formats
     */
    public function exportUsers(Request $request)
    {
        $format = $request->get('format', 'csv');
        
        // Get users with same filtering as getUsers
        $currentUser = auth()->user();
        $query = User::with(['alumniProfile:id,user_id,first_name,last_name,phone', 'campus:id,name,code']);

        // Restrict admin users to super_admin only
        if ($currentUser->role !== 'super_admin') {
            $query->where('role', '!=', 'admin');
        }

        // Apply filters
        if ($request->has('campus_id') && $request->campus_id) {
            $query->where('campus_id', $request->campus_id);
        }

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('email', 'like', "%{$search}%")
                  ->orWhere('name', 'like', "%{$search}%")
                  ->orWhereHas('alumniProfile', function($profileQuery) use ($search) {
                      $profileQuery->where('first_name', 'like', "%{$search}%")
                                  ->orWhere('last_name', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->has('role') && $request->role !== 'all') {
            $query->where('role', $request->role);
        }

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Apply sorting
        if ($request->has('sort') && $request->sort) {
            $sort = $request->sort;
            switch ($sort) {
                case 'name_asc':
                    $query->orderBy('name', 'asc');
                    break;
                case 'name_desc':
                    $query->orderBy('name', 'desc');
                    break;
                case 'last_login':
                    $query->orderBy('last_login_at', 'desc')->orderBy('created_at', 'desc');
                    break;
                case 'recent':
                default:
                    $query->orderBy('created_at', 'desc');
                    break;
            }
        } else {
            $query->orderBy('created_at', 'desc');
        }

        // Limit to 5000 records for performance
        $users = $query->limit(5000)->get();

        // Export based on format
        switch ($format) {
            case 'excel':
                return $this->exportUsersToExcel($users);
            case 'pdf':
                return $this->exportUsersToPdf($users);
            case 'csv':
            default:
                return $this->exportUsersToCsv($users);
        }
    }

    /**
     * Export users to CSV
     */
    private function exportUsersToCsv($users)
    {
        $handle = fopen('php://temp', 'w+');
        
        // CSV Headers
        fputcsv($handle, [
            'Name',
            'Email',
            'Role',
            'Status',
            'Campus',
            'Phone',
            'Email Verified',
            'Last Login',
            'Registration Date'
        ]);
        
        // Data rows
        foreach ($users as $user) {
            fputcsv($handle, [
                $user->name ?: $user->email,
                $user->email,
                ucfirst($user->role),
                ucfirst($user->status),
                $user->campus ? $user->campus->name : 'N/A',
                $user->alumniProfile ? $user->alumniProfile->phone : 'N/A',
                $user->email_verified_at ? 'Yes' : 'No',
                $user->last_login_at ? Carbon::parse($user->last_login_at)->format('Y-m-d H:i') : 'Never',
                Carbon::parse($user->created_at)->format('Y-m-d')
            ]);
        }
        
        rewind($handle);
        $csv = stream_get_contents($handle);
        fclose($handle);
        
        return response($csv, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="users-' . date('Y-m-d') . '.csv"',
        ]);
    }

    /**
     * Export users to Excel
     */
    private function exportUsersToExcel($users)
    {
        $handle = fopen('php://temp', 'w+');
        
        // Add UTF-8 BOM for Excel
        fwrite($handle, "\xEF\xBB\xBF");
        
        // CSV Headers
        fputcsv($handle, [
            'Name',
            'Email',
            'Role',
            'Status',
            'Campus',
            'Phone',
            'Email Verified',
            'Last Login',
            'Registration Date'
        ]);
        
        // Data rows
        foreach ($users as $user) {
            fputcsv($handle, [
                $user->name ?: $user->email,
                $user->email,
                ucfirst($user->role),
                ucfirst($user->status),
                $user->campus ? $user->campus->name : 'N/A',
                $user->alumniProfile ? $user->alumniProfile->phone : 'N/A',
                $user->email_verified_at ? 'Yes' : 'No',
                $user->last_login_at ? Carbon::parse($user->last_login_at)->format('Y-m-d H:i') : 'Never',
                Carbon::parse($user->created_at)->format('Y-m-d')
            ]);
        }
        
        rewind($handle);
        $csv = stream_get_contents($handle);
        fclose($handle);
        
        return response($csv, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="users-' . date('Y-m-d') . '.xlsx"',
        ]);
    }

    /**
     * Export users to PDF
     */
    private function exportUsersToPdf($users)
    {
        $html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #7c2d3f; border-bottom: 3px solid #7c2d3f; padding-bottom: 10px; }
            .header-info { margin: 15px 0; color: #666; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #7c2d3f; color: white; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
        </style></head><body>';
        
        $html .= '<h1>User Management Report</h1>';
        $html .= '<div class="header-info">Generated on: ' . date('Y-m-d H:i:s') . '<br>';
        $html .= 'Total Records: ' . count($users) . '</div>';
        
        $html .= '<table><thead><tr>';
        $html .= '<th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Campus</th><th>Last Login</th>';
        $html .= '</tr></thead><tbody>';
        
        foreach ($users as $user) {
            $html .= '<tr>';
            $html .= '<td>' . htmlspecialchars($user->name ?: $user->email) . '</td>';
            $html .= '<td>' . htmlspecialchars($user->email) . '</td>';
            $html .= '<td>' . ucfirst($user->role) . '</td>';
            $html .= '<td>' . ucfirst($user->status) . '</td>';
            $html .= '<td>' . htmlspecialchars($user->campus ? $user->campus->name : 'N/A') . '</td>';
            $html .= '<td>' . ($user->last_login_at ? Carbon::parse($user->last_login_at)->format('Y-m-d H:i') : 'Never') . '</td>';
            $html .= '</tr>';
        }
        
        $html .= '</tbody></table></body></html>';
        
        return response($html, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="users-' . date('Y-m-d') . '.pdf"',
        ]);
    }

    /**
     * Get users for admin management
     */
    public function getUsers(Request $request): JsonResponse
    {
        try {
            $currentUser = auth()->user();
            
            $query = User::with(['alumniProfile:id,user_id,first_name,last_name,phone', 'campus:id,name,code']);

            // Restrict admin users to super_admin only
            if ($currentUser->role !== 'super_admin') {
                $query->where('role', '!=', 'admin');
            }

            // Campus filter
            if ($request->has('campus_id') && $request->campus_id) {
                $query->where('campus_id', $request->campus_id);
            }

            // Search filter
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('email', 'like', "%{$search}%")
                      ->orWhere('name', 'like', "%{$search}%")
                      ->orWhereHas('alumniProfile', function($profileQuery) use ($search) {
                          $profileQuery->where('first_name', 'like', "%{$search}%")
                                      ->orWhere('last_name', 'like', "%{$search}%");
                      });
                });
            }

            // Role filter
            if ($request->has('role') && $request->role !== 'all') {
                $query->where('role', $request->role);
            }

            // Status filter
            if ($request->has('status') && $request->status !== 'all') {
                $query->where('status', $request->status);
            }

            // Sorting options - handle new sort parameter format
            if ($request->has('sort') && $request->sort) {
                $sort = $request->sort;
                switch ($sort) {
                    case 'name_asc':
                        $query->orderBy('name', 'asc');
                        break;
                    case 'name_desc':
                        $query->orderBy('name', 'desc');
                        break;
                    case 'last_login':
                        $query->orderBy('last_login_at', 'desc')->orderBy('created_at', 'desc');
                        break;
                    case 'recent':
                    default:
                        $query->orderBy('created_at', 'desc');
                        break;
                }
            } else {
                $query->orderBy('created_at', 'desc');
            }

            // Pagination
            $perPage = $request->get('per_page', 15);
            $users = $query->paginate($perPage);

            // Transform data for frontend compatibility
            $users->getCollection()->transform(function ($user) {
                // Ensure name field exists (use email as fallback)
                if (!$user->name) {
                    $user->name = $user->email;
                }
                
                // Map alumniProfile to profile for frontend
                if ($user->alumniProfile) {
                    $user->profile = $user->alumniProfile;
                }
                
                // Remove alumniProfile to avoid confusion
                unset($user->alumniProfile);
                
                return $user;
            });
            
            return response()->json([
                'success' => true,
                'data' => $users
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch users',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update user information
     */
    public function updateUser(Request $request, $id): JsonResponse
    {
        try {
            $user = User::findOrFail($id);
            $currentUser = auth()->user();

            // Only super_admin can update admin users
            if ($user->role === 'admin' && $currentUser->role !== 'super_admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only super admin can update admin users'
                ], 403);
            }

            $validated = $request->validate([
                'name' => 'sometimes|string|max:255',
                'email' => 'sometimes|email|unique:users,email,' . $id,
                'role' => 'sometimes|in:admin,alumni',
                'status' => 'sometimes|in:active,inactive,pending',
            ]);

            $user->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'User updated successfully',
                'data' => $user
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update user',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update user status
     */
    public function updateUserStatus(Request $request, $id): JsonResponse
    {
        try {
            $user = User::findOrFail($id);
            $currentUser = auth()->user();

            // Only super_admin can update admin users
            if ($user->role === 'admin' && $currentUser->role !== 'super_admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only super admin can update admin users'
                ], 403);
            }

            $validated = $request->validate([
                'status' => 'required|in:active,inactive,pending',
            ]);

            $user->update(['status' => $validated['status']]);

            return response()->json([
                'success' => true,
                'message' => 'User status updated successfully',
                'data' => $user
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update user status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete user
     */
    public function deleteUser($id): JsonResponse
    {
        try {
            $user = User::findOrFail($id);
            $currentUser = auth()->user();
            
            // Only super_admin can delete admin users
            if ($user->role === 'admin' && $currentUser->role !== 'super_admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only super admin can delete admin users'
                ], 403);
            }
            
            // Prevent deleting yourself
            if ($user->id === auth()->id()) {
                return response()->json([
                    'success' => false,
                    'message' => 'You cannot delete your own account'
                ], 403);
            }

            $user->delete();

            return response()->json([
                'success' => true,
                'message' => 'User deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete user',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reset user password
     */
    public function resetUserPassword($id): JsonResponse
    {
        try {
            $user = User::findOrFail($id);
            $currentUser = auth()->user();
            
            // Only super_admin can reset password for admin users
            if ($user->role === 'admin' && $currentUser->role !== 'super_admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only super admin can reset password for admin users'
                ], 403);
            }
            
            // Generate password reset token
            $token = app('auth.password.broker')->createToken($user);
            
            // Send password reset email
            $user->sendPasswordResetNotification($token);

            return response()->json([
                'success' => true,
                'message' => 'Password reset email sent to ' . $user->email
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to send password reset email',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Set user password manually (admin feature)
     */
    public function setUserPassword(Request $request, $id): JsonResponse
    {
        try {
            $user = User::findOrFail($id);
            $currentUser = auth()->user();
            
            // Only super_admin can set password for admin/super_admin users
            if (in_array($user->role, ['admin', 'super_admin']) && $currentUser->role !== 'super_admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only super admin can change password for admin users'
                ], 403);
            }
            
            // Cannot change own password through this endpoint
            if ($user->id === $currentUser->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Use your profile settings to change your own password'
                ], 403);
            }
            
            $validated = $request->validate([
                'password' => 'required|string|min:8|confirmed',
            ]);
            
            $user->update([
                'password' => \Hash::make($validated['password'])
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Password updated successfully for ' . $user->name
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update password',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new user
     */
    public function createUser(Request $request): JsonResponse
    {
        try {
            $currentUser = auth()->user();
            
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email',
                'password' => 'required|string|min:8',
                'role' => 'required|in:admin,alumni',
                'status' => 'required|in:active,inactive,pending',
            ]);

            // Only super_admin can create admin users
            if ($validated['role'] === 'admin' && $currentUser->role !== 'super_admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only super admin can create admin users'
                ], 403);
            }

            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => bcrypt($validated['password']),
                'role' => $validated['role'],
                'status' => $validated['status'],
            ]);

            return response()->json([
                'success' => true,
                'message' => 'User created successfully',
                'data' => $user
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create user',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get permissions data
     */
    public function getPermissions(Request $request): JsonResponse
    {
        try {
            $permissions = \App\Models\Permission::select(
                'id',
                'name',
                'display_name',
                'description',
                'category'
            )
            ->withCount(['users' => function ($query) {
                // Count users with this permission through roles or direct assignment
                $query->where('is_granted', true);
            }])
            ->orderBy('category')
            ->orderBy('display_name')
            ->get();

            // Add user count to each permission
            $permissionsWithCount = $permissions->map(function ($permission) {
                return [
                    'id' => $permission->id,
                    'name' => $permission->name,
                    'display_name' => $permission->display_name,
                    'description' => $permission->description,
                    'category' => $permission->category,
                    'user_count' => $permission->getAllUsersWithPermission()->count(),
                    'created_at' => $permission->created_at?->toISOString(),
                    'updated_at' => $permission->updated_at?->toISOString()
                ];
            });
            
            return response()->json([
                'success' => true,
                'data' => $permissionsWithCount
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch permissions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get users with a specific permission
     */
    public function getPermissionUsers(Request $request, $id): JsonResponse
    {
        try {
            $permission = \App\Models\Permission::findOrFail($id);
            $users = $permission->getAllUsersWithPermission();

            $usersData = $users->map(function ($user) use ($permission) {
                // Determine access source
                $accessSource = 'role'; // default

                // Check if user has custom permission
                $customPermission = $user->customPermissions()
                    ->where('permission_id', $permission->id)
                    ->first();

                if ($customPermission) {
                    $accessSource = $customPermission->pivot->is_granted ? 'custom_grant' : 'custom_deny';
                }

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role_id' => $user->role_id,
                    'role_name' => $user->assignedRole?->name,
                    'role_display_name' => $user->assignedRole?->display_name,
                    'access_source' => $accessSource
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $usersData
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch users with permission',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get roles data
     */
    public function getRoles(Request $request): JsonResponse
    {
        try {
            $roles = \App\Models\Role::with('permissions:id,name,display_name')
                ->withCount('users')
                ->get()
                ->map(function ($role) {
                    return [
                        'id' => $role->id,
                        'name' => $role->name,
                        'display_name' => $role->display_name,
                        'description' => $role->description,
                        'is_system_role' => $role->is_system_role,
                        'is_active' => $role->is_active ?? true,
                        'users_count' => $role->users_count,
                        'permissions' => $role->permissions->pluck('id')->toArray(),
                        'permissions_details' => $role->permissions->map(function ($perm) {
                            return [
                                'id' => $perm->id,
                                'name' => $perm->name,
                                'display_name' => $perm->display_name
                            ];
                        }),
                        'created_at' => $role->created_at?->toISOString(),
                        'updated_at' => $role->updated_at?->toISOString()
                    ];
                });
            
            return response()->json([
                'success' => true,
                'data' => $roles
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch roles',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update role permissions
     */
    public function updateRolePermissions(Request $request, $id): JsonResponse
    {
        try {
            $role = \App\Models\Role::findOrFail($id);

            // Prevent modifying super admin permissions
            if ($role->is_system_role && $role->name === 'super_admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Super Admin permissions cannot be modified'
                ], 403);
            }

            $validated = $request->validate([
                'permission_ids' => 'required|array',
                'permission_ids.*' => 'exists:permissions,id'
            ]);

            $role->syncPermissions($validated['permission_ids']);

            return response()->json([
                'success' => true,
                'message' => 'Permissions updated successfully',
                'data' => [
                    'id' => $role->id,
                    'name' => $role->name,
                    'display_name' => $role->display_name,
                    'permissions' => $role->permissions->pluck('id')->toArray()
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update permissions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Give a custom permission to a user
     */
    public function giveUserPermission(Request $request, $id): JsonResponse
    {
        try {
            $user = \App\Models\User::findOrFail($id);

            $validated = $request->validate([
                'permission_id' => 'required|exists:permissions,id',
                'is_granted' => 'required|boolean'
            ]);

            if ($validated['is_granted']) {
                $user->givePermission($validated['permission_id']);
            } else {
                $user->denyPermission($validated['permission_id']);
            }

            return response()->json([
                'success' => true,
                'message' => $validated['is_granted'] ? 'Permission granted' : 'Permission denied',
                'data' => [
                    'user_id' => $user->id,
                    'permission_id' => $validated['permission_id'],
                    'is_granted' => $validated['is_granted']
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update user permission',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Revoke a custom permission from a user
     */
    public function revokeUserPermission(Request $request, $id, $permissionId): JsonResponse
    {
        try {
            $user = \App\Models\User::findOrFail($id);
            $user->revokePermission($permissionId);

            return response()->json([
                'success' => true,
                'message' => 'Permission revoked successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to revoke permission',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get users with their roles
     */
    public function getUsersWithRoles(Request $request): JsonResponse
    {
        try {
            $users = User::select('id', 'name', 'email', 'role', 'status', 'created_at')
                ->orderBy('created_at', 'desc')
                ->limit(50)
                ->get()
                ->map(function ($user) {
                    return [
                        'id' => (string) $user->id,
                        'name' => $user->name ?: $user->email,
                        'email' => $user->email,
                        'roles' => [
                            [
                                'id' => $user->role,
                                'name' => $user->role,
                                'display_name' => ucfirst(str_replace('_', ' ', $user->role))
                            ]
                        ],
                        'permissions' => [],
                        'last_login_at' => null, // Column doesn't exist in database yet
                        'is_active' => $user->status === 'active',
                        'created_at' => $user->created_at->toISOString()
                    ];
                });
            
            return response()->json([
                'success' => true,
                'data' => $users
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch users with roles',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get permissions statistics
     */
    public function getPermissionsStats(Request $request): JsonResponse
    {
        try {
            $totalUsers = User::count();
            $totalRoles = \App\Models\Role::count();
            $totalPermissions = \App\Models\Permission::count();

            // Determine most used role from the enum column
            $roleCounts = User::selectRaw('role, COUNT(*) as cnt')
                ->groupBy('role')
                ->orderByDesc('cnt')
                ->first();
            $mostUsedRole = $roleCounts ? ucfirst(str_replace('_', ' ', $roleCounts->role)) : 'N/A';

            // Real permission categories
            $permissionCategories = \App\Models\Permission::selectRaw('category, COUNT(*) as count')
                ->groupBy('category')
                ->orderBy('category')
                ->get()
                ->map(fn($row) => ['name' => $row->category, 'count' => $row->count])
                ->toArray();

            $stats = [
                'total_roles' => $totalRoles,
                'total_permissions' => $totalPermissions,
                'total_users_with_roles' => $totalUsers,
                'most_used_role' => $mostUsedRole,
                'permission_categories' => $permissionCategories,
            ];
            
            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch permissions stats',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get email templates
     */
    public function getEmailTemplates(Request $request): JsonResponse
    {
        try {
            $query = EmailTemplate::with('creator:id,email');

            // Apply filters
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('subject', 'like', "%{$search}%")
                      ->orWhere('body', 'like', "%{$search}%")
                      ->orWhere('category', 'like', "%{$search}%");
                });
            }

            if ($request->has('category') && $request->category) {
                $query->where('category', $request->category);
            }

            if ($request->has('type') && $request->type) {
                $query->where('type', $request->type);
            }

            if ($request->has('status') && $request->status) {
                $query->where('status', $request->status);
            }

            // Sort by most recently updated
            $templates = $query->orderBy('updated_at', 'desc')->get();

            // Format response
            $formattedTemplates = $templates->map(function ($template) {
                return [
                    'id' => (string) $template->id,
                    'name' => $template->name,
                    'subject' => $template->subject,
                    'body' => $template->body,
                    'category' => $template->category,
                    'type' => $template->type,
                    'status' => $template->status,
                    'variables' => $template->variables ?? [],
                    'usage_count' => $template->usage_count,
                    'last_sent_at' => $template->last_sent_at?->toISOString(),
                    'created_by' => $template->creator->email ?? 'Unknown',
                    'created_at' => $template->created_at->toISOString(),
                    'updated_at' => $template->updated_at->toISOString(),
                ];
            });
            
            return response()->json([
                'success' => true,
                'data' => $formattedTemplates
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch email templates',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get email template statistics
     */
    public function getEmailTemplateStats(): JsonResponse
    {
        try {
            $totalTemplates = EmailTemplate::count();
            $activeTemplates = EmailTemplate::where('status', 'active')->count();
            $totalSent = EmailTemplate::sum('usage_count');
            
            $mostUsedTemplate = EmailTemplate::where('usage_count', '>', 0)
                ->orderBy('usage_count', 'desc')
                ->first();

            $categories = EmailTemplate::select('category')
                ->selectRaw('COUNT(*) as count')
                ->groupBy('category')
                ->get()
                ->map(function ($item) {
                    return [
                        'name' => $item->category,
                        'count' => $item->count
                    ];
                });

            // Get recent activity (last 30 days)
            $recentActivity = EmailTemplate::where('last_sent_at', '>=', now()->subDays(30))
                ->selectRaw('DATE(last_sent_at) as date, COUNT(*) as sent_count')
                ->groupBy('date')
                ->orderBy('date', 'desc')
                ->limit(30)
                ->get()
                ->map(function ($item) {
                    return [
                        'date' => $item->date,
                        'sent_count' => $item->sent_count
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => [
                    'total_templates' => $totalTemplates,
                    'active_templates' => $activeTemplates,
                    'total_sent' => $totalSent,
                    'most_used_template' => $mostUsedTemplate?->name ?? 'N/A',
                    'categories' => $categories,
                    'recent_activity' => $recentActivity
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch email template stats',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a single email template by ID
     */
    public function getEmailTemplate($id): JsonResponse
    {
        try {
            $template = EmailTemplate::with('creator:id,name,email')->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => (string) $template->id,
                    'name' => $template->name,
                    'subject' => $template->subject,
                    'body' => $template->body,
                    'category' => $template->category,
                    'type' => $template->type,
                    'status' => $template->status,
                    'variables' => $template->variables ?? [],
                    'usage_count' => $template->usage_count,
                    'last_sent_at' => $template->last_sent_at?->toISOString(),
                    'created_by' => $template->creator->email ?? 'Unknown',
                    'created_at' => $template->created_at->toISOString(),
                    'updated_at' => $template->updated_at->toISOString(),
                    'creator' => $template->creator ? [
                        'name' => $template->creator->name,
                        'email' => $template->creator->email,
                    ] : null,
                ]
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Email template not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch email template',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new email template
     */
    public function createEmailTemplate(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:email_templates,name',
                'subject' => 'required|string|max:500',
                'body' => 'required|string',
                'category' => 'required|string|max:100',
                'type' => 'required|in:notification,reminder,announcement,survey,system',
                'status' => 'required|in:active,inactive,draft',
                'variables' => 'nullable|array',
            ]);

            $validated['created_by'] = auth()->id();

            $template = EmailTemplate::create($validated);

            return response()->json([
                'success' => true,
                'message' => 'Email template created successfully',
                'data' => $template
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create email template',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update an email template
     */
    public function updateEmailTemplate(Request $request, $id): JsonResponse
    {
        try {
            $template = EmailTemplate::findOrFail($id);

            $validated = $request->validate([
                'name' => 'sometimes|required|string|max:255|unique:email_templates,name,' . $id,
                'subject' => 'sometimes|required|string|max:500',
                'body' => 'sometimes|required|string',
                'category' => 'sometimes|required|string|max:100',
                'type' => 'sometimes|required|in:notification,reminder,announcement,survey,system',
                'status' => 'sometimes|required|in:active,inactive,draft',
                'variables' => 'nullable|array',
            ]);

            $template->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Email template updated successfully',
                'data' => $template->fresh()
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Email template not found'
            ], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update email template',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete an email template
     */
    public function deleteEmailTemplate($id): JsonResponse
    {
        try {
            $template = EmailTemplate::findOrFail($id);
            $template->delete();

            return response()->json([
                'success' => true,
                'message' => 'Email template deleted successfully'
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Email template not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete email template',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Duplicate an email template
     */
    public function duplicateEmailTemplate($id): JsonResponse
    {
        try {
            $template = EmailTemplate::findOrFail($id);
            
            $newTemplate = $template->replicate();
            $newTemplate->name = $template->name . ' (Copy)';
            $newTemplate->slug = $template->slug . '-copy-' . time();
            $newTemplate->usage_count = 0;
            $newTemplate->last_sent_at = null;
            $newTemplate->created_by = auth()->id();
            $newTemplate->save();

            return response()->json([
                'success' => true,
                'message' => 'Email template duplicated successfully',
                'data' => $newTemplate
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Email template not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to duplicate email template',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Test an email template by sending a test email
     */
    public function testEmailTemplate(Request $request, $id): JsonResponse
    {
        try {
            $template = EmailTemplate::findOrFail($id);
            
            $request->validate([
                'test_email' => 'required|email'
            ]);

            $testEmail = $request->test_email;
            
            // Replace variables with test data
            $testData = [
                '{{name}}' => 'Test User',
                '{{first_name}}' => 'Test',
                '{{last_name}}' => 'User',
                '{{email}}' => $testEmail,
                '{{date}}' => now()->format('F j, Y'),
                '{{company}}' => 'Test Company',
                '{{app_name}}' => config('app.name'),
            ];
            
            $subject = str_replace(array_keys($testData), array_values($testData), $template->subject);
            $body = str_replace(array_keys($testData), array_values($testData), $template->body);
            
            // Send test email
            \Mail::raw($body, function ($message) use ($testEmail, $subject) {
                $message->to($testEmail)
                    ->subject('[TEST] ' . $subject);
            });

            return response()->json([
                'success' => true,
                'message' => 'Test email sent successfully to ' . $testEmail
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Email template not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to send test email',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export email templates
     */
    public function exportEmailTemplates(Request $request): JsonResponse
    {
        try {
            $templates = EmailTemplate::all();
            
            $exportData = $templates->map(function ($template) {
                return [
                    'name' => $template->name,
                    'slug' => $template->slug,
                    'subject' => $template->subject,
                    'body' => $template->body,
                    'category' => $template->category,
                    'variables' => $template->variables,
                    'status' => $template->status,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $exportData,
                'count' => $templates->count()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to export email templates',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get system settings
     */
    public function getSystemSettings(Request $request): JsonResponse
    {
        try {
            $settings = AdminSetting::orderBy('category')
                ->orderBy('key')
                ->get()
                ->map(function ($setting) {
                    return [
                        'key' => $setting->key,
                        'value' => $setting->value,
                        'type' => $setting->type,
                        'category' => $setting->category,
                        'description' => $setting->description,
                        'is_sensitive' => in_array($setting->key, [
                            'smtp_password',
                            'api_key',
                            'secret_key',
                            'encryption_key'
                        ])
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $settings
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch system settings',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update system settings
     */
    public function updateSystemSettings(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'settings' => 'required|array',
                'settings.*' => 'string|nullable'
            ]);

            $updated = [];
            foreach ($validated['settings'] as $key => $value) {
                $setting = AdminSetting::where('key', $key)->first();
                
                if ($setting) {
                    $setting->value = $value;
                    $setting->save();
                    $updated[] = $key;
                }
            }

            return response()->json([
                'success' => true,
                'message' => count($updated) . ' setting(s) updated successfully',
                'data' => [
                    'updated_count' => count($updated),
                    'updated_keys' => $updated
                ]
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update system settings',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get system statistics
     */
    public function getSystemStats(): JsonResponse
    {
        try {
            $stats = [
                'total_users' => User::count(),
                'total_alumni' => AlumniProfile::count(),
                'total_surveys' => Survey::count(),
                'database_size' => $this->getDatabaseSize(),
                'cache_size' => $this->getCacheSize(),
                'uptime' => $this->getSystemUptime(),
                'last_backup' => $this->getLastBackupDate()
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch system stats',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Clear application cache
     */
    public function clearCache(): JsonResponse
    {
        try {
            \Artisan::call('cache:clear');
            \Artisan::call('config:clear');
            \Artisan::call('route:clear');
            \Artisan::call('view:clear');

            return response()->json([
                'success' => true,
                'message' => 'Cache cleared successfully',
                'data' => [
                    'cleared' => ['cache', 'config', 'routes', 'views']
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to clear cache',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create database backup
     */
    public function createBackup(Request $request): JsonResponse
    {
        try {
            $type = $request->input('type', 'full');
            $timestamp = now()->format('Y-m-d_H-i-s');
            $filename = "backup_{$timestamp}.sql";
            $storagePath = storage_path('app/backups');
            
            if (!file_exists($storagePath)) {
                mkdir($storagePath, 0755, true);
            }

            $filepath = "{$storagePath}/{$filename}";

            $database = config('database.connections.mysql.database');
            $username = config('database.connections.mysql.username');
            $password = config('database.connections.mysql.password');
            $host = config('database.connections.mysql.host');

            // Try to find mysqldump in common locations
            $mysqldumpPath = 'mysqldump'; // Default (if in PATH)
            
            // Check XAMPP location (Windows)
            if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
                $xamppPath = 'C:\\xampp\\mysql\\bin\\mysqldump.exe';
                if (file_exists($xamppPath)) {
                    $mysqldumpPath = $xamppPath;
                }
            }

            // Build command based on backup type
            $additionalOptions = '';
            if ($type === 'structure') {
                $additionalOptions = '--no-data'; // Schema only
            } elseif ($type === 'partial') {
                $additionalOptions = '--skip-triggers --skip-routines'; // Data without extras
            }

            $command = sprintf(
                '"%s" -h %s -u %s --password=%s %s %s > %s 2>&1',
                $mysqldumpPath,
                escapeshellarg($host),
                escapeshellarg($username),
                escapeshellarg($password),
                $additionalOptions,
                escapeshellarg($database),
                escapeshellarg($filepath)
            );

            exec($command, $output, $returnCode);

            // Check if backup was created successfully
            if (!file_exists($filepath) || filesize($filepath) === 0) {
                $errorMsg = implode("\n", $output);
                throw new \Exception('Backup creation failed: ' . $errorMsg);
            }

            return response()->json([
                'success' => true,
                'message' => 'Backup created successfully',
                'data' => [
                    'id' => basename($filename, '.sql'),
                    'filename' => $filename,
                    'size' => $this->formatBytes(filesize($filepath)),
                    'created_at' => now()->toISOString(),
                    'type' => $type,
                    'status' => 'completed'
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create backup',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get list of all backups
     */
    public function getBackups(): JsonResponse
    {
        try {
            $backupPath = storage_path('app/backups');
            
            if (!file_exists($backupPath)) {
                return response()->json([
                    'success' => true,
                    'data' => []
                ]);
            }

            $files = glob($backupPath . '/backup_*.sql');
            
            $backups = array_map(function($file) {
                $filename = basename($file);
                $size = filesize($file);
                $created = filemtime($file);
                
                return [
                    'id' => basename($filename, '.sql'),
                    'filename' => $filename,
                    'size' => $this->formatBytes($size),
                    'created_at' => Carbon::createFromTimestamp($created)->toISOString(),
                    'type' => 'full',
                    'status' => 'completed',
                    'download_url' => '/api/v1/admin/backups/download/' . urlencode($filename)
                ];
            }, $files);

            // Sort by created date descending
            usort($backups, function($a, $b) {
                return strtotime($b['created_at']) - strtotime($a['created_at']);
            });

            return response()->json([
                'success' => true,
                'data' => $backups
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch backups',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a backup file
     */
    public function deleteBackup($id): JsonResponse
    {
        try {
            $backupPath = storage_path('app/backups');
            $filename = $id . '.sql';
            $filepath = $backupPath . '/' . $filename;

            // Security check: ensure filename doesn't contain path traversal
            if (strpos($filename, '..') !== false || strpos($filename, '/') !== false) {
                throw new \Exception('Invalid filename');
            }

            if (!file_exists($filepath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Backup file not found'
                ], 404);
            }

            unlink($filepath);

            return response()->json([
                'success' => true,
                'message' => 'Backup deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete backup',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get system information for backup page
     */
    public function getSystemInfo(): JsonResponse
    {
        try {
            $database = config('database.connections.mysql.database');
            
            // Get total tables
            $tables = DB::select("
                SELECT COUNT(*) as count
                FROM information_schema.TABLES
                WHERE table_schema = ?
            ", [$database]);
            
            $totalTables = $tables[0]->count ?? 0;

            // Get total records across all tables
            $recordCounts = DB::select("
                SELECT SUM(table_rows) as total
                FROM information_schema.TABLES
                WHERE table_schema = ?
            ", [$database]);
            
            $totalRecords = $recordCounts[0]->total ?? 0;

            // Get available disk space
            $availableSpace = $this->getAvailableSpace();

            $info = [
                'database_size' => $this->getDatabaseSize(),
                'total_tables' => (int)$totalTables,
                'total_records' => (int)$totalRecords,
                'last_backup' => $this->getLastBackupDate(),
                'available_space' => $availableSpace,
                'backup_directory' => storage_path('app/backups')
            ];

            return response()->json([
                'success' => true,
                'data' => $info
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch system info',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Helper: Get available disk space
     */
    private function getAvailableSpace(): string
    {
        try {
            $path = storage_path('app');
            $freeSpace = disk_free_space($path);
            
            if ($freeSpace === false) {
                return 'Unknown';
            }

            return $this->formatBytes($freeSpace);
        } catch (\Exception $e) {
            return 'Unknown';
        }
    }

    /**
     * Download a backup file
     */
    public function downloadBackup($filename)
    {
        try {
            $backupPath = storage_path('app/backups');
            $filepath = $backupPath . '/' . $filename;

            // Security check: ensure filename doesn't contain path traversal
            if (strpos($filename, '..') !== false || strpos($filename, '/') !== false) {
                abort(403, 'Invalid filename');
            }

            if (!file_exists($filepath)) {
                abort(404, 'Backup file not found');
            }

            return response()->download($filepath);
        } catch (\Exception $e) {
            abort(500, 'Failed to download backup: ' . $e->getMessage());
        }
    }

    /**
     * Helper: Get database size
     */
    private function getDatabaseSize(): string
    {
        try {
            $database = config('database.connections.mysql.database');
            $result = DB::select("
                SELECT SUM(data_length + index_length) as size
                FROM information_schema.TABLES 
                WHERE table_schema = ?
            ", [$database]);

            $bytes = $result[0]->size ?? 0;
            return $this->formatBytes($bytes);
        } catch (\Exception $e) {
            return 'Unknown';
        }
    }

    /**
     * Helper: Get cache size
     */
    private function getCacheSize(): string
    {
        try {
            $cachePath = storage_path('framework/cache/data');
            if (!file_exists($cachePath)) {
                return '0 B';
            }

            $size = 0;
            $files = new \RecursiveIteratorIterator(
                new \RecursiveDirectoryIterator($cachePath)
            );

            foreach ($files as $file) {
                if ($file->isFile()) {
                    $size += $file->getSize();
                }
            }

            return $this->formatBytes($size);
        } catch (\Exception $e) {
            return 'Unknown';
        }
    }

    /**
     * Helper: Get system uptime
     */
    private function getSystemUptime(): string
    {
        try {
            if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
                return 'Running';
            } else {
                $uptime = shell_exec('uptime -p');
                return trim($uptime ?: 'Unknown');
            }
        } catch (\Exception $e) {
            return 'Unknown';
        }
    }

    /**
     * Helper: Get last backup date
     */
    private function getLastBackupDate(): string
    {
        try {
            $backupPath = storage_path('app/backups');
            
            if (!file_exists($backupPath)) {
                return 'Never';
            }

            $files = glob($backupPath . '/backup_*.sql');
            
            if (empty($files)) {
                return 'Never';
            }

            usort($files, function($a, $b) {
                return filemtime($b) - filemtime($a);
            });

            $lastBackup = filemtime($files[0]);
            return \Carbon\Carbon::createFromTimestamp($lastBackup)->diffForHumans();
        } catch (\Exception $e) {
            return 'Unknown';
        }
    }

    /**
     * Helper: Format bytes to human readable
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
     * Update alumni profile
     */
    public function updateProfile(Request $request, $id): JsonResponse
    {
        try {
            $profile = AlumniProfile::findOrFail($id);

            $validatedData = $request->validate([
                'first_name' => 'required|string|max:255',
                'last_name' => 'required|string|max:255',
                'student_id' => 'required|string|max:50|unique:alumni_profiles,student_id,' . $id,
                'gender' => 'required|in:Male,Female,Other',
                'birth_date' => 'nullable|date',
                'phone' => 'nullable|string|max:20',
                'city' => 'nullable|string|max:100',
                'country' => 'nullable|string|max:100',
                'degree_program' => 'required|string|max:255',
                'graduation_year' => 'required|integer|min:1900|max:' . (date('Y') + 10),
                'gpa' => 'nullable|numeric|min:0|max:4',
                'batch_id' => 'nullable|exists:batches,id',
                'employment_status' => 'nullable|in:Employed,Self-employed,Unemployed,Student,Retired',
                'current_job_title' => 'nullable|string|max:255',
                'current_employer' => 'nullable|string|max:255',
                'current_salary' => 'nullable|numeric|min:0'
            ]);

            $profile->update($validatedData);

            // Load updated profile with relationships
            $updatedProfile = AlumniProfile::with(['user', 'batch'])
                ->find($id);

            return response()->json([
                'success' => true,
                'message' => 'Profile updated successfully',
                'data' => $updatedProfile
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Profile not found'
            ], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update profile',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a single role with permissions
     */
    public function getRole($id): JsonResponse
    {
        try {
            // For now, return mock data based on role name (admin or alumni)
            $roles = $this->getRoles(new Request())->getData(true);
            
            if (!isset($roles['data'])) {
                throw new \Exception('Failed to load roles');
            }

            $role = collect($roles['data'])->firstWhere('id', $id);
            
            if (!$role) {
                return response()->json([
                    'success' => false,
                    'message' => 'Role not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $role
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch role',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new role
     */
    public function createRole(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|regex:/^[a-z0-9_]+$/|unique:roles,name',
                'display_name' => 'required|string|max:255',
                'description' => 'required|string|max:1000',
                'permission_ids' => 'nullable|array',
                'permission_ids.*' => 'exists:permissions,id'
            ]);

            $role = \App\Models\Role::create([
                'name' => $validated['name'],
                'display_name' => $validated['display_name'],
                'description' => $validated['description'],
                'is_system_role' => false,
                'is_active' => true,
            ]);

            if (!empty($validated['permission_ids'])) {
                $role->syncPermissions($validated['permission_ids']);
            }

            $role->load('permissions:id,name,display_name');

            return response()->json([
                'success' => true,
                'message' => 'Role created successfully',
                'data' => [
                    'id' => $role->id,
                    'name' => $role->name,
                    'display_name' => $role->display_name,
                    'description' => $role->description,
                    'is_system_role' => $role->is_system_role,
                    'permissions' => $role->permissions->pluck('id')->toArray(),
                    'permissions_details' => $role->permissions->map(fn($p) => [
                        'id' => $p->id, 'name' => $p->name, 'display_name' => $p->display_name
                    ]),
                    'users_count' => 0,
                    'created_at' => $role->created_at?->toISOString(),
                    'updated_at' => $role->updated_at?->toISOString(),
                ]
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create role',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update an existing role
     */
    public function updateRole(Request $request, $id): JsonResponse
    {
        try {
            $role = \App\Models\Role::findOrFail($id);

            // Prevent renaming system roles
            if ($role->is_system_role && $request->has('name') && $request->name !== $role->name) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot change the name of system roles',
                    'errors' => ['name' => ['System role names cannot be modified']]
                ], 422);
            }

            $validated = $request->validate([
                'name' => 'sometimes|string|max:255|regex:/^[a-z0-9_]+$/|unique:roles,name,' . $id,
                'display_name' => 'sometimes|string|max:255',
                'description' => 'sometimes|string|max:1000',
                'permission_ids' => 'nullable|array',
                'permission_ids.*' => 'exists:permissions,id'
            ]);

            $role->update(collect($validated)->only(['name', 'display_name', 'description'])->toArray());

            if (array_key_exists('permission_ids', $validated)) {
                // Don't allow modifying super_admin permissions
                if ($role->is_system_role && $role->name === 'super_admin') {
                    return response()->json([
                        'success' => false,
                        'message' => 'Super Admin permissions cannot be modified'
                    ], 403);
                }
                $role->syncPermissions($validated['permission_ids'] ?? []);
            }

            $role->load('permissions:id,name,display_name');

            return response()->json([
                'success' => true,
                'message' => 'Role updated successfully',
                'data' => [
                    'id' => $role->id,
                    'name' => $role->name,
                    'display_name' => $role->display_name,
                    'description' => $role->description,
                    'is_system_role' => $role->is_system_role,
                    'permissions' => $role->permissions->pluck('id')->toArray(),
                    'permissions_details' => $role->permissions->map(fn($p) => [
                        'id' => $p->id, 'name' => $p->name, 'display_name' => $p->display_name
                    ]),
                    'created_at' => $role->created_at?->toISOString(),
                    'updated_at' => $role->updated_at?->toISOString(),
                ]
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update role',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a role
     */
    public function deleteRole($id): JsonResponse
    {
        try {
            $role = \App\Models\Role::findOrFail($id);

            if ($role->is_system_role) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete system roles'
                ], 422);
            }

            $usersCount = $role->users()->count();
            if ($usersCount > 0) {
                return response()->json([
                    'success' => false,
                    'message' => "Cannot delete role. It has {$usersCount} users assigned to it."
                ], 422);
            }

            // Detach all permissions first
            $role->permissions()->detach();
            $role->delete();

            return response()->json([
                'success' => true,
                'message' => 'Role deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete role',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

