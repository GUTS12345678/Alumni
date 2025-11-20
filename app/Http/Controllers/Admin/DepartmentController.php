<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Course;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class DepartmentController extends Controller
{
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
        ]);

        $oldData = $department->toArray();
        $department->update($validated);

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
                    'current_employment_status' => $profile->current_employment_status,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $alumni
        ]);
    }

    /**
     * Get comprehensive analytics for a department
     */
    public function getAnalytics($id)
    {
        try {
            $department = Department::findOrFail($id);
            
            $analytics = $department->getComprehensiveAnalytics();

            return response()->json([
                'success' => true,
                'data' => $analytics
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch analytics: ' . $e->getMessage()
            ], 500);
        }
    }
}

