<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CareerHistory;
use App\Models\CareerHistoryVersion;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CareerVersionController extends Controller
{
    /**
     * Display list of all users with career history
     */
    public function index(Request $request)
    {
        $search = $request->input('search', '');
        
        $query = User::whereHas('careerHistory')
            ->with(['careerHistory' => function ($q) {
                $q->withTrashed();
            }])
            ->withCount(['careerHistory as active_positions' => function ($q) {
                $q->whereNull('deleted_at');
            }])
            ->withCount(['careerHistory as archived_positions' => function ($q) {
                $q->onlyTrashed();
            }]);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $users = $query->paginate(20);

        return Inertia::render('admin/CareerVersions/Index', [
            'users' => $users,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    /**
     * View a user's career history with all versions
     */
    public function show(Request $request, $userId)
    {
        $user = User::with(['careerHistory' => function ($q) {
            $q->withTrashed();
        }])->findOrFail($userId);

        $careerHistories = CareerHistory::withTrashed()
            ->where('user_id', $userId)
            ->with(['versions' => function ($q) {
                $q->orderBy('version_number', 'desc');
            }])
            ->ordered()
            ->get();

        return Inertia::render('admin/CareerVersions/Show', [
            'alumniUser' => $user,
            'careerHistories' => $careerHistories,
        ]);
    }

    /**
     * View version history for a specific career record
     */
    public function versions(Request $request, $careerId)
    {
        $careerHistory = CareerHistory::withTrashed()
            ->with(['user', 'versions.modifiedBy'])
            ->findOrFail($careerId);

        $versions = CareerHistoryVersion::where('career_history_id', $careerId)
            ->with('modifiedBy')
            ->orderBy('version_number', 'desc')
            ->get();

        return Inertia::render('admin/CareerVersions/Versions', [
            'careerHistory' => $careerHistory,
            'versions' => $versions,
        ]);
    }

    /**
     * Admin can restore an archived career record
     */
    public function restore(Request $request, $careerId)
    {
        $careerHistory = CareerHistory::withTrashed()->findOrFail($careerId);
        
        if (!$careerHistory->trashed()) {
            return redirect()->back()->with('error', 'This career record is not archived.');
        }

        $admin = $request->user();
        $careerHistory->restoreRecord($admin->id);

        return redirect()->back()->with('success', 'Career record restored successfully.');
    }

    /**
     * Admin can permanently delete a career record (use with caution)
     */
    public function forceDelete(Request $request, $careerId)
    {
        $careerHistory = CareerHistory::withTrashed()->findOrFail($careerId);
        
        // Store info for logging before deletion
        $userId = $careerHistory->user_id;
        $jobTitle = $careerHistory->job_title;
        $companyName = $careerHistory->company_name;

        // Delete all versions first
        CareerHistoryVersion::where('career_history_id', $careerId)->delete();
        
        // Force delete the record
        $careerHistory->forceDelete();

        // Log the permanent deletion
        \App\Models\ActivityLog::logActivity(
            $request->user()->id,
            'career_permanently_deleted',
            "Admin permanently deleted career record: {$jobTitle} at {$companyName} for user ID: {$userId}",
            'CareerHistory',
            $careerId
        );

        return redirect()->back()->with('success', 'Career record permanently deleted.');
    }
}
