<?php

namespace App\Http\Controllers\Alumni;

use App\Http\Controllers\Controller;
use App\Models\JobPosting;
use App\Models\JobApplication;
use App\Models\SavedJob;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
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
                  ->orWhere('content', 'like', "%{$search}%");
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
            'content' => 'required|string',
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
            ...$request->only([
                'title', 'company_name', 'location', 'job_type', 'experience_level',
                'content', 'requirements', 'salary_min', 'salary_max', 'salary_currency',
                'application_email', 'application_url', 'deadline', 'skills_required',
            ]),
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
            'content' => 'required|string',
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

        $job->update($request->only([
            'title', 'company_name', 'location', 'job_type', 'experience_level',
            'content', 'requirements', 'salary_min', 'salary_max', 'salary_currency',
            'application_email', 'application_url', 'deadline', 'skills_required', 'status',
        ]));

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

    /**
     * Save/Bookmark a job
     */
    public function saveJob(Request $request, $id)
    {
        $user = $request->user();
        $job = JobPosting::findOrFail($id);

        $saved = SavedJob::firstOrCreate([
            'job_posting_id' => $job->id,
            'user_id' => $user->id,
        ]);

        if ($saved->wasRecentlyCreated) {
            ActivityLog::logActivity(
                $user->id,
                'job_saved',
                "Saved job: {$job->title}",
                'SavedJob',
                $saved->id
            );

            return back()->with('success', 'Job saved successfully!');
        }

        return back()->with('info', 'Job already saved!');
    }

    /**
     * Unsave/Remove bookmark from a job
     */
    public function unsaveJob(Request $request, $id)
    {
        $user = $request->user();
        $job = JobPosting::findOrFail($id);

        SavedJob::where('job_posting_id', $job->id)
            ->where('user_id', $user->id)
            ->delete();

        ActivityLog::logActivity(
            $user->id,
            'job_unsaved',
            "Unsaved job: {$job->title}",
            'JobPosting',
            $job->id
        );

        return back()->with('success', 'Job removed from saved!');
    }

    /**
     * Get saved jobs
     */
    public function savedJobs(Request $request)
    {
        $user = $request->user();

        $savedJobs = SavedJob::with(['jobPosting.user.alumniProfile'])
            ->where('user_id', $user->id)
            ->latest()
            ->paginate(12);

        // Transform the data to include job posting details and application status
        $savedJobs->getCollection()->transform(function ($saved) use ($user) {
            $job = $saved->jobPosting;
            return [
                'id' => $job->id,
                'title' => $job->title,
                'company_name' => $job->company_name,
                'location' => $job->location,
                'job_type' => $job->job_type,
                'experience_level' => $job->experience_level,
                'content' => $job->content,
                'requirements' => $job->requirements,
                'formatted_salary' => $job->formatted_salary,
                'deadline' => $job->deadline,
                'application_deadline' => $job->application_deadline,
                'skills_required' => $job->skills_required ? json_decode($job->skills_required, true) : [],
                'is_featured' => $job->is_featured,
                'remote_work_allowed' => $job->remote_work_allowed,
                'has_user_applied' => $job->hasUserApplied($user->id),
                'saved_at' => $saved->created_at->toDateTimeString(),
            ];
        });

        return Inertia::render('Alumni/SavedJobs', [
            'savedJobs' => $savedJobs,
        ]);
    }

    /**
     * Apply for a job
     */
    public function apply(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'cover_letter' => 'required|string|max:2000',
            'resume' => 'nullable|file|mimes:pdf,doc,docx|max:5120', // 5MB max
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        $user = $request->user();
        $job = JobPosting::findOrFail($id);

        // Check if already applied
        $existingApplication = JobApplication::where('job_posting_id', $job->id)
            ->where('user_id', $user->id)
            ->first();

        if ($existingApplication) {
            return back()->with('error', 'You have already applied for this job!');
        }

        // Handle resume upload
        $resumePath = null;
        if ($request->hasFile('resume')) {
            $resumePath = $request->file('resume')->store('resumes', 'uploads');
        }

        $application = JobApplication::create([
            'job_posting_id' => $job->id,
            'user_id' => $user->id,
            'cover_letter' => $request->cover_letter,
            'resume_path' => $resumePath,
            'status' => 'pending',
            'applied_at' => now(),
        ]);

        ActivityLog::logActivity(
            $user->id,
            'job_applied',
            "Applied for job: {$job->title} at {$job->company_name}",
            'JobApplication',
            $application->id
        );

        return back()->with('success', 'Application submitted successfully!');
    }

    /**
     * Get user's applications
     */
    public function myApplications(Request $request)
    {
        $user = $request->user();

        $applications = JobApplication::with(['jobPosting.user'])
            ->where('user_id', $user->id)
            ->latest()
            ->paginate(12);

        // Calculate stats with single query
        $statusCounts = JobApplication::where('user_id', $user->id)
            ->selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        $stats = [
            'total' => $statusCounts->sum(),
            'pending' => $statusCounts->get('pending', 0),
            'reviewed' => $statusCounts->get('reviewed', 0),
            'shortlisted' => $statusCounts->get('shortlisted', 0),
            'rejected' => $statusCounts->get('rejected', 0),
            'accepted' => $statusCounts->get('accepted', 0),
        ];

        return Inertia::render('Alumni/MyApplications', [
            'applications' => $applications,
            'stats' => $stats,
        ]);
    }

    /**
     * Withdraw application
     */
    public function withdrawApplication(Request $request, $id)
    {
        $user = $request->user();
        
        $application = JobApplication::where('id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $jobTitle = $application->jobPosting->title;
        
        // Delete resume file if exists
        if ($application->resume_path) {
            Storage::disk('uploads')->delete($application->resume_path);
        }

        $application->delete();

        ActivityLog::logActivity(
            $user->id,
            'application_withdrawn',
            "Withdrew application for: {$jobTitle}",
            'JobApplication',
            $id
        );

        return back()->with('success', 'Application withdrawn successfully!');
    }
}
