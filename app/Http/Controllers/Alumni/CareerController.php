<?php

namespace App\Http\Controllers\Alumni;

use App\Http\Controllers\Controller;
use App\Models\CareerHistory;
use App\Models\CareerHistoryVersion;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class CareerController extends Controller
{
    /**
     * Display career timeline
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        $careerHistory = CareerHistory::where('user_id', $user->id)
            ->ordered()
            ->get();

        // Calculate total experience months
        $totalExperienceMonths = 0;
        foreach ($careerHistory as $career) {
            $totalExperienceMonths += $career->getDurationInMonths();
        }

        $stats = [
            'total_positions' => $careerHistory->count(),
            'current_positions' => $careerHistory->where('is_current', true)->count(),
            'total_experience_months' => $totalExperienceMonths,
        ];

        return Inertia::render('Alumni/Career/Timeline', [
            'careerHistory' => $careerHistory,
            'stats' => $stats,
        ]);
    }

    /**
     * Store a new career position
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'job_title' => 'required|string|max:255',
            'company_name' => 'required|string|max:255',
            'company_location' => 'nullable|string|max:255',
            'employment_type' => 'nullable|in:full_time,part_time,contract,freelance,internship',
            'job_description' => 'nullable|string',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'is_current' => 'required|boolean',
            'industry' => 'nullable|string|max:255',
            'skills_used' => 'nullable|array',
            'achievements' => 'nullable|array',
            'salary' => 'nullable|numeric|min:0',
            'salary_currency' => 'nullable|string|size:3',
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }

        $user = $request->user();

        // If marking as current, update other positions to not current
        if ($request->is_current) {
            CareerHistory::where('user_id', $user->id)
                ->where('is_current', true)
                ->update(['is_current' => false, 'end_date' => now()]);
        }

        $career = CareerHistory::create([
            'user_id' => $user->id,
            ...$request->only([
                'job_title', 'company_name', 'company_location', 'employment_type',
                'job_description', 'start_date', 'end_date', 'is_current',
                'industry', 'skills_used', 'achievements', 'salary', 'salary_currency',
            ]),
        ]);

        // Create initial version snapshot
        CareerHistoryVersion::createSnapshot($career, 'created', $user->id);

        ActivityLog::logActivity(
            $user->id,
            'career_added',
            "Added career position: {$career->job_title} at {$career->company_name}",
            'CareerHistory',
            $career->id
        );

        return redirect()->back()->with('success', 'Career position added successfully!');
    }

    /**
     * Update career position
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'job_title' => 'required|string|max:255',
            'company_name' => 'required|string|max:255',
            'company_location' => 'nullable|string|max:255',
            'employment_type' => 'nullable|in:full_time,part_time,contract,freelance,internship',
            'job_description' => 'nullable|string',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'is_current' => 'required|boolean',
            'industry' => 'nullable|string|max:255',
            'skills_used' => 'nullable|array',
            'achievements' => 'nullable|array',
            'salary' => 'nullable|numeric|min:0',
            'salary_currency' => 'nullable|string|size:3',
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }

        $user = $request->user();

        $career = CareerHistory::where('id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        // If marking as current, update other positions to not current
        if ($request->is_current && !$career->is_current) {
            CareerHistory::where('user_id', $user->id)
                ->where('id', '!=', $id)
                ->where('is_current', true)
                ->update(['is_current' => false, 'end_date' => now()]);
        }

        // Track changes before updating
        $changes = $career->getFieldChanges($request->all());

        // Create version snapshot before updating (only if there are actual changes)
        if (!empty($changes)) {
            CareerHistoryVersion::createSnapshot(
                $career, 
                'updated', 
                $user->id, 
                $changes,
                $request->input('change_notes')
            );
        }

        $career->update($request->only([
            'job_title', 'company_name', 'company_location', 'employment_type',
            'job_description', 'start_date', 'end_date', 'is_current',
            'industry', 'skills_used', 'achievements', 'salary', 'salary_currency',
        ]));

        ActivityLog::logActivity(
            $user->id,
            'career_updated',
            "Updated career position: {$career->job_title} at {$career->company_name}",
            'CareerHistory',
            $career->id
        );

        return redirect()->back()->with('success', 'Career position updated successfully!');
    }

    /**
     * Archive career position (soft delete with versioning)
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();

        $career = CareerHistory::where('id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $jobTitle = $career->job_title;
        $companyName = $career->company_name;

        // Get archive reason from request (optional)
        $reason = $request->input('reason', 'Removed by user');

        // Archive instead of hard delete
        $career->archive($user->id, $reason);

        ActivityLog::logActivity(
            $user->id,
            'career_archived',
            "Archived career position: {$jobTitle} at {$companyName}",
            'CareerHistory',
            $id
        );

        return redirect()->back()->with('success', 'Career position archived successfully!');
    }

    /**
     * Restore an archived career position
     */
    public function restore(Request $request, $id)
    {
        $user = $request->user();

        $career = CareerHistory::withTrashed()
            ->where('id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $career->restoreRecord($user->id);

        ActivityLog::logActivity(
            $user->id,
            'career_restored',
            "Restored career position: {$career->job_title} at {$career->company_name}",
            'CareerHistory',
            $id
        );

        return redirect()->back()->with('success', 'Career position restored successfully!');
    }

    /**
     * Get archived career positions
     */
    public function archived(Request $request)
    {
        $user = $request->user();
        
        $archivedCareers = CareerHistory::onlyTrashed()
            ->where('user_id', $user->id)
            ->ordered()
            ->get();

        return Inertia::render('Alumni/Career/Archived', [
            'archivedCareers' => $archivedCareers,
        ]);
    }
}
