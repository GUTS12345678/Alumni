<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Course;
use App\Models\Department;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CourseController extends Controller
{
    /**
     * Get all courses with statistics
     */
    public function index(Request $request)
    {
        $query = Course::with('department')->withCount('alumniProfiles');

        // Filter by department
        if ($request->has('department_id')) {
            $query->where('department_id', $request->department_id);
        }

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
            $courses = $query->get();
            return response()->json([
                'success' => true,
                'data' => $courses
            ]);
        }

        $perPage = $request->get('per_page', 15);
        $courses = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $courses->items(),
            'meta' => [
                'current_page' => $courses->currentPage(),
                'total' => $courses->total(),
                'per_page' => $courses->perPage(),
                'last_page' => $courses->lastPage(),
            ]
        ]);
    }

    /**
     * Store a new course
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'department_id' => 'required|exists:departments,id',
                'name' => 'required|string|max:255',
                'code' => [
                    'required',
                    'string',
                    'max:50',
                    Rule::unique('courses')->where(function ($query) use ($request) {
                        return $query->where('department_id', $request->department_id);
                    }),
                ],
                'description' => 'nullable|string',
                'majors' => 'nullable|string',
                'duration_years' => 'required|integer|min:1|max:10',
                'status' => 'required|in:active,inactive',
                'campus_id' => 'nullable|integer|exists:campuses,id',
            ]);

            $course = Course::create($validated);
            $course->load('department');

            // Log activity
            try {
                ActivityLog::logActivity(
                    auth()->id(),
                    'course_created',
                    "Created course: {$course->name} in {$course->department->name}",
                    'Course',
                    $course->id
                );
            } catch (\Exception $e) {
                \Log::error('Failed to log course creation activity: ' . $e->getMessage());
            }

            return response()->json([
                'success' => true,
                'message' => 'Course created successfully',
                'data' => $course
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Course creation failed: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to create course: ' . $e->getMessage(),
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Show a specific course
     */
    public function show($id)
    {
        $course = Course::with('department')
            ->withCount('alumniProfiles')
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $course
        ]);
    }

    /**
     * Update a course
     */
    public function update(Request $request, $id)
    {
        $course = Course::findOrFail($id);

        $validated = $request->validate([
            'department_id' => 'required|exists:departments,id',
            'name' => 'required|string|max:255',
            'code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('courses')->where(function ($query) use ($request) {
                    return $query->where('department_id', $request->department_id);
                })->ignore($id),
            ],
            'description' => 'nullable|string',
            'majors' => 'nullable|string',
            'duration_years' => 'required|integer|min:1|max:10',
            'status' => 'required|in:active,inactive',
            'campus_id' => 'nullable|integer|exists:campuses,id',
        ]);

        $oldData = $course->toArray();
        $course->update($validated);
        $course->load('department');

        // Log activity
        ActivityLog::logActivity(
            auth()->id(),
            'course_updated',
            "Updated course: {$course->name}",
            'Course',
            $course->id,
            ['old' => $oldData, 'new' => $course->toArray()]
        );

        return response()->json([
            'success' => true,
            'message' => 'Course updated successfully',
            'data' => $course
        ]);
    }

    /**
     * Delete a course (soft delete)
     */
    public function destroy(Request $request, $id)
    {
        $course = Course::findOrFail($id);

        // Check if force delete is requested
        $forceDelete = $request->boolean('force');

        // Check if course has alumni
        $alumniCount = $course->alumniProfiles()->count();
        
        if ($alumniCount > 0 && !$forceDelete) {
            // Get available courses in the same department for reassignment
            $alternativeCourses = Course::where('department_id', $course->department_id)
                ->where('id', '!=', $course->id)
                ->where('status', 'active')
                ->select('id', 'name', 'code')
                ->get();
            
            return response()->json([
                'success' => false,
                'message' => "Cannot delete course with {$alumniCount} existing alumni. Please reassign alumni first.",
                'alumni_count' => $alumniCount,
                'alternative_courses' => $alternativeCourses,
                'requires_reassignment' => true
            ], 422);
        }

        // Soft delete
        $course->delete();

        // Log activity
        ActivityLog::logActivity(
            auth()->id(),
            'course_deleted',
            "Deleted course: {$course->name}" . ($alumniCount > 0 ? " (with {$alumniCount} alumni)" : ''),
            'Course',
            $course->id
        );

        return response()->json([
            'success' => true,
            'message' => 'Course deleted successfully'
        ]);
    }

    /**
     * Restore a soft-deleted course
     */
    public function restore($id)
    {
        $course = Course::withTrashed()->findOrFail($id);

        if (!$course->trashed()) {
            return response()->json([
                'success' => false,
                'message' => 'Course is not deleted'
            ], 422);
        }

        $course->restore();

        // Log activity
        ActivityLog::logActivity(
            auth()->id(),
            'course_restored',
            "Restored course: {$course->name}",
            'Course',
            $course->id
        );

        return response()->json([
            'success' => true,
            'message' => 'Course restored successfully',
            'data' => $course->load('department')
        ]);
    }

    /**
     * Reassign alumni from one course to another
     */
    public function reassignAlumni(Request $request, $id)
    {
        $request->validate([
            'target_course_id' => 'required|exists:courses,id'
        ]);

        $sourceCourse = Course::findOrFail($id);
        $targetCourse = Course::findOrFail($request->target_course_id);

        // Ensure target course is in the same department
        if ($sourceCourse->department_id !== $targetCourse->department_id) {
            return response()->json([
                'success' => false,
                'message' => 'Target course must be in the same department'
            ], 422);
        }

        // Get all alumni from source course
        $alumniCount = $sourceCourse->alumniProfiles()->count();

        // Reassign alumni
        $sourceCourse->alumniProfiles()->update([
            'course_id' => $targetCourse->id
        ]);

        // Log activity
        ActivityLog::logActivity(
            auth()->id(),
            'alumni_reassigned',
            "Reassigned {$alumniCount} alumni from {$sourceCourse->name} to {$targetCourse->name}",
            'Course',
            $sourceCourse->id
        );

        return response()->json([
            'success' => true,
            'message' => "Successfully reassigned {$alumniCount} alumni to {$targetCourse->name}",
            'alumni_count' => $alumniCount
        ]);
    }

    /**
     * Get course statistics
     */
    public function statistics()
    {
        $stats = [
            'total_courses' => Course::withTrashed()->count(),
            'active_courses' => Course::where('status', 'active')->count(),
            'inactive_courses' => Course::where('status', 'inactive')->count(),
            'deleted_courses' => Course::onlyTrashed()->count(),
            'courses_with_alumni' => Course::has('alumniProfiles')->count(),
            'total_alumni' => \App\Models\AlumniProfile::whereNotNull('course_id')->count(),
            'total_departments' => Course::distinct('department_id')->count('department_id')
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }
}

