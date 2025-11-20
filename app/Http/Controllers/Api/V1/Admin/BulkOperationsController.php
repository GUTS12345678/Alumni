<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\AlumniProfile;
use App\Models\Survey;
use App\Models\Department;
use App\Models\Course;
use App\Models\Batch;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class BulkOperationsController extends Controller
{
    /**
     * Bulk delete records (soft delete)
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'required|integer',
            'resource' => ['required', 'string', Rule::in(['alumni', 'surveys', 'departments', 'courses', 'batches', 'users'])]
        ]);

        $ids = $request->input('ids');
        $resource = $request->input('resource');

        try {
            DB::beginTransaction();

            $deletedCount = 0;

            switch ($resource) {
                case 'alumni':
                    $deletedCount = AlumniProfile::whereIn('id', $ids)->delete();
                    $message = "$deletedCount alumni profile(s) deleted successfully";
                    break;

                case 'surveys':
                    $deletedCount = Survey::whereIn('id', $ids)->delete();
                    $message = "$deletedCount survey(s) deleted successfully";
                    break;

                case 'departments':
                    // Check if departments have courses
                    $departmentsWithCourses = Department::whereIn('id', $ids)
                        ->whereHas('courses')
                        ->count();
                    
                    if ($departmentsWithCourses > 0) {
                        DB::rollBack();
                        return response()->json([
                            'success' => false,
                            'message' => "Cannot delete departments that have courses. Please delete courses first or reassign them."
                        ], 422);
                    }

                    $deletedCount = Department::whereIn('id', $ids)->delete();
                    $message = "$deletedCount department(s) deleted successfully";
                    break;

                case 'courses':
                    // Check if courses have alumni
                    $coursesWithAlumni = Course::whereIn('id', $ids)
                        ->whereHas('alumniProfiles')
                        ->count();
                    
                    if ($coursesWithAlumni > 0) {
                        DB::rollBack();
                        return response()->json([
                            'success' => false,
                            'message' => "Cannot delete courses that have alumni profiles. Please reassign alumni first."
                        ], 422);
                    }

                    $deletedCount = Course::whereIn('id', $ids)->delete();
                    $message = "$deletedCount course(s) deleted successfully";
                    break;

                case 'batches':
                    $deletedCount = Batch::whereIn('id', $ids)->delete();
                    $message = "$deletedCount batch(es) deleted successfully";
                    break;

                case 'users':
                    // Prevent deletion of current user
                    $currentUserId = auth()->id();
                    if (in_array($currentUserId, $ids)) {
                        DB::rollBack();
                        return response()->json([
                            'success' => false,
                            'message' => "Cannot delete your own account"
                        ], 422);
                    }

                    // Prevent deletion of super admin
                    $superAdmins = User::whereIn('id', $ids)
                        ->whereHas('roles', function ($query) {
                            $query->where('name', 'Super Admin');
                        })
                        ->count();
                    
                    if ($superAdmins > 0) {
                        DB::rollBack();
                        return response()->json([
                            'success' => false,
                            'message' => "Cannot delete Super Admin accounts"
                        ], 422);
                    }

                    $deletedCount = User::whereIn('id', $ids)->delete();
                    $message = "$deletedCount user(s) deleted successfully";
                    break;

                default:
                    DB::rollBack();
                    return response()->json([
                        'success' => false,
                        'message' => 'Invalid resource type'
                    ], 422);
            }

            DB::commit();

            // Log the action
            Log::info("Bulk delete: $message", [
                'user_id' => auth()->id(),
                'resource' => $resource,
                'ids' => $ids,
                'count' => $deletedCount
            ]);

            return response()->json([
                'success' => true,
                'message' => $message,
                'deleted_count' => $deletedCount
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Bulk delete error: ' . $e->getMessage(), [
                'resource' => $resource,
                'ids' => $ids,
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while deleting records: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Bulk restore soft-deleted records
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function bulkRestore(Request $request)
    {
        $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'required|integer',
            'resource' => ['required', 'string', Rule::in(['alumni', 'surveys', 'departments', 'courses', 'batches', 'users'])]
        ]);

        $ids = $request->input('ids');
        $resource = $request->input('resource');

        try {
            DB::beginTransaction();

            $restoredCount = 0;

            switch ($resource) {
                case 'alumni':
                    $restoredCount = AlumniProfile::withTrashed()
                        ->whereIn('id', $ids)
                        ->restore();
                    $message = "$restoredCount alumni profile(s) restored successfully";
                    break;

                case 'surveys':
                    $restoredCount = Survey::withTrashed()
                        ->whereIn('id', $ids)
                        ->restore();
                    $message = "$restoredCount survey(s) restored successfully";
                    break;

                case 'departments':
                    $restoredCount = Department::withTrashed()
                        ->whereIn('id', $ids)
                        ->restore();
                    $message = "$restoredCount department(s) restored successfully";
                    break;

                case 'courses':
                    $restoredCount = Course::withTrashed()
                        ->whereIn('id', $ids)
                        ->restore();
                    $message = "$restoredCount course(s) restored successfully";
                    break;

                case 'batches':
                    $restoredCount = Batch::withTrashed()
                        ->whereIn('id', $ids)
                        ->restore();
                    $message = "$restoredCount batch(es) restored successfully";
                    break;

                case 'users':
                    $restoredCount = User::withTrashed()
                        ->whereIn('id', $ids)
                        ->restore();
                    $message = "$restoredCount user(s) restored successfully";
                    break;

                default:
                    DB::rollBack();
                    return response()->json([
                        'success' => false,
                        'message' => 'Invalid resource type'
                    ], 422);
            }

            DB::commit();

            Log::info("Bulk restore: $message", [
                'user_id' => auth()->id(),
                'resource' => $resource,
                'ids' => $ids,
                'count' => $restoredCount
            ]);

            return response()->json([
                'success' => true,
                'message' => $message,
                'restored_count' => $restoredCount
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Bulk restore error: ' . $e->getMessage(), [
                'resource' => $resource,
                'ids' => $ids,
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while restoring records: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Bulk export records to CSV
     *
     * @param Request $request
     * @return \Symfony\Component\HttpFoundation\StreamedResponse
     */
    public function bulkExport(Request $request)
    {
        $request->validate([
            'ids' => 'nullable|array',
            'ids.*' => 'integer',
            'resource' => ['required', 'string', Rule::in(['alumni', 'surveys', 'departments', 'courses', 'batches', 'users'])]
        ]);

        $ids = $request->input('ids', []);
        $resource = $request->input('resource');

        try {
            $headers = [
                'Content-Type' => 'text/csv',
                'Content-Disposition' => "attachment; filename={$resource}_export_" . date('Y-m-d_His') . ".csv",
            ];

            $callback = function () use ($resource, $ids) {
                $file = fopen('php://output', 'w');

                // Write BOM for UTF-8
                fprintf($file, chr(0xEF) . chr(0xBB) . chr(0xBF));

                switch ($resource) {
                    case 'alumni':
                        $this->exportAlumni($file, $ids);
                        break;
                    case 'surveys':
                        $this->exportSurveys($file, $ids);
                        break;
                    case 'departments':
                        $this->exportDepartments($file, $ids);
                        break;
                    case 'courses':
                        $this->exportCourses($file, $ids);
                        break;
                    case 'batches':
                        $this->exportBatches($file, $ids);
                        break;
                    case 'users':
                        $this->exportUsers($file, $ids);
                        break;
                }

                fclose($file);
            };

            return response()->stream($callback, 200, $headers);

        } catch (\Exception $e) {
            Log::error('Bulk export error: ' . $e->getMessage(), [
                'resource' => $resource,
                'ids' => $ids,
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while exporting records: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export alumni profiles to CSV
     */
    private function exportAlumni($file, array $ids)
    {
        fputcsv($file, ['ID', 'First Name', 'Last Name', 'Email', 'Department', 'Course', 'Batch', 'Employment Status', 'Created At']);

        $query = AlumniProfile::with(['department', 'course', 'batch']);
        
        if (!empty($ids)) {
            $query->whereIn('id', $ids);
        }

        $query->chunk(100, function ($alumni) use ($file) {
            foreach ($alumni as $alum) {
                fputcsv($file, [
                    $alum->id,
                    $alum->first_name,
                    $alum->last_name,
                    $alum->email,
                    $alum->department->name ?? 'N/A',
                    $alum->course->name ?? 'N/A',
                    $alum->batch->name ?? 'N/A',
                    $alum->employment_status ?? 'N/A',
                    $alum->created_at->format('Y-m-d H:i:s')
                ]);
            }
        });
    }

    /**
     * Export surveys to CSV
     */
    private function exportSurveys($file, array $ids)
    {
        fputcsv($file, ['ID', 'Title', 'Description', 'Status', 'Type', 'Response Count', 'Created At']);

        $query = Survey::withCount('responses');
        
        if (!empty($ids)) {
            $query->whereIn('id', $ids);
        }

        $query->chunk(100, function ($surveys) use ($file) {
            foreach ($surveys as $survey) {
                fputcsv($file, [
                    $survey->id,
                    $survey->title,
                    $survey->description,
                    $survey->status,
                    $survey->survey_type,
                    $survey->responses_count,
                    $survey->created_at->format('Y-m-d H:i:s')
                ]);
            }
        });
    }

    /**
     * Export departments to CSV
     */
    private function exportDepartments($file, array $ids)
    {
        fputcsv($file, ['ID', 'Name', 'Code', 'Description', 'Course Count', 'Alumni Count', 'Created At']);

        $query = Department::withCount(['courses', 'alumniProfiles']);
        
        if (!empty($ids)) {
            $query->whereIn('id', $ids);
        }

        $query->chunk(100, function ($departments) use ($file) {
            foreach ($departments as $dept) {
                fputcsv($file, [
                    $dept->id,
                    $dept->name,
                    $dept->code,
                    $dept->description,
                    $dept->courses_count,
                    $dept->alumni_profiles_count,
                    $dept->created_at->format('Y-m-d H:i:s')
                ]);
            }
        });
    }

    /**
     * Export courses to CSV
     */
    private function exportCourses($file, array $ids)
    {
        fputcsv($file, ['ID', 'Name', 'Code', 'Department', 'Description', 'Alumni Count', 'Created At']);

        $query = Course::with('department')->withCount('alumniProfiles');
        
        if (!empty($ids)) {
            $query->whereIn('id', $ids);
        }

        $query->chunk(100, function ($courses) use ($file) {
            foreach ($courses as $course) {
                fputcsv($file, [
                    $course->id,
                    $course->name,
                    $course->code,
                    $course->department->name ?? 'N/A',
                    $course->description,
                    $course->alumni_profiles_count,
                    $course->created_at->format('Y-m-d H:i:s')
                ]);
            }
        });
    }

    /**
     * Export batches to CSV
     */
    private function exportBatches($file, array $ids)
    {
        fputcsv($file, ['ID', 'Name', 'Year', 'Description', 'Alumni Count', 'Created At']);

        $query = Batch::withCount('alumniProfiles');
        
        if (!empty($ids)) {
            $query->whereIn('id', $ids);
        }

        $query->chunk(100, function ($batches) use ($file) {
            foreach ($batches as $batch) {
                fputcsv($file, [
                    $batch->id,
                    $batch->name,
                    $batch->year,
                    $batch->description,
                    $batch->alumni_profiles_count,
                    $batch->created_at->format('Y-m-d H:i:s')
                ]);
            }
        });
    }

    /**
     * Export users to CSV
     */
    private function exportUsers($file, array $ids)
    {
        fputcsv($file, ['ID', 'Name', 'Email', 'Role', 'Status', 'Created At']);

        $query = User::with('roles');
        
        if (!empty($ids)) {
            $query->whereIn('id', $ids);
        }

        $query->chunk(100, function ($users) use ($file) {
            foreach ($users as $user) {
                fputcsv($file, [
                    $user->id,
                    $user->name,
                    $user->email,
                    $user->roles->pluck('name')->implode(', '),
                    $user->status ?? 'active',
                    $user->created_at->format('Y-m-d H:i:s')
                ]);
            }
        });
    }

    /**
     * Bulk update status for records
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function bulkUpdateStatus(Request $request)
    {
        $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'required|integer',
            'resource' => ['required', 'string', Rule::in(['surveys', 'users'])],
            'status' => 'required|string'
        ]);

        $ids = $request->input('ids');
        $resource = $request->input('resource');
        $status = $request->input('status');

        try {
            DB::beginTransaction();

            $updatedCount = 0;

            switch ($resource) {
                case 'surveys':
                    $updatedCount = Survey::whereIn('id', $ids)
                        ->update(['status' => $status]);
                    $message = "$updatedCount survey(s) status updated to '$status'";
                    break;

                case 'users':
                    $updatedCount = User::whereIn('id', $ids)
                        ->update(['status' => $status]);
                    $message = "$updatedCount user(s) status updated to '$status'";
                    break;

                default:
                    DB::rollBack();
                    return response()->json([
                        'success' => false,
                        'message' => 'Status update not supported for this resource'
                    ], 422);
            }

            DB::commit();

            Log::info("Bulk status update: $message", [
                'user_id' => auth()->id(),
                'resource' => $resource,
                'ids' => $ids,
                'status' => $status,
                'count' => $updatedCount
            ]);

            return response()->json([
                'success' => true,
                'message' => $message,
                'updated_count' => $updatedCount
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Bulk status update error: ' . $e->getMessage(), [
                'resource' => $resource,
                'ids' => $ids,
                'status' => $status,
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating status: ' . $e->getMessage()
            ], 500);
        }
    }
}
