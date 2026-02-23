<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Content;
use App\Models\ContentRead;
use App\Models\ContentView;
use App\Models\JobCategory;
use App\Models\User;
use App\Events\ContentChanged;
use App\Events\DashboardUpdated;
use App\Services\EmailNotificationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ContentController extends Controller
{
    // =========================================================
    // ALUMNI / PUBLIC ENDPOINTS
    // =========================================================

    /**
     * Get all published content for alumni (unified feed).
     * Supports type filter, search, campus filter.
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();

        $query = Content::where('status', 'published')
            ->with(['createdBy:id,name', 'category:id,name,slug'])
            ->withCount('contentViews');

        // Filter by content type
        if ($request->has('type') && in_array($request->type, Content::TYPES)) {
            $query->ofType($request->type);
        }

        // Campus filter
        if ($request->has('campus_id')) {
            $query->byCampus($request->campus_id);
        }

        // For announcements: apply user targeting
        if ($user && (!$request->has('type') || $request->type === 'announcement')) {
            $query->where(function ($q) use ($user, $request) {
                // Non-announcement items always visible
                $q->where('content_type', '!=', 'announcement');

                // Announcements: filter by user targeting
                $q->orWhere(function ($annQ) use ($user) {
                    $annQ->where('content_type', 'announcement')
                        ->where(function ($targetQ) use ($user) {
                            $targetQ->where('target_type', 'all');

                            if ($user->alumniProfile && $user->alumniProfile->graduation_year) {
                                $targetQ->orWhere(function ($bq) use ($user) {
                                    $bq->where('target_type', 'batch')
                                        ->whereJsonContains('target_batch_years', (string) $user->alumniProfile->graduation_year);
                                });
                            }

                            if ($user->alumniProfile && $user->alumniProfile->department_id) {
                                $targetQ->orWhere(function ($dq) use ($user) {
                                    $dq->where('target_type', 'department')
                                        ->whereJsonContains('target_department_ids', $user->alumniProfile->department_id);
                                });
                            }
                        });
                });
            });
        }

        // Active filter (not expired)
        if (!$request->has('include_expired')) {
            $query->where(function ($q) {
                $q->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })->where(function ($q) {
                $q->whereNull('application_deadline')
                    ->orWhere('application_deadline', '>=', now()->toDateString());
            });
        }

        // Job-specific filters
        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }
        if ($request->has('job_type')) {
            $query->where('job_type', $request->job_type);
        }
        if ($request->has('work_arrangement')) {
            $query->where('work_arrangement', $request->work_arrangement);
        }
        if ($request->has('location')) {
            $query->where('location', 'like', '%' . $request->location . '%');
        }
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

        // Unread filter (announcements)
        if ($request->has('unread_only') && $request->unread_only && $user) {
            $query->where(function ($q) use ($user) {
                $q->where('content_type', '!=', 'announcement')
                    ->orWhereDoesntHave('reads', function ($rq) use ($user) {
                        $rq->where('user_id', $user->id);
                    });
            });
        }

        // Search
        if ($request->has('search') && $request->search) {
            $query->search($request->search);
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'created_at');
        $sortDir = $request->get('sort_dir', 'desc');

        if (in_array($sortBy, ['created_at', 'title', 'published_at', 'priority'])) {
            $query->orderBy('is_featured', 'desc')
                ->orderBy($sortBy, $sortDir);
        } else {
            $query->orderBy('is_featured', 'desc')
                ->orderBy('created_at', 'desc');
        }

        $contents = $query->paginate($request->get('per_page', 15));

        // Append read status for announcements if user is authenticated
        if ($user) {
            $contentIds = $contents->pluck('id')->toArray();
            $readIds = ContentRead::where('user_id', $user->id)
                ->whereIn('content_id', $contentIds)
                ->pluck('content_id')
                ->toArray();

            $contents->getCollection()->transform(function ($item) use ($readIds) {
                $item->is_read = in_array($item->id, $readIds);
                return $item;
            });
        }

        return response()->json([
            'success' => true,
            'data' => $contents,
        ]);
    }

    /**
     * Get a single content item.
     */
    public function show(Content $content): JsonResponse
    {
        $user = Auth::user();

        // Only show published content to non-admins
        if ($content->status !== 'published' &&
            (!$user || !in_array($user->role, ['admin', 'super_admin']))) {
            return response()->json([
                'success' => false,
                'message' => 'Content not found.',
            ], 404);
        }

        // Check announcement targeting
        if ($content->isAnnouncement() && $user && !in_array($user->role, ['admin', 'super_admin'])) {
            if (!$this->canViewAnnouncement($user, $content)) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to view this content.',
                ], 403);
            }
        }

        $content->load(['createdBy:id,name', 'category:id,name,slug']);
        $content->loadCount('contentViews');

        // Record view / mark read
        if ($user) {
            if ($content->isAnnouncement()) {
                $content->markReadBy($user->id);
            }
            $this->recordContentView($content, $user);
        }

        return response()->json([
            'success' => true,
            'data' => $content,
        ]);
    }

    /**
     * Get featured content (for landing page / homepage widgets).
     */
    public function getFeatured(Request $request): JsonResponse
    {
        $query = Content::published()
            ->featured()
            ->active()
            ->with(['category:id,name,slug'])
            ->orderBy('created_at', 'desc');

        if ($request->has('type') && in_array($request->type, Content::TYPES)) {
            $query->ofType($request->type);
        }

        $limit = min($request->get('limit', 6), 20);
        $featured = $query->limit($limit)->get();

        return response()->json([
            'success' => true,
            'data' => $featured,
        ]);
    }

    /**
     * Get recent content.
     */
    public function getRecent(Request $request): JsonResponse
    {
        $limit = min($request->get('limit', 10), 50);

        $query = Content::published()
            ->active()
            ->with(['category:id,name,slug'])
            ->orderBy('created_at', 'desc');

        if ($request->has('type') && in_array($request->type, Content::TYPES)) {
            $query->ofType($request->type);
        }

        $recent = $query->limit($limit)->get();

        return response()->json([
            'success' => true,
            'data' => $recent,
        ]);
    }

    /**
     * Get unread announcement count for the authenticated user.
     */
    public function getUnreadCount(): JsonResponse
    {
        $user = Auth::user();

        $query = Content::announcements()
            ->published()
            ->active();

        // Apply user targeting
        $query->where(function ($q) use ($user) {
            $q->where('target_type', 'all');

            if ($user->alumniProfile && $user->alumniProfile->graduation_year) {
                $q->orWhere(function ($bq) use ($user) {
                    $bq->where('target_type', 'batch')
                        ->whereJsonContains('target_batch_years', (string) $user->alumniProfile->graduation_year);
                });
            }

            if ($user->alumniProfile && $user->alumniProfile->department_id) {
                $q->orWhere(function ($dq) use ($user) {
                    $dq->where('target_type', 'department')
                        ->whereJsonContains('target_department_ids', $user->alumniProfile->department_id);
                });
            }
        });

        $count = $query->whereDoesntHave('reads', function ($rq) use ($user) {
            $rq->where('user_id', $user->id);
        })->count();

        return response()->json([
            'success' => true,
            'data' => ['unread_count' => $count],
        ]);
    }

    /**
     * Mark content as read.
     */
    public function markAsRead(Content $content): JsonResponse
    {
        $user = Auth::user();

        ContentRead::firstOrCreate([
            'content_id' => $content->id,
            'user_id' => $user->id,
        ], [
            'read_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Content marked as read.',
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

    // =========================================================
    // ADMIN ENDPOINTS
    // =========================================================

    /**
     * Get all content for admin (all types, all statuses).
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

        $query = Content::with(['createdBy:id,name', 'category:id,name'])
            ->withCount(['reads', 'contentViews']);

        // Filter by type
        if ($request->has('type') && in_array($request->type, Content::TYPES)) {
            $query->ofType($request->type);
        }

        // Filter by campus
        if ($request->has('campus_id')) {
            $query->byCampus($request->campus_id);
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by published (for announcements backward compat)
        if ($request->has('is_published')) {
            $query->where('is_published', $request->boolean('is_published'));
        }

        // Filter by target type (announcements)
        if ($request->has('target_type')) {
            $query->where('target_type', $request->target_type);
        }

        // Filter by category (jobs)
        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        // Search
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('content', 'like', "%{$search}%")
                    ->orWhere('company_name', 'like', "%{$search}%");
            });
        }

        $query->orderBy('created_at', 'desc');

        $contents = $query->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $contents,
        ]);
    }

    /**
     * Create new content (admin only).
     */
    public function store(Request $request): JsonResponse
    {
        $user = Auth::user();

        if (!in_array($user->role, ['admin', 'super_admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Only administrators can create content.',
            ], 403);
        }

        // Validate content type first
        $request->validate([
            'content_type' => ['required', Rule::in(Content::TYPES)],
        ]);

        $contentType = $request->content_type;

        // Shared validation rules
        $rules = [
            'title' => 'required|string|max:255',
            'content' => 'nullable|string|max:10000',
            'pages' => 'nullable|array',
            'pages.*.title' => 'nullable|string|max:255',
            'pages.*.content' => 'required|string',
            'pages.*.image' => 'nullable|string',
            'pages.*.layout' => 'required|in:text-only,image-left,image-right,image-top,image-full',
            'use_pages' => 'nullable|boolean',
            'featured_image' => 'nullable|string|max:500',
            'show_on_landing' => 'nullable|boolean',
            'is_featured' => 'nullable|boolean',
            'status' => ['nullable', Rule::in(['draft', 'published', 'closed', 'expired'])],
            'scheduled_at' => 'nullable|date|after:now',
            'expires_at' => 'nullable|date',
        ];

        // Announcement-specific rules
        if ($contentType === Content::TYPE_ANNOUNCEMENT) {
            $rules += [
                'target_type' => ['required', Rule::in(['all', 'batch', 'department'])],
                'target_batch_years' => 'required_if:target_type,batch|nullable|array',
                'target_batch_years.*' => 'integer|min:1950|max:2100',
                'target_department_ids' => 'required_if:target_type,department|nullable|array',
                'target_department_ids.*' => 'exists:departments,id',
                'priority' => ['nullable', Rule::in(['low', 'normal', 'high', 'urgent'])],
                'publish_now' => 'nullable|boolean',
            ];
        }

        // Job-specific rules
        if ($contentType === Content::TYPE_JOB) {
            $rules += [
                'company_name' => 'required|string|max:255',
                'company_logo' => 'nullable|string|max:500',
                'background_image' => 'nullable|string|max:500',
                'company_website' => 'nullable|url|max:500',
                'category_id' => 'required|exists:job_categories,id',
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
                'application_deadline' => 'nullable|date|after:today',
            ];
        }

        // Event-specific rules
        if ($contentType === Content::TYPE_EVENT) {
            $rules += [
                'location' => 'nullable|string|max:255',
                'start_date' => 'nullable|date',
                'priority' => ['nullable', Rule::in(['low', 'normal', 'high', 'urgent'])],
            ];
        }

        $validated = $request->validate($rules);

        // Build content data
        $data = [
            'content_type' => $contentType,
            'title' => $validated['title'],
            'slug' => Content::generateUniqueSlug($validated['title']),
            'content' => $validated['content'] ?? '',
            'pages' => $validated['pages'] ?? null,
            'use_pages' => $validated['use_pages'] ?? false,
            'featured_image' => $validated['featured_image'] ?? null,
            'show_on_landing' => $validated['show_on_landing'] ?? false,
            'is_featured' => $validated['is_featured'] ?? false,
            'created_by' => $user->id,
            'scheduled_at' => $validated['scheduled_at'] ?? null,
            'expires_at' => $validated['expires_at'] ?? null,
        ];

        // Determine status
        if ($contentType === Content::TYPE_ANNOUNCEMENT) {
            $publishNow = $request->boolean('publish_now', true);
            $data['status'] = $publishNow ? 'published' : 'draft';
            $data['is_published'] = $publishNow;
            $data['published_at'] = $publishNow ? now() : null;
            $data['target_type'] = $validated['target_type'];
            $data['target_batch_years'] = $validated['target_batch_years'] ?? null;
            $data['target_department_ids'] = $validated['target_department_ids'] ?? null;
            $data['priority'] = $validated['priority'] ?? 'normal';
        } elseif ($contentType === Content::TYPE_JOB) {
            $data['status'] = $validated['status'] ?? 'published';
            $data['is_published'] = $data['status'] === 'published';
            $data['published_at'] = $data['status'] === 'published' ? now() : null;
            $data['company_name'] = $validated['company_name'];
            $data['company_logo'] = $validated['company_logo'] ?? null;
            $data['background_image'] = $validated['background_image'] ?? null;
            $data['company_website'] = $validated['company_website'] ?? null;
            $data['category_id'] = $validated['category_id'];
            $data['requirements'] = $validated['requirements'] ?? null;
            $data['benefits'] = $validated['benefits'] ?? null;
            $data['job_type'] = $validated['job_type'];
            $data['work_arrangement'] = $validated['work_arrangement'];
            $data['location'] = $validated['location'] ?? null;
            $data['salary_min'] = $validated['salary_min'] ?? null;
            $data['salary_max'] = $validated['salary_max'] ?? null;
            $data['salary_currency'] = $validated['salary_currency'] ?? null;
            $data['salary_period'] = $validated['salary_period'] ?? null;
            $data['is_salary_visible'] = $validated['is_salary_visible'] ?? true;
            $data['contact_email'] = $validated['contact_email'] ?? null;
            $data['contact_phone'] = $validated['contact_phone'] ?? null;
            $data['external_url'] = $validated['external_url'] ?? null;
            $data['application_deadline'] = $validated['application_deadline'] ?? null;
        } elseif ($contentType === Content::TYPE_EVENT) {
            $data['status'] = $validated['status'] ?? 'published';
            $data['is_published'] = $data['status'] === 'published';
            $data['published_at'] = $data['status'] === 'published' ? now() : null;
            $data['location'] = $validated['location'] ?? null;
            $data['start_date'] = $validated['start_date'] ?? null;
            $data['priority'] = $validated['priority'] ?? 'normal';
        }

        $contentItem = Content::create($data);
        $contentItem->load(['createdBy:id,name', 'category:id,name,slug']);

        // Send email notifications if published
        $emailInfo = '';
        if ($contentItem->status === 'published') {
            $emailInfo = $this->sendContentNotification($contentItem);
        }

        ContentChanged::dispatch($contentType, 'created', $contentItem->id, $contentItem->title);
        DashboardUpdated::dispatch('new_content');

        return response()->json([
            'success' => true,
            'data' => $contentItem,
            'message' => ucfirst($contentType) . ' created successfully.' . $emailInfo,
        ], 201);
    }

    /**
     * Update content (admin only).
     */
    public function update(Content $content, Request $request): JsonResponse
    {
        $user = Auth::user();

        if (!in_array($user->role, ['admin', 'super_admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Only administrators can update content.',
            ], 403);
        }

        $contentType = $content->content_type;

        // Shared validation rules
        $rules = [
            'title' => 'sometimes|string|max:255',
            'content' => 'nullable|string|max:10000',
            'pages' => 'nullable|array',
            'pages.*.title' => 'nullable|string|max:255',
            'pages.*.content' => 'required|string',
            'pages.*.image' => 'nullable|string',
            'pages.*.layout' => 'required|in:text-only,image-left,image-right,image-top,image-full',
            'use_pages' => 'nullable|boolean',
            'featured_image' => 'nullable|string|max:500',
            'show_on_landing' => 'nullable|boolean',
            'is_featured' => 'nullable|boolean',
            'status' => ['sometimes', Rule::in(['draft', 'published', 'closed', 'expired'])],
            'expires_at' => 'nullable|date',
        ];

        if ($contentType === Content::TYPE_ANNOUNCEMENT) {
            $rules += [
                'target_type' => ['sometimes', Rule::in(['all', 'batch', 'department'])],
                'target_batch_years' => 'nullable|array',
                'target_batch_years.*' => 'integer|min:1950|max:2100',
                'target_department_ids' => 'nullable|array',
                'target_department_ids.*' => 'exists:departments,id',
                'priority' => ['nullable', Rule::in(['low', 'normal', 'high', 'urgent'])],
                'is_published' => 'sometimes|boolean',
            ];
        }

        if ($contentType === Content::TYPE_JOB) {
            $rules += [
                'company_name' => 'sometimes|string|max:255',
                'company_logo' => 'nullable|string|max:500',
                'background_image' => 'nullable|string|max:500',
                'company_website' => 'nullable|url|max:500',
                'category_id' => 'sometimes|exists:job_categories,id',
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
                'application_deadline' => 'nullable|date',
            ];
        }

        if ($contentType === Content::TYPE_EVENT) {
            $rules += [
                'location' => 'nullable|string|max:255',
                'start_date' => 'nullable|date',
                'priority' => ['nullable', Rule::in(['low', 'normal', 'high', 'urgent'])],
            ];
        }

        $validated = $request->validate($rules);

        // Track publication status change
        $wasPublished = $content->status === 'published';

        // Update slug if title changed
        if (isset($validated['title']) && $validated['title'] !== $content->title) {
            $validated['slug'] = Content::generateUniqueSlug($validated['title'], $content->id);
        }

        // Handle status + is_published sync
        if (isset($validated['status'])) {
            $validated['is_published'] = $validated['status'] === 'published';
            if ($validated['status'] === 'published' && !$wasPublished) {
                $validated['published_at'] = now();
            }
        } elseif (isset($validated['is_published'])) {
            $validated['status'] = $validated['is_published'] ? 'published' : 'draft';
            if ($validated['is_published'] && !$wasPublished) {
                $validated['published_at'] = now();
            }
        }

        $content->update($validated);
        $content->load(['createdBy:id,name', 'category:id,name,slug']);

        // Send notifications if just published
        $emailInfo = '';
        if (!$wasPublished && $content->status === 'published') {
            $emailInfo = $this->sendContentNotification($content);
        }

        ContentChanged::dispatch($contentType, 'updated', $content->id, $content->title);

        return response()->json([
            'success' => true,
            'data' => $content,
            'message' => ucfirst($contentType) . ' updated successfully.' . $emailInfo,
        ]);
    }

    /**
     * Delete content (admin only).
     */
    public function destroy(Content $content): JsonResponse
    {
        $user = Auth::user();

        if (!in_array($user->role, ['admin', 'super_admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Only administrators can delete content.',
            ], 403);
        }

        $type = $content->content_type;
        $content->delete();

        ContentChanged::dispatch($type, 'deleted', $content->id);

        return response()->json([
            'success' => true,
            'message' => ucfirst($type) . ' deleted successfully.',
        ]);
    }

    /**
     * Bulk update content status (admin only).
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
            'content_ids' => 'required|array',
            'content_ids.*' => 'exists:contents,id',
            'status' => ['required', Rule::in(['published', 'draft', 'closed', 'expired'])],
        ]);

        $updateData = ['status' => $request->status];
        $updateData['is_published'] = $request->status === 'published';

        if ($request->status === 'published') {
            $updateData['published_at'] = DB::raw('COALESCE(published_at, NOW())');
        }

        Content::whereIn('id', $request->content_ids)->update($updateData);

        return response()->json([
            'success' => true,
            'message' => 'Content items updated successfully.',
        ]);
    }

    /**
     * Get content statistics (admin only).
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
            'total' => Content::count(),
            'by_type' => Content::select('content_type', DB::raw('count(*) as count'))
                ->groupBy('content_type')
                ->pluck('count', 'content_type'),
            'published' => Content::where('status', 'published')->count(),
            'draft' => Content::where('status', 'draft')->count(),
            'total_announcements' => Content::announcements()->count(),
            'total_jobs' => Content::jobs()->count(),
            'total_events' => Content::events()->count(),
            'published_announcements' => Content::announcements()->published()->count(),
            'published_jobs' => Content::jobs()->published()->count(),
            'total_views' => ContentView::count(),
            'total_reads' => ContentRead::count(),
            'recent_views' => ContentView::where('viewed_at', '>=', now()->subDays(30))->count(),
            'jobs_by_category' => JobCategory::withCount(['jobs' => function ($q) {
                $q->where('status', 'published');
            }])->get()->pluck('jobs_count', 'name'),
            'jobs_by_type' => Content::jobs()
                ->published()
                ->select('job_type', DB::raw('count(*) as count'))
                ->groupBy('job_type')
                ->pluck('count', 'job_type'),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    /**
     * Get available batch years for targeting (announcements).
     */
    public function getBatchYears(): JsonResponse
    {
        $years = User::whereHas('alumniProfile')
            ->join('alumni_profiles', 'users.id', '=', 'alumni_profiles.user_id')
            ->distinct()
            ->orderBy('graduation_year', 'desc')
            ->pluck('alumni_profiles.graduation_year')
            ->filter()
            ->values();

        return response()->json([
            'success' => true,
            'data' => $years,
        ]);
    }

    /**
     * Export content (admin only).
     */
    public function exportContent(Request $request)
    {
        $user = Auth::user();

        if (!in_array($user->role, ['admin', 'super_admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied.',
            ], 403);
        }

        $format = $request->get('format', 'csv');

        $query = Content::with(['createdBy:id,name', 'category:id,name'])
            ->withCount(['reads', 'contentViews'])
            ->orderBy('created_at', 'desc');

        // Apply filters
        if ($request->has('type') && in_array($request->type, Content::TYPES)) {
            $query->ofType($request->type);
        }
        if ($request->has('campus_id')) {
            $query->byCampus($request->campus_id);
        }
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        if ($request->has('search')) {
            $query->search($request->search);
        }

        $contents = $query->limit(5000)->get();

        switch ($format) {
            case 'excel':
                return $this->exportToExcel($contents);
            case 'pdf':
                return $this->exportToPdf($contents);
            case 'csv':
            default:
                return $this->exportToCsv($contents);
        }
    }

    // =========== CATEGORY MANAGEMENT (Admin) ===========

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

    public function destroyCategory(JobCategory $category): JsonResponse
    {
        $user = Auth::user();

        if (!in_array($user->role, ['admin', 'super_admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied.',
            ], 403);
        }

        // Check if category is in use
        if (Content::where('category_id', $category->id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete category with existing content. Please move or delete the content first.',
            ], 400);
        }

        $category->delete();

        return response()->json([
            'success' => true,
            'message' => 'Category deleted successfully.',
        ]);
    }

    // =========== PRIVATE HELPERS ===========

    private function canViewAnnouncement(User $user, Content $content): bool
    {
        if (in_array($user->role, ['admin', 'super_admin'])) {
            return true;
        }

        if ($content->status !== 'published') {
            return false;
        }

        if ($content->target_type === 'all') {
            return true;
        }

        if ($content->target_type === 'batch' && $user->alumniProfile) {
            return in_array(
                (string) $user->alumniProfile->graduation_year,
                $content->target_batch_years ?? []
            );
        }

        if ($content->target_type === 'department' && $user->alumniProfile) {
            return in_array(
                $user->alumniProfile->department_id,
                $content->target_department_ids ?? []
            );
        }

        return false;
    }

    private function recordContentView(Content $content, $user): void
    {
        $existingView = ContentView::where('content_id', $content->id)
            ->where('user_id', $user->id)
            ->whereDate('viewed_at', today())
            ->first();

        if (!$existingView) {
            ContentView::create([
                'content_id' => $content->id,
                'user_id' => $user->id,
                'viewed_at' => now(),
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);

            $content->increment('views_count');
        }
    }

    private function sendContentNotification(Content $content): string
    {
        try {
            $emailService = app(EmailNotificationService::class);

            if ($content->isAnnouncement()) {
                // Create a temporary Announcement-like wrapper for backward compatibility
                $emailResult = $emailService->sendAnnouncementNotification($content);
            } elseif ($content->isJob()) {
                $emailResult = $emailService->sendJobPostingNotification($content);
            } else {
                return '';
            }

            if ($emailResult['success'] ?? false) {
                return " Email notifications queued for {$emailResult['total_recipients']} recipients.";
            }
        } catch (\Exception $e) {
            \Log::error('Failed to send content notification emails: ' . $e->getMessage());
        }

        return '';
    }

    // =========== EXPORT HELPERS ===========

    private function exportToCsv($contents)
    {
        $csv = "ID,Type,Title,Company,Status,Published Date,Views,Reads,Created By\n";

        foreach ($contents as $item) {
            $csv .= sprintf(
                "%d,%s,%s,%s,%s,%s,%d,%d,%s\n",
                $item->id,
                $this->escapeCsvField(ucfirst($item->content_type)),
                $this->escapeCsvField($item->title),
                $this->escapeCsvField($item->company_name ?? 'N/A'),
                $this->escapeCsvField(ucfirst($item->status)),
                $this->escapeCsvField($item->published_at ? $item->published_at->format('Y-m-d H:i:s') : 'Not published'),
                $item->content_views_count ?? 0,
                $item->reads_count ?? 0,
                $this->escapeCsvField($item->createdBy->name ?? 'Unknown')
            );
        }

        return response($csv, 200)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="content_' . date('Y-m-d_His') . '.csv"');
    }

    private function exportToExcel($contents)
    {
        $csv = "\xEF\xBB\xBF";
        $csv .= "ID,Type,Title,Company,Status,Published Date,Views,Reads,Created By\n";

        foreach ($contents as $item) {
            $csv .= sprintf(
                "%d,%s,%s,%s,%s,%s,%d,%d,%s\n",
                $item->id,
                $this->escapeCsvField(ucfirst($item->content_type)),
                $this->escapeCsvField($item->title),
                $this->escapeCsvField($item->company_name ?? 'N/A'),
                $this->escapeCsvField(ucfirst($item->status)),
                $this->escapeCsvField($item->published_at ? $item->published_at->format('Y-m-d H:i:s') : 'Not published'),
                $item->content_views_count ?? 0,
                $item->reads_count ?? 0,
                $this->escapeCsvField($item->createdBy->name ?? 'Unknown')
            );
        }

        return response($csv, 200)
            ->header('Content-Type', 'application/vnd.ms-excel')
            ->header('Content-Disposition', 'attachment; filename="content_' . date('Y-m-d_His') . '.xlsx"');
    }

    private function exportToPdf($contents)
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
        .type-announcement { color: #2563eb; font-weight: bold; }
        .type-job { color: #16a34a; font-weight: bold; }
        .type-event { color: #9333ea; font-weight: bold; }
        .status-published { color: #16a34a; }
        .status-draft { color: #ca8a04; }
    </style>
</head>
<body>
    <h1>Content Report</h1>
    <div class="report-info">
        Generated on ' . date('F d, Y h:i A') . '<br>
        Total Records: ' . count($contents) . '
    </div>
    <table>
        <thead>
            <tr>
                <th>Type</th>
                <th>Title</th>
                <th>Company</th>
                <th>Status</th>
                <th>Published</th>
                <th>Views</th>
                <th>Created By</th>
            </tr>
        </thead>
        <tbody>';

        foreach ($contents as $item) {
            $typeClass = 'type-' . $item->content_type;
            $statusClass = 'status-' . strtolower($item->status);
            $publishedDate = $item->published_at ? $item->published_at->format('M d, Y') : 'N/A';

            $html .= '<tr>
                <td class="' . $typeClass . '">' . htmlspecialchars(ucfirst($item->content_type)) . '</td>
                <td>' . htmlspecialchars($item->title) . '</td>
                <td>' . htmlspecialchars($item->company_name ?? 'N/A') . '</td>
                <td class="' . $statusClass . '">' . htmlspecialchars(ucfirst($item->status)) . '</td>
                <td>' . htmlspecialchars($publishedDate) . '</td>
                <td>' . ($item->content_views_count ?? 0) . '</td>
                <td>' . htmlspecialchars($item->createdBy->name ?? 'Unknown') . '</td>
            </tr>';
        }

        $html .= '</tbody></table></body></html>';

        return response($html, 200)
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'attachment; filename="content_' . date('Y-m-d_His') . '.pdf"');
    }

    private function escapeCsvField($field)
    {
        if (is_null($field)) return '';

        $field = str_replace('"', '""', $field);

        if (strpos($field, ',') !== false || strpos($field, '"') !== false || strpos($field, "\n") !== false) {
            return '"' . $field . '"';
        }

        return $field;
    }

    /**
     * Upload a media file (image, video, audio, document, etc.) for use in
     * rich-text content bodies.
     *
     * POST /api/v1/content/admin/upload-media
     */
    public function uploadMedia(Request $request): JsonResponse
    {
        $user = Auth::user();

        if (!in_array($user->role, ['admin', 'super_admin'])) {
            return response()->json(['success' => false, 'message' => 'Access denied.'], 403);
        }

        $request->validate([
            'file' => [
                'required',
                'file',
                'max:51200', // 50 MB
                'mimes:jpg,jpeg,png,gif,webp,svg,mp4,mov,avi,webm,mp3,wav,ogg,pdf,doc,docx,xls,xlsx,ppt,pptx,txt,zip',
            ],
            'type' => 'nullable|string|in:image,video,audio,document,attachment',
        ]);

        $file    = $request->file('file');
        $mime    = $file->getMimeType() ?? '';
        $subDir  = match (true) {
            str_starts_with($mime, 'image/')  => 'images',
            str_starts_with($mime, 'video/')  => 'videos',
            str_starts_with($mime, 'audio/')  => 'audio',
            default                           => 'documents',
        };

        $path = $file->store("content-media/{$subDir}", 'uploads');

        $url = private_url($path);

        return response()->json([
            'success' => true,
            'url'     => $url,
            'path'    => $path,
            'name'    => $file->getClientOriginalName(),
            'size'    => $file->getSize(),
            'mime'    => $mime,
        ]);
    }
}
