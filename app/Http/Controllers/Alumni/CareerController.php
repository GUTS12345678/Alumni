<?php

namespace App\Http\Controllers\Alumni;

use App\Http\Controllers\Controller;
use App\Models\CareerHistory;
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
            ...$request->all()
        ]);

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

        $career->update($request->all());

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
     * Delete career position
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();

        $career = CareerHistory::where('id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $jobTitle = $career->job_title;
        $companyName = $career->company_name;

        $career->delete();

        ActivityLog::logActivity(
            $user->id,
            'career_deleted',
            "Deleted career position: {$jobTitle} at {$companyName}",
            'CareerHistory',
            $id
        );

        return redirect()->back()->with('success', 'Career position deleted successfully!');
    }
}
