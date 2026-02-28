<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Course;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use App\Traits\ExportsPdf;

class DepartmentController extends Controller
{
    use ExportsPdf;
    /**
     * Get all departments with statistics
     */
    public function index(Request $request)
    {
        $query = Department::withCount(['courses', 'alumniProfiles']);

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Include soft deleted
        if ($request->boolean('include_deleted')) {
            $query->withTrashed();
        }

        // Sort
        $sortBy = $request->get('sort_by', 'name');
        $sortOrder = $request->get('sort_order', 'asc');
        $query->orderBy($sortBy, $sortOrder);

        // Paginate or get all
        if ($request->boolean('all')) {
            $departments = $query->get();
            return response()->json([
                'success' => true,
                'data' => $departments
            ]);
        }

        $perPage = $request->get('per_page', 15);
        $departments = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $departments->items(),
            'meta' => [
                'current_page' => $departments->currentPage(),
                'total' => $departments->total(),
                'per_page' => $departments->perPage(),
                'last_page' => $departments->lastPage(),
            ]
        ]);
    }

    /**
     * Get active departments (for dropdowns)
     */
    public function getActive()
    {
        $departments = Department::active()
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        return response()->json([
            'success' => true,
            'data' => $departments
        ]);
    }

    /**
     * Get courses for a specific department
     */
    public function getCourses($id)
    {
        $department = Department::findOrFail($id);
        $courses = $department->courses()
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'duration_years']);

        return response()->json([
            'success' => true,
            'data' => $courses
        ]);
    }

    /**
     * Store a new department
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:departments,name',
            'code' => 'required|string|max:50|unique:departments,code',
            'description' => 'nullable|string',
            'status' => 'required|in:active,inactive',
            'campus_id' => 'nullable|integer|exists:campuses,id',
        ]);

        $department = Department::create($validated);

        // Log activity
        ActivityLog::logActivity(
            auth()->id(),
            'department_created',
            "Created department: {$department->name}",
            'Department',
            $department->id
        );

        return response()->json([
            'success' => true,
            'message' => 'Department created successfully',
            'data' => $department->load(['courses', 'alumniProfiles'])
        ], 201);
    }

    /**
     * Show a specific department
     */
    public function show($id)
    {
        $department = Department::withCount(['courses', 'alumniProfiles'])
            ->with(['courses' => function($query) {
                $query->withCount('alumniProfiles');
            }])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $department
        ]);
    }

    /**
     * Update a department
     */
    public function update(Request $request, $id)
    {
        $department = Department::findOrFail($id);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('departments')->ignore($id)],
            'code' => ['required', 'string', 'max:50', Rule::unique('departments')->ignore($id)],
            'description' => 'nullable|string',
            'status' => 'required|in:active,inactive',
            'campus_id' => 'nullable|integer|exists:campuses,id',
            'logo_path' => 'nullable|string',
            'background_image_path' => 'nullable|string',
            'primary_color' => 'nullable|string|max:7',
            'secondary_color' => 'nullable|string|max:7',
            'custom_css' => 'nullable|string',
        ]);

        $oldData = $department->toArray();
        
        // Handle null values for image paths (for deletion)
        // Explicitly set null values before updating to ensure they persist
        if ($request->has('logo_path') && is_null($request->logo_path)) {
            $department->logo_path = null;
        }
        if ($request->has('background_image_path') && is_null($request->background_image_path)) {
            $department->background_image_path = null;
        }
        
        // Update other fields
        $department->fill($validated);
        $department->save();

        // Log activity
        ActivityLog::logActivity(
            auth()->id(),
            'department_updated',
            "Updated department: {$department->name}",
            'Department',
            $department->id,
            ['old' => $oldData, 'new' => $department->toArray()]
        );

        return response()->json([
            'success' => true,
            'message' => 'Department updated successfully',
            'data' => $department->load(['courses', 'alumniProfiles'])
        ]);
    }

    /**
     * Delete a department (soft delete)
     */
    public function destroy($id)
    {
        $department = Department::findOrFail($id);

        // Check if department has alumni
        if ($department->alumniProfiles()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete department with existing alumni. Please reassign alumni first.',
                'alumni_count' => $department->alumniProfiles()->count()
            ], 422);
        }

        // Soft delete
        $department->delete();

        // Log activity
        ActivityLog::logActivity(
            auth()->id(),
            'department_deleted',
            "Deleted department: {$department->name}",
            'Department',
            $department->id
        );

        return response()->json([
            'success' => true,
            'message' => 'Department deleted successfully'
        ]);
    }

    /**
     * Restore a soft-deleted department
     */
    public function restore($id)
    {
        $department = Department::withTrashed()->findOrFail($id);

        if (!$department->trashed()) {
            return response()->json([
                'success' => false,
                'message' => 'Department is not deleted'
            ], 422);
        }

        $department->restore();

        // Log activity
        ActivityLog::logActivity(
            auth()->id(),
            'department_restored',
            "Restored department: {$department->name}",
            'Department',
            $department->id
        );

        return response()->json([
            'success' => true,
            'message' => 'Department restored successfully',
            'data' => $department
        ]);
    }

    /**
     * Get department statistics
     */
    public function statistics()
    {
        $stats = [
            'total_departments' => Department::count(),
            'active_departments' => Department::where('status', 'active')->count(),
            'inactive_departments' => Department::where('status', 'inactive')->count(),
            'deleted_departments' => Department::onlyTrashed()->count(),
            'total_courses' => Course::count(),
            'departments_with_alumni' => Department::has('alumniProfiles')->count(),
            'departments_by_alumni_count' => Department::withCount('alumniProfiles')
                ->orderBy('alumni_profiles_count', 'desc')
                ->take(10)
                ->get(['id', 'name', 'code'])
                ->map(function($dept) {
                    return [
                        'id' => $dept->id,
                        'name' => $dept->name,
                        'code' => $dept->code,
                        'alumni_count' => $dept->alumni_profiles_count
                    ];
                }),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }

    /**
     * Get alumni profiles by department
     */
    public function getAlumni($id)
    {
        $department = Department::findOrFail($id);
        
        $alumni = $department->alumniProfiles()
            ->with(['user', 'course'])
            ->get()
            ->map(function($profile) {
                return [
                    'id' => $profile->id,
                    'user_id' => $profile->user_id,
                    'first_name' => $profile->first_name,
                    'last_name' => $profile->last_name,
                    'email' => $profile->user->email ?? 'N/A',
                    'student_id' => $profile->student_id,
                    'course' => $profile->course ? [
                        'id' => $profile->course->id,
                        'name' => $profile->course->name,
                        'code' => $profile->course->code,
                    ] : null,
                    'graduation_year' => $profile->graduation_year,
                    'employment_status' => $profile->employment_status,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $alumni
        ]);
    }

    /**
     * Get comprehensive department analytics
     */
    public function getAnalytics($id)
    {
        try {
            $department = Department::withCount(['courses', 'alumniProfiles'])->findOrFail($id);
            
            // Get comprehensive analytics from Department model
            $analytics = $department->getComprehensiveAnalytics();
            
            // Add additional quick metrics
            $totalAlumni = $department->alumni_profiles_count;
            $totalCourses = $department->courses_count;
            
            // Calculate survey statistics (if surveys exist)
            $surveyStats = $this->calculateSurveyStats($department);
            
            // Calculate activity metrics
            $activityStats = $this->calculateActivityStats($department);
            
            // Calculate growth trends
            $growthStats = $this->calculateGrowthStats($department);
            
            return response()->json([
                'success' => true,
                'data' => [
                    'department_id' => $department->id,
                    'basic' => [
                        'total_courses' => $totalCourses,
                        'total_alumni' => $totalAlumni,
                    ],
                    'employment' => [
                        'total_employed' => $analytics['employment']['status_breakdown'],
                        'employment_rate' => $analytics['employment']['employment_rate'],
                        'avg_time_to_employment' => $analytics['employment']['avg_time_to_employment_days'],
                    ],
                    'surveys' => $surveyStats,
                    'activity' => $activityStats,
                    'growth' => $growthStats,
                    'comprehensive' => $analytics, // Full analytics for detailed view
                ]
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Department analytics error', [
                'department_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch analytics: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Calculate survey statistics for department
     */
    private function calculateSurveyStats($department)
    {
        $totalAlumni = $department->alumniProfiles()->count();
        
        if ($totalAlumni === 0) {
            return [
                'total_sent' => 0,
                'total_completed' => 0,
                'response_rate' => 0,
                'last_participation' => null,
            ];
        }
        
        // Get survey responses from alumni in this department
        $responses = \DB::table('survey_responses')
            ->join('alumni_profiles', 'survey_responses.user_id', '=', 'alumni_profiles.user_id')
            ->where('alumni_profiles.department_id', $department->id)
            ->select('survey_responses.*')
            ->get();
        
        $completedCount = $responses->where('status', 'completed')->count();
        $lastParticipation = $responses->max('updated_at');
        
        return [
            'total_sent' => $totalAlumni,
            'total_completed' => $completedCount,
            'response_rate' => $totalAlumni > 0 ? round(($completedCount / $totalAlumni) * 100, 2) : 0,
            'last_participation' => $lastParticipation,
        ];
    }
    
    /**
     * Calculate activity statistics
     */
    private function calculateActivityStats($department)
    {
        $totalAlumni = $department->alumniProfiles()->count();
        
        if ($totalAlumni === 0) {
            return [
                'active_alumni' => 0,
                'active_percentage' => 0,
                'recent_logins_30d' => 0,
                'profile_completion_avg' => 0,
            ];
        }
        
        // Calculate active alumni (logged in within last 90 days)
        $activeAlumni = \DB::table('users')
            ->join('alumni_profiles', 'users.id', '=', 'alumni_profiles.user_id')
            ->where('alumni_profiles.department_id', $department->id)
            ->where('users.last_login_at', '>=', now()->subDays(90))
            ->count();
        
        // Recent logins (last 30 days)
        $recentLogins = \DB::table('users')
            ->join('alumni_profiles', 'users.id', '=', 'alumni_profiles.user_id')
            ->where('alumni_profiles.department_id', $department->id)
            ->where('users.last_login_at', '>=', now()->subDays(30))
            ->count();
        
        // Profile completion average (based on filled fields)
        $profiles = $department->alumniProfiles()->get();
        $completionSum = 0;
        
        foreach ($profiles as $profile) {
            $fields = [
                'phone', 'address', 'city', 'province', 'current_employer',
                'job_title', 'employment_status', 'salary_range', 'career_field'
            ];
            $filledFields = 0;
            foreach ($fields as $field) {
                if (!empty($profile->$field)) {
                    $filledFields++;
                }
            }
            $completionSum += ($filledFields / count($fields)) * 100;
        }
        
        $avgCompletion = $totalAlumni > 0 ? round($completionSum / $totalAlumni, 1) : 0;
        
        return [
            'active_alumni' => $activeAlumni,
            'active_percentage' => round(($activeAlumni / $totalAlumni) * 100, 2),
            'recent_logins_30d' => $recentLogins,
            'profile_completion_avg' => $avgCompletion,
        ];
    }
    
    /**
     * Calculate growth statistics
     */
    private function calculateGrowthStats($department)
    {
        // New alumni in last 6 months
        $newAlumni = $department->alumniProfiles()
            ->where('created_at', '>=', now()->subMonths(6))
            ->count();
        
        // Graduation year distribution (last 5 years)
        $graduationYears = $department->alumniProfiles()
            ->selectRaw('YEAR(graduation_date) as year, COUNT(*) as count')
            ->whereNotNull('graduation_date')
            ->where('graduation_date', '>=', now()->subYears(5))
            ->groupBy('year')
            ->orderBy('year', 'desc')
            ->get()
            ->map(function($item) {
                return [
                    'year' => $item->year,
                    'count' => $item->count
                ];
            })
            ->toArray();
        
        // Total unique graduation years (batches)
        $totalBatches = $department->alumniProfiles()
            ->selectRaw('COUNT(DISTINCT YEAR(graduation_date)) as total')
            ->whereNotNull('graduation_date')
            ->value('total') ?? 0;
        
        return [
            'new_alumni_6m' => $newAlumni,
            'graduation_years' => $graduationYears,
            'total_batches' => $totalBatches,
        ];
    }

    /**
     * Upload department image (logo or background)
     */
    public function uploadImage(Request $request)
    {
        try {
            $request->validate([
                'file' => 'required|image|mimes:jpeg,png,jpg,gif,svg|max:5120', // 5MB max
                'type' => 'required|in:logo,background',
                'department_id' => 'required|exists:departments,id'
            ]);

            $department = Department::findOrFail($request->department_id);
            $type = $request->type;

            if ($request->hasFile('file')) {
                $file = $request->file('file');
                
                // Generate unique filename
                $filename = time() . '_' . $type . '_' . $department->id . '.' . $file->getClientOriginalExtension();
                
                // Store in private uploads disk (served via public asset route)
                $path = $file->storeAs(
                    "departments/{$department->id}/{$type}",
                    $filename,
                    'uploads'
                );

                // Delete old file if exists
                if ($type === 'logo' && $department->logo_path) {
                    if (\Storage::disk('uploads')->exists($department->logo_path)) {
                        \Storage::disk('uploads')->delete($department->logo_path);
                    }
                } elseif ($type === 'background' && $department->background_image_path) {
                    if (\Storage::disk('uploads')->exists($department->background_image_path)) {
                        \Storage::disk('uploads')->delete($department->background_image_path);
                    }
                }

                // Update department record
                if ($type === 'logo') {
                    $department->logo_path = $path;
                } else {
                    $department->background_image_path = $path;
                }
                $department->save();

                // Log activity
                ActivityLog::create([
                    'user_id' => auth()->id(),
                    'action' => 'department_image_upload',
                    'description' => "Uploaded {$type} image for department: {$department->name}",
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                ]);

                return response()->json([
                    'success' => true,
                    'message' => ucfirst($type) . ' uploaded successfully',
                    'data' => [
                        'url' => public_file_url($path),
                        'path' => $path
                    ]
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'No file uploaded'
            ], 400);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Department image upload error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to upload image: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export department analytics to CSV
     */
    public function exportAnalytics($id, Request $request)
    {
        $format = $request->get('format', 'csv');
        
        try {
            $department = Department::withCount(['courses', 'alumniProfiles'])->findOrFail($id);
            $analytics = $department->getComprehensiveAnalytics();

            // Export based on format
            switch ($format) {
                case 'excel':
                    return $this->exportDepartmentAnalyticsToExcel($department, $analytics);
                case 'pdf':
                    return $this->exportDepartmentAnalyticsToPdf($department, $analytics);
                case 'csv':
                default:
                    return $this->exportDepartmentAnalyticsToCsv($department, $analytics);
            }
        } catch (\Exception $e) {
            \Log::error('Department analytics export error', [
                'department_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to export department analytics'
            ], 500);
        }
    }

    /**
     * Export department analytics to CSV
     */
    private function exportDepartmentAnalyticsToCsv($department, $analytics)
    {
        // Prepare CSV data
        $csvData = "Department Analytics Report\n";
        $csvData .= "Generated on:," . date('Y-m-d H:i:s') . "\n";
        $csvData .= "Department:," . $department->name . " (" . $department->code . ")\n";
        $csvData .= "\n";

        // Basic Information
        $csvData .= "Basic Information\n";
        $csvData .= "Total Courses:," . $department->courses_count . "\n";
        $csvData .= "Total Alumni:," . $department->alumni_profiles_count . "\n";
        $csvData .= "\n";

        // Employment Statistics
        $csvData .= "Employment Statistics\n";
        $csvData .= "Employment Rate:," . round($analytics['employment']['employment_rate'], 1) . "%\n";
        $csvData .= "Average Time to Employment (Days):," . ($analytics['employment']['avg_time_to_employment_days'] ?? 'N/A') . "\n";
        $csvData .= "\n";

        // Employment Status Breakdown
        $csvData .= "Employment Status Breakdown\n";
        $csvData .= "Status,Count,Percentage\n";
        foreach ($analytics['employment']['status_breakdown'] as $status => $count) {
            $percentage = $department->alumni_profiles_count > 0 ? round(($count / $department->alumni_profiles_count) * 100, 1) : 0;
            $csvData .= ucfirst(str_replace('_', ' ', $status)) . ",$count,{$percentage}%\n";
        }
        $csvData .= "\n";

        // Top Employers
        if (!empty($analytics['employment']['top_employers'])) {
            $csvData .= "Top Employers\n";
            $csvData .= "Employer,Count\n";
            foreach ($analytics['employment']['top_employers'] as $employer) {
                $csvData .= "\"{$employer['name']}\",{$employer['count']}\n";
            }
            $csvData .= "\n";
        }

        // Career Fields Distribution
        if (!empty($analytics['career_fields']['distribution'])) {
            $csvData .= "Career Fields Distribution\n";
            $csvData .= "Field,Count,Percentage\n";
            foreach ($analytics['career_fields']['distribution'] as $field) {
                $csvData .= "\"{$field['field']}\",{$field['count']},{$field['percentage']}%\n";
            }
            $csvData .= "\n";
        }

        // Salary Distribution
        if (!empty($analytics['compensation']['salary_distribution'])) {
            $csvData .= "Salary Distribution\n";
            $csvData .= "Range,Count\n";
            foreach ($analytics['compensation']['salary_distribution'] as $range) {
                $csvData .= "\"{$range['range']}\",{$range['count']}\n";
            }
            $csvData .= "\n";
        }

        // Survey Participation
        $csvData .= "Survey Participation\n";
        $csvData .= "Total Surveys Sent:," . ($analytics['surveys']['total_sent'] ?? 0) . "\n";
        $csvData .= "Total Surveys Completed:," . ($analytics['surveys']['total_completed'] ?? 0) . "\n";
        $csvData .= "Completion Rate:," . round($analytics['surveys']['completion_rate'] ?? 0, 1) . "%\n";
        $csvData .= "\n";

        // Alumni Engagement
        $csvData .= "Alumni Engagement\n";
        $csvData .= "Willing to Mentor:," . ($analytics['engagement']['willing_to_mentor'] ?? 0) . "\n";
        $csvData .= "Mentor Rate:," . round($analytics['engagement']['willing_to_mentor_rate'] ?? 0, 1) . "%\n";

        return response($csvData, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="department_analytics_' . $department->code . '_' . date('Y-m-d') . '.csv"',
        ]);
    }

    /**
     * Export department analytics to Excel
     */
    private function exportDepartmentAnalyticsToExcel($department, $analytics)
    {
        // Prepare CSV data with UTF-8 BOM
        $csvData = "\xEF\xBB\xBF"; // UTF-8 BOM
        $csvData .= "Department Analytics Report\n";
        $csvData .= "Generated on:," . date('Y-m-d H:i:s') . "\n";
        $csvData .= "Department:," . $department->name . " (" . $department->code . ")\n";
        $csvData .= "\n";

        // Basic Information
        $csvData .= "Basic Information\n";
        $csvData .= "Total Courses:," . $department->courses_count . "\n";
        $csvData .= "Total Alumni:," . $department->alumni_profiles_count . "\n";
        $csvData .= "\n";

        // Employment Statistics
        $csvData .= "Employment Statistics\n";
        $csvData .= "Employment Rate:," . round($analytics['employment']['employment_rate'], 1) . "%\n";
        $csvData .= "Average Time to Employment (Days):," . ($analytics['employment']['avg_time_to_employment_days'] ?? 'N/A') . "\n";
        $csvData .= "\n";

        // Employment Status Breakdown
        $csvData .= "Employment Status Breakdown\n";
        $csvData .= "Status,Count,Percentage\n";
        foreach ($analytics['employment']['status_breakdown'] as $status => $count) {
            $percentage = $department->alumni_profiles_count > 0 ? round(($count / $department->alumni_profiles_count) * 100, 1) : 0;
            $csvData .= ucfirst(str_replace('_', ' ', $status)) . ",$count,{$percentage}%\n";
        }
        $csvData .= "\n";

        // Top Employers
        if (!empty($analytics['employment']['top_employers'])) {
            $csvData .= "Top Employers\n";
            $csvData .= "Employer,Count\n";
            foreach ($analytics['employment']['top_employers'] as $employer) {
                $csvData .= "\"{$employer['name']}\",{$employer['count']}\n";
            }
            $csvData .= "\n";
        }

        // Career Fields Distribution
        if (!empty($analytics['career_fields']['distribution'])) {
            $csvData .= "Career Fields Distribution\n";
            $csvData .= "Field,Count,Percentage\n";
            foreach ($analytics['career_fields']['distribution'] as $field) {
                $csvData .= "\"{$field['field']}\",{$field['count']},{$field['percentage']}%\n";
            }
            $csvData .= "\n";
        }

        // Salary Distribution
        if (!empty($analytics['compensation']['salary_distribution'])) {
            $csvData .= "Salary Distribution\n";
            $csvData .= "Range,Count\n";
            foreach ($analytics['compensation']['salary_distribution'] as $range) {
                $csvData .= "\"{$range['range']}\",{$range['count']}\n";
            }
            $csvData .= "\n";
        }

        // Survey Participation
        $csvData .= "Survey Participation\n";
        $csvData .= "Total Surveys Sent:," . ($analytics['surveys']['total_sent'] ?? 0) . "\n";
        $csvData .= "Total Surveys Completed:," . ($analytics['surveys']['total_completed'] ?? 0) . "\n";
        $csvData .= "Completion Rate:," . round($analytics['surveys']['completion_rate'] ?? 0, 1) . "%\n";
        $csvData .= "\n";

        // Alumni Engagement
        $csvData .= "Alumni Engagement\n";
        $csvData .= "Willing to Mentor:," . ($analytics['engagement']['willing_to_mentor'] ?? 0) . "\n";
        $csvData .= "Mentor Rate:," . round($analytics['engagement']['willing_to_mentor_rate'] ?? 0, 1) . "%\n";

        return response($csvData, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="department_analytics_' . $department->code . '_' . date('Y-m-d') . '.xlsx"',
        ]);
    }

    /**
     * Export department analytics to PDF
     */
    private function exportDepartmentAnalyticsToPdf($department, $analytics)
    {
        $html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
            h1 { color: #7c2d3f; border-bottom: 3px solid #7c2d3f; padding-bottom: 10px; }
            h2 { color: #555; border-bottom: 2px solid #ddd; padding-bottom: 8px; margin-top: 30px; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #7c2d3f; color: white; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .metric { background-color: #f5f5f5; padding: 10px; margin: 5px 0; border-left: 4px solid #7c2d3f; }
        </style></head><body>';
        
        $html .= '<h1>Department Analytics Report</h1>';
        $html .= '<p><strong>Generated:</strong> ' . date('Y-m-d H:i:s') . '</p>';
        $html .= '<p><strong>Department:</strong> ' . htmlspecialchars($department->name) . ' (' . htmlspecialchars($department->code) . ')</p>';
        
        // Key Metrics
        $html .= '<h2>Key Metrics</h2>';
        $html .= '<div class="metric"><strong>Total Courses:</strong> ' . $department->courses_count . '</div>';
        $html .= '<div class="metric"><strong>Total Alumni:</strong> ' . $department->alumni_profiles_count . '</div>';
        $html .= '<div class="metric"><strong>Employment Rate:</strong> ' . round($analytics['employment']['employment_rate'], 1) . '%</div>';
        $html .= '<div class="metric"><strong>Average Time to Employment:</strong> ' . ($analytics['employment']['avg_time_to_employment_days'] ?? 'N/A') . ' days</div>';
        
        // Employment Status Breakdown
        $html .= '<h2>Employment Status Breakdown</h2>';
        $html .= '<table><thead><tr><th>Status</th><th>Count</th><th>Percentage</th></tr></thead><tbody>';
        foreach ($analytics['employment']['status_breakdown'] as $status => $count) {
            $percentage = $department->alumni_profiles_count > 0 ? round(($count / $department->alumni_profiles_count) * 100, 1) : 0;
            $html .= '<tr><td>' . ucfirst(str_replace('_', ' ', $status)) . '</td><td>' . $count . '</td><td>' . $percentage . '%</td></tr>';
        }
        $html .= '</tbody></table>';
        
        // Top Employers (limit to 10 for PDF)
        if (!empty($analytics['employment']['top_employers'])) {
            $html .= '<h2>Top Employers</h2>';
            $html .= '<table><thead><tr><th>Employer</th><th>Alumni Count</th></tr></thead><tbody>';
            $topEmployers = array_slice($analytics['employment']['top_employers'], 0, 10);
            foreach ($topEmployers as $employer) {
                $html .= '<tr><td>' . htmlspecialchars($employer['name']) . '</td><td>' . $employer['count'] . '</td></tr>';
            }
            $html .= '</tbody></table>';
        }
        
        // Career Fields Distribution
        if (!empty($analytics['career_fields']['distribution'])) {
            $html .= '<h2>Career Fields Distribution</h2>';
            $html .= '<table><thead><tr><th>Field</th><th>Count</th><th>Percentage</th></tr></thead><tbody>';
            foreach ($analytics['career_fields']['distribution'] as $field) {
                $html .= '<tr><td>' . htmlspecialchars($field['field']) . '</td><td>' . $field['count'] . '</td><td>' . $field['percentage'] . '%</td></tr>';
            }
            $html .= '</tbody></table>';
        }
        
        // Engagement Metrics
        $html .= '<h2>Alumni Engagement</h2>';
        $html .= '<div class="metric"><strong>Willing to Mentor:</strong> ' . ($analytics['engagement']['willing_to_mentor'] ?? 0) . ' (' . round($analytics['engagement']['willing_to_mentor_rate'] ?? 0, 1) . '%)</div>';
        
        $html .= '</body></html>';
        
        return $this->renderPdf($html, 'department_analytics_' . $department->code . '_' . date('Y-m-d') . '.pdf');
    }
}
