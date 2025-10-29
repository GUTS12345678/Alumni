<?php

namespace App\Http\Controllers\Alumni;

use App\Http\Controllers\Controller;
use App\Models\JobPosting;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class JobController extends Controller
{
    /**
     * Display job board
     */
    public function index(Request $request)
    {
        $query = JobPosting::with(['user.alumniProfile'])
            ->active()
            ->orderBy('created_at', 'desc');

        // Search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('company_name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Job type filter
        if ($request->filled('job_type')) {
            $query->where('job_type', $request->job_type);
        }

        // Experience level filter
        if ($request->filled('experience_level')) {
            $query->where('experience_level', $request->experience_level);
        }

        $jobs = $query->paginate(12);

        return Inertia::render('Alumni/Jobs', [
            'jobs' => $jobs,
            'filters' => $request->only(['search', 'job_type', 'experience_level']),
        ]);
    }

    /**
     * Show job details
     */
    public function show($id)
    {
        $job = JobPosting::with(['user.alumniProfile'])->findOrFail($id);
        
        // Increment views
        $job->incrementViews();

        return Inertia::render('Alumni/JobDetails', [
            'job' => $job,
        ]);
    }

    /**
     * Store a new job posting
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'company_name' => 'required|string|max:255',
            'location' => 'required|string|max:255',
            'job_type' => 'required|in:full_time,part_time,contract,remote',
            'experience_level' => 'required|in:entry,mid,senior',
            'description' => 'required|string',
            'requirements' => 'nullable|string',
            'salary_min' => 'nullable|numeric|min:0',
            'salary_max' => 'nullable|numeric|min:0|gte:salary_min',
            'salary_currency' => 'nullable|string|size:3',
            'application_email' => 'nullable|email',
            'application_url' => 'nullable|url',
            'deadline' => 'nullable|date|after:today',
            'skills_required' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }

        $user = $request->user();

        $job = JobPosting::create([
            'user_id' => $user->id,
            ...$request->all(),
            'status' => 'active',
        ]);

        ActivityLog::logActivity(
            $user->id,
            'job_posted',
            "Posted job: {$job->title} at {$job->company_name}",
            'JobPosting',
            $job->id
        );

        return redirect()->back()->with('success', 'Job posted successfully!');
    }

    /**
     * Update job posting
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'company_name' => 'required|string|max:255',
            'location' => 'required|string|max:255',
            'job_type' => 'required|in:full_time,part_time,contract,remote',
            'experience_level' => 'required|in:entry,mid,senior',
            'description' => 'required|string',
            'requirements' => 'nullable|string',
            'salary_min' => 'nullable|numeric|min:0',
            'salary_max' => 'nullable|numeric|min:0|gte:salary_min',
            'salary_currency' => 'nullable|string|size:3',
            'application_email' => 'nullable|email',
            'application_url' => 'nullable|url',
            'deadline' => 'nullable|date',
            'skills_required' => 'nullable|array',
            'status' => 'in:active,closed,draft',
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }

        $user = $request->user();
        $job = JobPosting::where('id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $job->update($request->all());

        ActivityLog::logActivity(
            $user->id,
            'job_updated',
            "Updated job: {$job->title}",
            'JobPosting',
            $job->id
        );

        return redirect()->back()->with('success', 'Job updated successfully!');
    }

    /**
     * Delete job posting
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $job = JobPosting::where('id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $title = $job->title;
        $job->delete();

        ActivityLog::logActivity(
            $user->id,
            'job_deleted',
            "Deleted job: {$title}",
            'JobPosting',
            $id
        );

        return redirect()->back()->with('success', 'Job deleted successfully!');
    }
}
