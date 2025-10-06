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
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AdminController extends Controller
{
    /**
     * Get dashboard metrics and overview data
     */
    public function dashboard(): JsonResponse
    {
        try {
            // Total counts
            $totalAlumni = AlumniProfile::count();
            $totalSurveys = Survey::count();
            $totalBatches = Batch::count();
            $totalResponses = SurveyResponse::where('status', 'completed')->count();

            // Response rate calculation
            $totalInvitations = SurveyResponse::count();
            $responseRate = $totalInvitations > 0 ? round(($totalResponses / $totalInvitations) * 100, 2) : 0;

            // Recent activity (last 30 days)
            $recentRegistrations = AlumniProfile::where('created_at', '>=', Carbon::now()->subDays(30))->count();
            $recentResponses = SurveyResponse::where('status', 'completed')
                ->where('updated_at', '>=', Carbon::now()->subDays(30))
                ->count();

            // Batch distribution
            $batchDistribution = Batch::withCount('alumniProfiles')->get()->map(function ($batch) {
                return [
                    'batch_name' => $batch->name,
                    'batch_year' => $batch->graduation_year,
                    'alumni_count' => $batch->alumni_profiles_count
                ];
            });

            // Employment status distribution
            $employmentStats = AlumniProfile::select('employment_status')
                ->whereNotNull('employment_status')
                ->groupBy('employment_status')
                ->selectRaw('employment_status, COUNT(*) as count')
                ->get()
                ->pluck('count', 'employment_status');

            // Recent surveys
            $recentSurveys = Survey::with('creator:id,email')
                ->orderBy('created_at', 'desc')
                ->take(5)
                ->get()
                ->map(function ($survey) {
                    return [
                        'id' => $survey->id,
                        'title' => $survey->title,
                        'status' => $survey->status,
                        'created_by' => $survey->creator->email ?? 'Unknown',
                        'created_at' => $survey->created_at->format('Y-m-d H:i:s'),
                        'responses_count' => $survey->responses()->where('status', 'completed')->count()
                    ];
                });

            // Monthly registration trend (last 12 months)
            $monthlyTrend = [];
            for ($i = 11; $i >= 0; $i--) {
                $month = Carbon::now()->subMonths($i);
                $count = AlumniProfile::whereYear('created_at', $month->year)
                    ->whereMonth('created_at', $month->month)
                    ->count();

                $monthlyTrend[] = [
                    'month' => $month->format('Y-m'),
                    'registrations' => $count
                ];
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'overview' => [
                        'total_alumni' => $totalAlumni,
                        'total_surveys' => $totalSurveys,
                        'total_batches' => $totalBatches,
                        'total_responses' => $totalResponses,
                        'response_rate' => $responseRate
                    ],
                    'recent_activity' => [
                        'recent_registrations' => $recentRegistrations,
                        'recent_responses' => $recentResponses
                    ],
                    'batch_distribution' => $batchDistribution,
                    'employment_stats' => $employmentStats,
                    'recent_surveys' => $recentSurveys,
                    'monthly_trend' => $monthlyTrend
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch dashboard data',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    /**
     * Get all alumni with comprehensive filtering and pagination (Alumni Bank)
     */
    public function getAlumni(Request $request): JsonResponse
    {
        try {
            $query = AlumniProfile::with(['user:id,email', 'batch:id,name,graduation_year'])
                ->orderBy('created_at', 'desc');

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
                $query->where('employment_status', $request->employment_status);
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

            // Sorting options
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');

            switch ($sortBy) {
                case 'name':
                    $query->orderBy('first_name', $sortOrder)->orderBy('last_name', $sortOrder);
                    break;
                case 'graduation_year':
                    $query->whereHas('batch', function ($q) use ($sortOrder) {
                        $q->orderBy('graduation_year', $sortOrder);
                    });
                    break;
                case 'employment_status':
                    $query->orderBy('employment_status', $sortOrder);
                    break;
                case 'created_at':
                default:
                    $query->orderBy('created_at', $sortOrder);
                    break;
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
     * Get alumni statistics and analytics
     */
    public function getAlumniStats(Request $request): JsonResponse
    {
        try {
            // Overall statistics
            $totalAlumni = AlumniProfile::count();

            // Batch-wise distribution
            $batchStats = Batch::withCount('alumniProfiles')
                ->orderBy('graduation_year', 'desc')
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
            $employmentStats = AlumniProfile::select('employment_status', DB::raw('count(*) as count'))
                ->whereNotNull('employment_status')
                ->groupBy('employment_status')
                ->get()
                ->pluck('count', 'employment_status');

            // Top employers
            $topEmployers = AlumniProfile::select('current_employer', DB::raw('count(*) as count'))
                ->whereNotNull('current_employer')
                ->where('current_employer', '!=', '')
                ->groupBy('current_employer')
                ->orderBy('count', 'desc')
                ->limit(10)
                ->get();

            // Degree program distribution
            $degreePrograms = AlumniProfile::select('degree_program', DB::raw('count(*) as count'))
                ->whereNotNull('degree_program')
                ->groupBy('degree_program')
                ->orderBy('count', 'desc')
                ->get()
                ->pluck('count', 'degree_program');

            // Major distribution
            $majors = AlumniProfile::select('major', DB::raw('count(*) as count'))
                ->whereNotNull('major')
                ->groupBy('major')
                ->orderBy('count', 'desc')
                ->limit(15)
                ->get()
                ->pluck('count', 'major');

            // Geographic distribution
            $locations = AlumniProfile::select('city', 'state_province', 'country', DB::raw('count(*) as count'))
                ->whereNotNull('city')
                ->groupBy('city', 'state_province', 'country')
                ->orderBy('count', 'desc')
                ->limit(20)
                ->get();

            // Mentorship and hiring willingness
            $mentoringStats = [
                'willing_to_mentor' => AlumniProfile::where('willing_to_mentor', true)->count(),
                'willing_to_hire' => AlumniProfile::where('willing_to_hire_alumni', true)->count(),
                'total_alumni' => $totalAlumni
            ];

            return response()->json([
                'success' => true,
                'data' => [
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
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch alumni statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    /**
     * Get all surveys with comprehensive filtering and statistics
     */
    public function getSurveys(Request $request): JsonResponse
    {
        try {
            $query = Survey::with(['creator:id,email'])
                ->withCount(['responses', 'questions'])
                ->orderBy('created_at', 'desc');

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

            $query = Batch::withCount(['alumniProfiles as alumni_count'])
                ->orderBy('graduation_year', 'desc')
                ->orderBy('name');

            // Apply search filter
            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('graduation_year', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%");
                });
            }

            $batches = $query->paginate($perPage);

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
     * Create a new batch
     */
    public function createBatch(Request $request): JsonResponse
    {
        try {
            $validatedData = $request->validate([
                'name' => 'required|string|max:255',
                'graduation_year' => 'required|integer|min:1900|max:2050',
                'description' => 'nullable|string|max:1000',
                'status' => 'required|in:active,inactive,archived'
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
                'employment_status' => 'sometimes|in:employed,unemployed,self-employed,pursuing_education,not_specified',
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
            $alumni = AlumniProfile::findOrFail($id);
            $alumniName = $alumni->first_name . ' ' . $alumni->last_name;
            
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
     * Export alumni data to CSV
     */
    public function exportAlumni(Request $request): JsonResponse
    {
        try {
            $query = AlumniProfile::with(['user:id,email', 'batch:id,name,graduation_year']);

            // Apply same filters as getAlumni
            if ($request->has('batch_id') && $request->batch_id) {
                $query->where('batch_id', $request->batch_id);
            }

            if ($request->has('employment_status') && $request->employment_status) {
                $query->where('employment_status', $request->employment_status);
            }

            $alumni = $query->get();

            $csvData = [];
            $csvData[] = [
                'Name',
                'Email',
                'Phone',
                'Batch',
                'Year',
                'Employment Status',
                'Current Position',
                'Company',
                'Industry',
                'Registration Date'
            ];

            foreach ($alumni as $alumnus) {
                $csvData[] = [
                    $alumnus->full_name ?? '',
                    $alumnus->user->email ?? '',
                    $alumnus->phone ?? '',
                    $alumnus->batch->name ?? '',
                    $alumnus->batch->graduation_year ?? '',
                    $alumnus->employment_status ?? '',
                    $alumnus->current_job_title ?? '',
                    $alumnus->current_employer ?? '',
                    $alumnus->company_industry ?? '',
                    $alumnus->created_at->format('Y-m-d H:i:s')
                ];
            }

            // Convert to CSV string
            $csvString = '';
            foreach ($csvData as $row) {
                $csvString .= '"' . implode('","', $row) . '"' . "\n";
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'filename' => 'alumni_export_' . date('Y-m-d_H-i-s') . '.csv',
                    'content' => base64_encode($csvString),
                    'total_records' => count($alumni)
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to export alumni data',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export survey responses to CSV
     */
    public function exportSurveyResponses(Request $request, $surveyId): JsonResponse
    {
        try {
            $survey = Survey::with('questions')->findOrFail($surveyId);

            $responses = SurveyResponse::with(['user:id,email', 'answers.surveyQuestion'])
                ->where('survey_id', $surveyId)
                ->where('status', 'completed')
                ->get();

            $csvData = [];

            // Header row
            $headers = ['Respondent Email', 'Submitted At'];
            foreach ($survey->questions as $question) {
                $headers[] = $question->question_text;
            }
            $csvData[] = $headers;

            // Data rows
            foreach ($responses as $response) {
                $row = [
                    $response->user->email ?? '',
                    $response->updated_at->format('Y-m-d H:i:s')
                ];

                foreach ($survey->questions as $question) {
                    $answer = $response->answers->where('survey_question_id', $question->id)->first();
                    $row[] = $answer ? ($answer->answer_text ?? $answer->answer_number ?? $answer->answer_date) : '';
                }

                $csvData[] = $row;
            }

            // Convert to CSV string
            $csvString = '';
            foreach ($csvData as $row) {
                $csvString .= '"' . implode('","', array_map(function ($item) {
                    return str_replace('"', '""', $item);
                }, $row)) . '"' . "\n";
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'filename' => 'survey_responses_' . $survey->title . '_' . date('Y-m-d_H-i-s') . '.csv',
                    'content' => base64_encode($csvString),
                    'total_responses' => count($responses)
                ]
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
            $request->validate([
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

            return response()->json([
                'success' => true,
                'message' => 'Survey created successfully',
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

            return response()->json([
                'success' => true,
                'message' => 'Survey updated successfully',
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

            return response()->json([
                'success' => true,
                'data' => [
                    'data' => $activities->items(),
                    'current_page' => $activities->currentPage(),
                    'last_page' => $activities->lastPage(),
                    'per_page' => $activities->perPage(),
                    'total' => $activities->total(),
                ]
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
     * Export activity logs to CSV
     */
    public function exportActivityLogs(Request $request)
    {
        try {
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
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to export activity logs',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get users for admin management
     */
    public function getUsers(Request $request): JsonResponse
    {
        try {
            $query = User::with('alumniProfile:id,user_id,first_name,last_name,phone')
                ->orderBy('created_at', 'desc');

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
     * Create a new user
     */
    public function createUser(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email',
                'password' => 'required|string|min:8',
                'role' => 'required|in:admin,alumni',
                'status' => 'required|in:active,inactive,pending',
            ]);

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
            // Sample permissions structure for the system
            $permissions = [
                [
                    'id' => '1',
                    'name' => 'view_dashboard',
                    'display_name' => 'View Dashboard',
                    'description' => 'Can view the admin dashboard',
                    'category' => 'Dashboard',
                    'guard_name' => 'web',
                    'created_at' => now()->toISOString(),
                    'updated_at' => now()->toISOString()
                ],
                [
                    'id' => '2',
                    'name' => 'manage_users',
                    'display_name' => 'Manage Users',
                    'description' => 'Can create, edit, and delete users',
                    'category' => 'User Management',
                    'guard_name' => 'web',
                    'created_at' => now()->toISOString(),
                    'updated_at' => now()->toISOString()
                ],
                [
                    'id' => '3',
                    'name' => 'manage_alumni',
                    'display_name' => 'Manage Alumni',
                    'description' => 'Can manage alumni profiles',
                    'category' => 'Alumni Management',
                    'guard_name' => 'web',
                    'created_at' => now()->toISOString(),
                    'updated_at' => now()->toISOString()
                ],
                [
                    'id' => '4',
                    'name' => 'manage_surveys',
                    'display_name' => 'Manage Surveys',
                    'description' => 'Can create and manage surveys',
                    'category' => 'Survey Management',
                    'guard_name' => 'web',
                    'created_at' => now()->toISOString(),
                    'updated_at' => now()->toISOString()
                ],
                [
                    'id' => '5',
                    'name' => 'view_analytics',
                    'display_name' => 'View Analytics',
                    'description' => 'Can view analytics and reports',
                    'category' => 'Analytics',
                    'guard_name' => 'web',
                    'created_at' => now()->toISOString(),
                    'updated_at' => now()->toISOString()
                ],
                [
                    'id' => '6',
                    'name' => 'manage_batches',
                    'display_name' => 'Manage Batches',
                    'description' => 'Can manage graduation batches',
                    'category' => 'Batch Management',
                    'guard_name' => 'web',
                    'created_at' => now()->toISOString(),
                    'updated_at' => now()->toISOString()
                ]
            ];
            
            return response()->json([
                'success' => true,
                'data' => $permissions
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
     * Get roles data
     */
    public function getRoles(Request $request): JsonResponse
    {
        try {
            // Sample roles structure based on your system
            $roles = [
                [
                    'id' => '1',
                    'name' => 'admin',
                    'display_name' => 'Administrator',
                    'description' => 'Can manage users, alumni, and surveys',
                    'guard_name' => 'web',
                    'permissions' => [
                        ['id' => '1', 'name' => 'view_dashboard'],
                        ['id' => '2', 'name' => 'manage_users'],
                        ['id' => '3', 'name' => 'manage_alumni'],
                        ['id' => '4', 'name' => 'manage_surveys'],
                        ['id' => '5', 'name' => 'view_analytics'],
                        ['id' => '6', 'name' => 'manage_batches']
                    ],
                    'users_count' => User::where('role', 'admin')->count(),
                    'is_default' => true,
                    'created_at' => now()->toISOString(),
                    'updated_at' => now()->toISOString()
                ],
                [
                    'id' => '2',
                    'name' => 'alumni',
                    'display_name' => 'Alumni',
                    'description' => 'Can view and update own profile',
                    'guard_name' => 'web',
                    'permissions' => [],
                    'users_count' => User::where('role', 'alumni')->count(),
                    'is_default' => true,
                    'created_at' => now()->toISOString(),
                    'updated_at' => now()->toISOString()
                ]
            ];
            
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
            $adminCount = User::where('role', 'admin')->count();
            $alumniCount = User::where('role', 'alumni')->count();

            // Determine most used role
            $mostUsedRole = $alumniCount >= $adminCount ? 'Alumni' : 'Admin';

            $stats = [
                'total_roles' => 2, // admin, alumni
                'total_permissions' => 6, // Based on the permissions defined above
                'total_users_with_roles' => $totalUsers,
                'most_used_role' => $mostUsedRole,
                'permission_categories' => [
                    ['name' => 'Dashboard', 'count' => 1],
                    ['name' => 'User Management', 'count' => 1],
                    ['name' => 'Alumni Management', 'count' => 1],
                    ['name' => 'Survey Management', 'count' => 1],
                    ['name' => 'Analytics', 'count' => 1],
                    ['name' => 'Batch Management', 'count' => 1]
                ]
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
                'name' => 'required|string|max:255|regex:/^[a-z0-9_]+$/',
                'display_name' => 'required|string|max:255',
                'description' => 'required|string|max:1000',
                'guard_name' => 'required|string|max:255',
                'permission_ids' => 'nullable|array',
                'permission_ids.*' => 'string'
            ]);

            // Check if role name already exists
            // For now, just check against existing admin/alumni roles
            if (in_array($validated['name'], ['admin', 'alumni'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'A role with this name already exists',
                    'errors' => [
                        'name' => ['This role name is already in use']
                    ]
                ], 422);
            }

            // In a real implementation, you would:
            // 1. Create the role in a roles table
            // 2. Attach permissions to the role
            // For now, return success with mock data
            
            $newRole = [
                'id' => '3',
                'name' => $validated['name'],
                'display_name' => $validated['display_name'],
                'description' => $validated['description'],
                'guard_name' => $validated['guard_name'],
                'permissions' => [],
                'users_count' => 0,
                'is_default' => false,
                'created_at' => now()->toISOString(),
                'updated_at' => now()->toISOString()
            ];

            return response()->json([
                'success' => true,
                'message' => 'Role created successfully',
                'data' => $newRole
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
            $validated = $request->validate([
                'name' => 'sometimes|string|max:255|regex:/^[a-z0-9_]+$/',
                'display_name' => 'sometimes|string|max:255',
                'description' => 'sometimes|string|max:1000',
                'guard_name' => 'sometimes|string|max:255',
                'permission_ids' => 'nullable|array',
                'permission_ids.*' => 'string'
            ]);

            // Check if role exists and is not a default role
            $roles = $this->getRoles(new Request())->getData(true);
            $role = collect($roles['data'])->firstWhere('id', $id);
            
            if (!$role) {
                return response()->json([
                    'success' => false,
                    'message' => 'Role not found'
                ], 404);
            }

            if ($role['is_default'] && isset($validated['name']) && $validated['name'] !== $role['name']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot change the name of default roles',
                    'errors' => [
                        'name' => ['Default role names cannot be modified']
                    ]
                ], 422);
            }

            // In a real implementation, update the role in database
            // For now, return success with updated mock data
            
            $updatedRole = array_merge($role, [
                'display_name' => $validated['display_name'] ?? $role['display_name'],
                'description' => $validated['description'] ?? $role['description'],
                'updated_at' => now()->toISOString()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Role updated successfully',
                'data' => $updatedRole
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
            // Check if role exists
            $roles = $this->getRoles(new Request())->getData(true);
            $role = collect($roles['data'])->firstWhere('id', $id);
            
            if (!$role) {
                return response()->json([
                    'success' => false,
                    'message' => 'Role not found'
                ], 404);
            }

            // Check if it's a default role
            if ($role['is_default']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete default system roles'
                ], 422);
            }

            // Check if role has users
            if ($role['users_count'] > 0) {
                return response()->json([
                    'success' => false,
                    'message' => "Cannot delete role. It has {$role['users_count']} users assigned to it."
                ], 422);
            }

            // In a real implementation, delete the role from database
            // For now, return success
            
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

