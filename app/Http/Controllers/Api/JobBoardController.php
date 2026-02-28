<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JobPosting;
use App\Models\JobCategory;
use App\Models\JobView;
use App\Events\ContentChanged;
use App\Events\DashboardUpdated;
use App\Services\EmailNotificationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use App\Traits\ExportsPdf;

class JobBoardController extends Controller
{
    use ExportsPdf;
    /**
     * Get all active job postings (public for alumni).
     */
    public function index(Request $request): JsonResponse
    {
        $query = JobPosting::where('status', 'published')
            ->where(function ($q) {
                $q->whereNull('application_deadline')
                  ->orWhere('application_deadline', '>', now());
            })
            ->with(['category:id,name,slug', 'createdBy:id,name'])
            ->withCount('views');

        // Filter by campus (show campus-specific + multi-campus jobs)
        if ($request->has('campus_id')) {
            $campusId = $request->campus_id;
            $query->where(function ($q) use ($campusId) {
                $q->where('campus_id', $campusId)
                  ->orWhere('is_multi_campus', true)
                  ->orWhereNull('campus_id');
            });
        }

        // Filter by category
        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        // Filter by employment type
        if ($request->has('job_type')) {
            $query->where('job_type', $request->job_type);
        }

        // Filter by work arrangement
        if ($request->has('work_arrangement')) {
            $query->where('work_arrangement', $request->work_arrangement);
        }

        // Filter by location
        if ($request->has('location')) {
            $query->where('location', 'like', '%' . $request->location . '%');
        }

        // Filter by salary range
        if ($request->has('min_salary')) {
            $query->where(function ($q) use ($request) {
                $q->where('salary_min', '>=', $request->min_salary)
                  ->orWhereNull('salary_min');
            });
        }

        if ($request->has('max_salary')) {
            $query->where(function ($q) use ($request) {
                $q->where('salary_max', '<=', $request->max_salary)
                  ->orWhereNull('salary_max');
            });
        }

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('company_name', 'like', "%{$search}%")
                  ->orWhere('content', 'like', "%{$search}%")
                  ->orWhere('requirements', 'like', "%{$search}%");
            });
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'created_at');
        $sortDir = $request->get('sort_dir', 'desc');
        
        if (in_array($sortBy, ['created_at', 'title', 'company_name', 'salary_min'])) {
            // Featured jobs first, then sort
            $query->orderBy('is_featured', 'desc')
                  ->orderBy($sortBy, $sortDir);
        }

        $jobs = $query->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $jobs,
        ]);
    }

    /**
     * Get a single job posting.
     */
    public function show(JobPosting $jobPosting): JsonResponse
    {
        // Only show published jobs (unless admin)
        $user = Auth::user();
        
        if ($jobPosting->status !== 'published' && 
            (!$user || !in_array($user->role, ['admin', 'super_admin']))) {
            return response()->json([
                'success' => false,
                'message' => 'Job posting not found.',
            ], 404);
        }

        // Check if expired
        if ($jobPosting->application_deadline && $jobPosting->application_deadline < now() &&
            (!$user || !in_array($user->role, ['admin', 'super_admin']))) {
            return response()->json([
                'success' => false,
                'message' => 'This job posting has expired.',
            ], 410);
        }

        $jobPosting->load(['category', 'createdBy:id,name']);
        $jobPosting->loadCount('views');

        // Record view (if user is logged in)
        if ($user) {
            $this->recordView($jobPosting, $user);
        }

        return response()->json([
            'success' => true,
            'data' => $jobPosting,
        ]);
    }

    /**
     * Get job categories.
     */
    public function getCategories(): JsonResponse
    {
        $categories = JobCategory::where('is_active', true)
            ->withCount(['jobs' => function ($query) {
                $query->where('status', 'published')
                      ->where(function ($q) {
                          $q->whereNull('application_deadline')
                            ->orWhere('application_deadline', '>', now());
                      });
            }])
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $categories,
        ]);
    }

    /**
     * Get featured jobs.
     */
    public function getFeatured(): JsonResponse
    {
        $jobs = JobPosting::where('status', 'published')
            ->where('is_featured', true)
            ->where(function ($q) {
                $q->whereNull('application_deadline')
                  ->orWhere('application_deadline', '>', now());
            })
            ->with(['category:id,name,slug'])
            ->limit(6)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $jobs,
        ]);
    }

    /**
     * Get recent jobs.
     */
    public function getRecent(Request $request): JsonResponse
    {
        $limit = min($request->get('limit', 10), 50);

        $jobs = JobPosting::where('status', 'published')
            ->where(function ($q) {
                $q->whereNull('application_deadline')
                  ->orWhere('application_deadline', '>', now());
            })
            ->with(['category:id,name,slug'])
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $jobs,
        ]);
    }

    // =========== ADMIN METHODS ===========

    /**
     * Get all job postings for admin.
     */
    public function adminIndex(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        if (!in_array($user->role, ['admin', 'super_admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied.',
            ], 403);
        }

        $query = JobPosting::with(['category:id,name', 'createdBy:id,name'])
            ->withCount('views');

        // Filter by campus
        if ($request->has('campus_id')) {
            $campusId = $request->campus_id;
            $query->where(function ($q) use ($campusId) {
                $q->where('campus_id', $campusId)
                  ->orWhere('is_multi_campus', true)
                  ->orWhereNull('campus_id');
            });
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by category
        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('company_name', 'like', "%{$search}%");
            });
        }

        $jobs = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $jobs,
        ]);
    }

    /**
     * Create a new job posting (admin only).
     */
    public function store(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        if (!in_array($user->role, ['admin', 'super_admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Only administrators can create job postings.',
            ], 403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'company_name' => 'required|string|max:255',
            'company_logo' => 'nullable|string|max:500',
            'poster_image' => 'nullable|string|max:500',
            'background_image' => 'nullable|string|max:500',
            'company_website' => 'nullable|url|max:500',
            'category_id' => 'required|exists:job_categories,id',
            'content' => 'nullable|string|max:10000',
            'pages' => 'nullable|array',
            'pages.*.title' => 'nullable|string|max:255',
            'pages.*.content' => 'required|string',
            'pages.*.image' => 'nullable|string',
            'pages.*.layout' => 'required|in:text-only,image-left,image-right,image-top,image-full',
            'use_pages' => 'nullable|boolean',
            'requirements' => 'nullable|string|max:5000',
            'benefits' => 'nullable|string|max:5000',
            'job_type' => ['required', Rule::in(['full_time', 'part_time', 'contract', 'internship', 'freelance'])],
            'work_arrangement' => ['required', Rule::in(['onsite', 'remote', 'hybrid'])],
            'location' => 'nullable|string|max:255',
            'salary_min' => 'nullable|numeric|min:0',
            'salary_max' => 'nullable|numeric|min:0|gte:salary_min',
            'salary_currency' => 'nullable|string|max:3',
            'salary_period' => ['nullable', Rule::in(['hourly', 'monthly', 'yearly'])],
            'is_salary_visible' => 'nullable|boolean',
            'contact_email' => 'nullable|email|max:255',
            'contact_phone' => 'nullable|string|max:50',
            'external_url' => 'nullable|url|max:500',
            'is_featured' => 'nullable|boolean',
            'application_deadline' => 'nullable|date|after:today',
            'status' => ['nullable', Rule::in(['draft', 'published', 'closed', 'expired'])],
        ]);

        $validated['slug'] = $this->generateUniqueSlug($validated['title']);
        $validated['created_by'] = $user->id;
        $validated['status'] = $validated['status'] ?? 'published';

        if ($validated['status'] === 'published' && empty($validated['published_at'])) {
            $validated['published_at'] = now();
        }

        $jobPosting = JobPosting::create($validated);
        $jobPosting->load(['category', 'createdBy:id,name']);

        // Send email notifications if job is published
        $emailInfo = '';
        if ($jobPosting->status === 'published') {
            try {
                $emailService = app(EmailNotificationService::class);
                $emailResult = $emailService->sendJobPostingNotification($jobPosting);
                
                $emailInfo = $emailResult['success'] 
                    ? " Email notifications queued for {$emailResult['total_recipients']} alumni."
                    : '';
            } catch (\Exception $e) {
                \Log::error('Failed to send job posting emails: ' . $e->getMessage());
            }
        }

        ContentChanged::dispatch('job', 'created', $jobPosting->id, $jobPosting->title);
        DashboardUpdated::dispatch('new_job');

        return response()->json([
            'success' => true,
            'data' => $jobPosting,
            'message' => 'Job posting created successfully.' . $emailInfo,
        ], 201);
    }

    /**
     * Update a job posting (admin only).
     */
    public function update(JobPosting $jobPosting, Request $request): JsonResponse
    {
        $user = Auth::user();
        
        if (!in_array($user->role, ['admin', 'super_admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Only administrators can update job postings.',
            ], 403);
        }

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'company_name' => 'sometimes|string|max:255',
            'company_logo' => 'nullable|string|max:500',
            'poster_image' => 'nullable|string|max:500',
            'background_image' => 'nullable|string|max:500',
            'company_website' => 'nullable|url|max:500',
            'category_id' => 'sometimes|exists:job_categories,id',
            'content' => 'nullable|string|max:10000',
            'pages' => 'nullable|array',
            'pages.*.title' => 'nullable|string|max:255',
            'pages.*.content' => 'required|string',
            'pages.*.image' => 'nullable|string',
            'pages.*.layout' => 'required|in:text-only,image-left,image-right,image-top,image-full',
            'use_pages' => 'nullable|boolean',
            'requirements' => 'nullable|string|max:5000',
            'benefits' => 'nullable|string|max:5000',
            'job_type' => ['sometimes', Rule::in(['full_time', 'part_time', 'contract', 'internship', 'freelance'])],
            'work_arrangement' => ['sometimes', Rule::in(['onsite', 'remote', 'hybrid'])],
            'location' => 'nullable|string|max:255',
            'salary_min' => 'nullable|numeric|min:0',
            'salary_max' => 'nullable|numeric|min:0',
            'salary_currency' => 'nullable|string|max:3',
            'salary_period' => ['nullable', Rule::in(['hourly', 'monthly', 'yearly'])],
            'is_salary_visible' => 'nullable|boolean',
            'contact_email' => 'nullable|email|max:255',
            'contact_phone' => 'nullable|string|max:50',
            'external_url' => 'nullable|url|max:500',
            'is_featured' => 'nullable|boolean',
            'application_deadline' => 'nullable|date',
            'status' => ['sometimes', Rule::in(['draft', 'published', 'closed', 'expired'])],
        ]);

        // If title changed, update slug
        if (isset($validated['title']) && $validated['title'] !== $jobPosting->title) {
            $validated['slug'] = $this->generateUniqueSlug($validated['title'], $jobPosting->id);
        }

        // If publishing for first time
        $wasNotPublished = $jobPosting->status !== 'published';
        if (($validated['status'] ?? $jobPosting->status) === 'published' && $wasNotPublished) {
            $validated['published_at'] = now();
        }

        $jobPosting->update($validated);
        $jobPosting->load(['category', 'createdBy:id,name']);

        // Send email notifications if job was just published
        $emailInfo = '';
        if ($wasNotPublished && $jobPosting->status === 'published') {
            try {
                $emailService = app(EmailNotificationService::class);
                $emailResult = $emailService->sendJobPostingNotification($jobPosting);
                
                $emailInfo = $emailResult['success'] 
                    ? " Email notifications queued for {$emailResult['total_recipients']} alumni."
                    : '';
            } catch (\Exception $e) {
                \Log::error('Failed to send job posting emails: ' . $e->getMessage());
            }
        }

        ContentChanged::dispatch('job', 'updated', $jobPosting->id, $jobPosting->title);

        return response()->json([
            'success' => true,
            'data' => $jobPosting,
            'message' => 'Job posting updated successfully.' . $emailInfo,
        ]);
    }

    /**
     * Delete a job posting (admin only).
     */
    public function destroy(JobPosting $jobPosting): JsonResponse
    {
        $user = Auth::user();
        
        if (!in_array($user->role, ['admin', 'super_admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Only administrators can delete job postings.',
            ], 403);
        }

        $jobPosting->delete();

        ContentChanged::dispatch('job', 'deleted', $jobPosting->id, $jobPosting->title);

        return response()->json([
            'success' => true,
            'message' => 'Job posting deleted successfully.',
        ]);
    }

    /**
     * Bulk update job status (admin only).
     */
    public function bulkUpdateStatus(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        if (!in_array($user->role, ['admin', 'super_admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied.',
            ], 403);
        }

        $request->validate([
            'job_ids' => 'required|array',
            'job_ids.*' => 'exists:job_postings,id',
            'status' => ['required', Rule::in(['published', 'closed', 'expired'])],
        ]);

        $updateData = ['status' => $request->status];
        
        if ($request->status === 'published') {
            $updateData['published_at'] = DB::raw('COALESCE(published_at, NOW())');
        }

        JobPosting::whereIn('id', $request->job_ids)->update($updateData);

        return response()->json([
            'success' => true,
            'message' => 'Job postings updated successfully.',
        ]);
    }

    /**
     * Get job statistics (admin only).
     */
    public function getStatistics(): JsonResponse
    {
        $user = Auth::user();
        
        if (!in_array($user->role, ['admin', 'super_admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied.',
            ], 403);
        }

        $stats = [
            'total_jobs' => JobPosting::count(),
            'published_jobs' => JobPosting::where('status', 'published')->count(),
            'draft_jobs' => JobPosting::where('status', 'draft')->count(),
            'expired_jobs' => JobPosting::where('status', 'expired')
                ->orWhere(function ($q) {
                    $q->whereNotNull('application_deadline')
                      ->where('application_deadline', '<', now());
                })->count(),
            'total_views' => JobView::count(),
            'jobs_by_category' => JobCategory::withCount(['jobPostings' => function ($q) {
                $q->where('status', 'published');
            }])->get()->pluck('job_postings_count', 'name'),
            'jobs_by_type' => JobPosting::where('status', 'published')
                ->select('job_type', DB::raw('count(*) as count'))
                ->groupBy('job_type')
                ->pluck('count', 'job_type'),
            'recent_views' => JobView::where('viewed_at', '>=', now()->subDays(30))->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    // =========== CATEGORY MANAGEMENT (Admin) ===========

    /**
     * Create a job category (admin only).
     */
    public function storeCategory(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        if (!in_array($user->role, ['admin', 'super_admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied.',
            ], 403);
        }

        $request->validate([
            'name' => 'required|string|max:100|unique:job_categories,name',
            'description' => 'nullable|string|max:500',
            'icon' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:7',
            'is_active' => 'nullable|boolean',
        ]);

        $category = JobCategory::create([
            'name' => $request->name,
            'slug' => Str::slug($request->name),
            'description' => $request->description,
            'icon' => $request->icon,
            'color' => $request->color,
            'is_active' => $request->is_active ?? true,
        ]);

        return response()->json([
            'success' => true,
            'data' => $category,
            'message' => 'Category created successfully.',
        ], 201);
    }

    /**
     * Update a job category (admin only).
     */
    public function updateCategory(JobCategory $category, Request $request): JsonResponse
    {
        $user = Auth::user();
        
        if (!in_array($user->role, ['admin', 'super_admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied.',
            ], 403);
        }

        $request->validate([
            'name' => 'sometimes|string|max:100|unique:job_categories,name,' . $category->id,
            'description' => 'nullable|string|max:500',
            'icon' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:7',
            'is_active' => 'nullable|boolean',
        ]);

        $updateData = $request->only(['name', 'description', 'icon', 'color', 'is_active']);
        
        if (isset($updateData['name'])) {
            $updateData['slug'] = Str::slug($updateData['name']);
        }

        $category->update($updateData);

        return response()->json([
            'success' => true,
            'data' => $category,
            'message' => 'Category updated successfully.',
        ]);
    }

    /**
     * Delete a job category (admin only).
     */
    public function destroyCategory(JobCategory $category): JsonResponse
    {
        $user = Auth::user();
        
        if (!in_array($user->role, ['admin', 'super_admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied.',
            ], 403);
        }

        // Check if category has jobs
        if ($category->jobPostings()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete category with existing job postings. Please move or delete the jobs first.',
            ], 400);
        }

        $category->delete();

        return response()->json([
            'success' => true,
            'message' => 'Category deleted successfully.',
        ]);
    }

    // =========== HELPER METHODS ===========

    private function generateUniqueSlug(string $title, ?int $excludeId = null): string
    {
        $slug = Str::slug($title);
        $originalSlug = $slug;
        $counter = 1;

        $query = JobPosting::where('slug', $slug);
        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        while ($query->exists()) {
            $slug = $originalSlug . '-' . $counter;
            $counter++;
            
            $query = JobPosting::where('slug', $slug);
            if ($excludeId) {
                $query->where('id', '!=', $excludeId);
            }
        }

        return $slug;
    }

    private function recordView(JobPosting $jobPosting, $user): void
    {
        // Check if user already viewed today
        $existingView = JobView::where('job_posting_id', $jobPosting->id)
            ->where('user_id', $user->id)
            ->whereDate('viewed_at', today())
            ->first();

        if (!$existingView) {
            JobView::create([
                'job_posting_id' => $jobPosting->id,
                'user_id' => $user->id,
                'viewed_at' => now(),
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);
        }
    }

    /**
     * Export job postings.
     */
    public function exportJobs(Request $request)
    {
        $user = Auth::user();
        
        if (!in_array($user->role, ['admin', 'super_admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied.',
            ], 403);
        }

        $format = $request->get('format', 'csv');

        $query = JobPosting::with(['category:id,name'])
            ->withCount('views');

        // Apply filters (same as adminIndex)
        if ($request->has('campus_id')) {
            $campusId = $request->campus_id;
            $query->where(function ($q) use ($campusId) {
                $q->where('campus_id', $campusId)
                  ->orWhere('is_multi_campus', true)
                  ->orWhereNull('campus_id');
            });
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('company_name', 'like', "%{$search}%");
            });
        }

        $jobs = $query->orderBy('created_at', 'desc')
            ->limit(5000)
            ->get();

        switch ($format) {
            case 'excel':
                return $this->exportJobsToExcel($jobs);
            case 'pdf':
                return $this->exportJobsToPdf($jobs);
            case 'csv':
            default:
                return $this->exportJobsToCsv($jobs);
        }
    }

    private function exportJobsToCsv($jobs)
    {
        $handle = fopen('php://temp', 'w+');

        // CSV Headers
        fputcsv($handle, [
            'Job ID', 'Job Title', 'Company', 'Category', 'Location',
            'Job Type', 'Work Arrangement', 'Experience Level', 'Salary Range',
            'Featured', 'Application Deadline', 'Contact Email', 'Contact Phone',
            'Status', 'Posted Date', 'Views Count'
        ]);

        foreach ($jobs as $job) {
            $jobType = ucwords(str_replace('_', ' ', $job->job_type ?? 'N/A'));
            $workArrangement = $job->work_arrangement ? ucwords(str_replace('_', ' ', $job->work_arrangement)) : 'N/A';
            $experienceLevel = ucwords(str_replace('_', ' ', $job->experience_level ?? 'N/A'));

            $salaryRange = 'Not specified';
            if ($job->salary_min && $job->salary_max) {
                $currency = $job->salary_currency ?? 'PHP';
                $salaryRange = "{$currency} {$job->salary_min} - {$job->salary_max}";
            } elseif ($job->salary_range) {
                $salaryRange = $job->salary_range;
            }

            fputcsv($handle, [
                $job->id,
                $job->title,
                $job->company_name,
                $job->category->name ?? 'Uncategorized',
                $job->location,
                $jobType,
                $workArrangement,
                $experienceLevel,
                $salaryRange,
                $job->is_featured ? 'Yes' : 'No',
                $job->application_deadline ? (is_string($job->application_deadline) ? $job->application_deadline : $job->application_deadline->format('Y-m-d')) : 'N/A',
                $job->contact_email ?? '',
                $job->contact_phone ?? '',
                ucfirst($job->status),
                $job->created_at->format('Y-m-d H:i:s'),
                $job->views_count ?? 0
            ]);
        }

        rewind($handle);
        $content = stream_get_contents($handle);
        fclose($handle);

        return response($content, 200)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="job_postings_' . date('Y-m-d_His') . '.csv"');
    }

    private function exportJobsToExcel($jobs)
    {
        $handle = fopen('php://temp', 'w+');
        fwrite($handle, "\xEF\xBB\xBF"); // UTF-8 BOM

        // Excel Headers
        fputcsv($handle, [
            'Job ID', 'Job Title', 'Company', 'Category', 'Location',
            'Job Type', 'Work Arrangement', 'Experience Level', 'Salary Range',
            'Featured', 'Application Deadline', 'Contact Email', 'Contact Phone',
            'Status', 'Posted Date', 'Views Count'
        ]);

        foreach ($jobs as $job) {
            $jobType = ucwords(str_replace('_', ' ', $job->job_type ?? 'N/A'));
            $workArrangement = $job->work_arrangement ? ucwords(str_replace('_', ' ', $job->work_arrangement)) : 'N/A';
            $experienceLevel = ucwords(str_replace('_', ' ', $job->experience_level ?? 'N/A'));

            $salaryRange = 'Not specified';
            if ($job->salary_min && $job->salary_max) {
                $currency = $job->salary_currency ?? 'PHP';
                $salaryRange = "{$currency} {$job->salary_min} - {$job->salary_max}";
            } elseif ($job->salary_range) {
                $salaryRange = $job->salary_range;
            }

            fputcsv($handle, [
                $job->id,
                $job->title,
                $job->company_name,
                $job->category->name ?? 'Uncategorized',
                $job->location,
                $jobType,
                $workArrangement,
                $experienceLevel,
                $salaryRange,
                $job->is_featured ? 'Yes' : 'No',
                $job->application_deadline ? (is_string($job->application_deadline) ? $job->application_deadline : $job->application_deadline->format('Y-m-d')) : 'N/A',
                $job->contact_email ?? '',
                $job->contact_phone ?? '',
                ucfirst($job->status),
                $job->created_at->format('Y-m-d H:i:s'),
                $job->views_count ?? 0
            ]);
        }

        rewind($handle);
        $content = stream_get_contents($handle);
        fclose($handle);

        return response($content, 200)
            ->header('Content-Type', 'application/vnd.ms-excel')
            ->header('Content-Disposition', 'attachment; filename="job_postings_' . date('Y-m-d_His') . '.xlsx"');
    }

    private function exportJobsToPdf($jobs)
    {
        $html = '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #800000; text-align: center; }
        .report-info { text-align: center; margin-bottom: 20px; color: #666; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background-color: #800000; color: white; padding: 10px; text-align: left; font-size: 11px; }
        td { padding: 8px; border-bottom: 1px solid #ddd; font-size: 10px; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .status-published { color: #16a34a; font-weight: bold; }
        .status-draft { color: #ca8a04; font-weight: bold; }
        .status-archived { color: #dc2626; font-weight: bold; }
    </style>
</head>
<body>
    <h1>Job Postings Report</h1>
    <div class="report-info">
        Generated on ' . date('F d, Y h:i A') . '<br>
        Total Records: ' . count($jobs) . '
    </div>
    <table>
        <thead>
            <tr>
                <th>Job Title</th>
                <th>Company</th>
                <th>Category</th>
                <th>Location</th>
                <th>Job Type</th>
                <th>Salary Range</th>
                <th>Featured</th>
                <th>Contact Email</th>
                <th>Status</th>
                <th>Posted Date</th>
                <th>Views</th>
            </tr>
        </thead>
        <tbody>';

        foreach ($jobs as $job) {
            $jobType = ucwords(str_replace('_', ' ', $job->job_type ?? 'N/A'));
            $statusClass = 'status-' . strtolower($job->status);
            $salaryRange = 'N/A';
            if ($job->salary_min && $job->salary_max) {
                $currency = $job->salary_currency ?? 'PHP';
                $salaryRange = "{$currency} {$job->salary_min} - {$job->salary_max}";
            } elseif ($job->salary_range) {
                $salaryRange = $job->salary_range;
            }
            
            $html .= '<tr>
                <td>' . htmlspecialchars($job->title) . '</td>
                <td>' . htmlspecialchars($job->company_name) . '</td>
                <td>' . htmlspecialchars($job->category->name ?? 'Uncategorized') . '</td>
                <td>' . htmlspecialchars($job->location) . '</td>
                <td>' . htmlspecialchars($jobType) . '</td>
                <td>' . htmlspecialchars($salaryRange) . '</td>
                <td>' . ($job->is_featured ? 'Yes' : 'No') . '</td>
                <td>' . htmlspecialchars($job->contact_email ?? '') . '</td>
                <td class="' . $statusClass . '">' . htmlspecialchars(ucfirst($job->status)) . '</td>
                <td>' . $job->created_at->format('M d, Y') . '</td>
                <td>' . ($job->views_count ?? 0) . '</td>
            </tr>';
        }

        $html .= '</tbody>
    </table>
</body>
</html>';

        return $this->renderPdf($html, 'job_postings_' . date('Y-m-d_His') . '.pdf');
    }

    private function escapeCsvField($field)
    {
        if (is_null($field)) {
            return '';
        }
        
        $field = str_replace('"', '""', $field);
        
        if (strpos($field, ',') !== false || strpos($field, '"') !== false || strpos($field, "\n") !== false) {
            return '"' . $field . '"';
        }
        
        return $field;
    }
}
