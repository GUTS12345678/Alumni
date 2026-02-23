<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LandingContent;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class LandingContentController extends Controller
{
    /**
     * Get all landing page content (admin/counselor view).
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();

        if (!in_array($user->role, ['admin', 'super_admin', 'counselor'])) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied.',
            ], 403);
        }

        $query = LandingContent::with(['campus:id,name', 'createdBy:id,name', 'updatedBy:id,name']);

        // Filter by campus
        if ($request->has('campus_id')) {
            $campusId = $request->campus_id;
            $query->where(function ($q) use ($campusId) {
                $q->where('campus_id', $campusId)
                  ->orWhere('is_multi_campus', true)
                  ->orWhereNull('campus_id');
            });
        }

        // Filter by content type
        if ($request->has('content_type')) {
            $query->where('content_type', $request->content_type);
        }

        // Filter by status
        if ($request->has('is_published')) {
            $query->where('is_published', $request->boolean('is_published'));
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('content', 'like', "%{$search}%");
            });
        }

        $contents = $query->ordered()->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $contents,
        ]);
    }

    /**
     * Get public landing page content.
     */
    public function getPublicContent(Request $request): JsonResponse
    {
        $query = LandingContent::active()->published();

        // Filter by campus
        if ($request->has('campus_id')) {
            $query->forCampus($request->campus_id);
        }

        // Filter by content type
        if ($request->has('type')) {
            $query->where('content_type', $request->type);
        }

        $contents = $query->ordered()->get();

        // Transform data for frontend
        $contents = $contents->map(function ($content) {
            return [
                'id' => $content->id,
                'title' => $content->title,
                'description' => $content->description,
                'content_type' => $content->content_type,
                'media_url' => $content->media_url,
                'media_file_url' => $content->media_file_url,
                'thumbnail_url' => $content->thumbnail_url,
                'gallery_images' => $content->gallery_images,
                'content' => $content->content,
                'pages' => $content->pages,
                'use_pages' => $content->use_pages,
                'metadata' => $content->metadata,
                'layout' => $content->layout,
                'background_color' => $content->background_color,
                'text_color' => $content->text_color,
                'section_id' => $content->section_id,
                'display_order' => $content->display_order,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $contents,
        ]);
    }

    /**
     * Get a single content item.
     */
    public function show(LandingContent $content): JsonResponse
    {
        $user = Auth::user();

        if (!in_array($user->role, ['admin', 'super_admin', 'counselor'])) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied.',
            ], 403);
        }

        $content->load(['campus:id,name', 'createdBy:id,name', 'updatedBy:id,name']);

        return response()->json([
            'success' => true,
            'data' => $content,
        ]);
    }

    /**
     * Create a new landing page content.
     */
    public function store(Request $request): JsonResponse
    {
        $user = Auth::user();

        if (!in_array($user->role, ['admin', 'super_admin', 'counselor'])) {
            return response()->json([
                'success' => false,
                'message' => 'Only administrators and counselors can create landing page content.',
            ], 403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'content_type' => ['required', Rule::in(['hero', 'video', 'image', 'text', 'carousel', 'stats', 'testimonial', 'feature', 'custom'])],
            'media_url' => 'nullable|string|max:500',
            'media_file' => 'nullable|string|max:500',
            'thumbnail' => 'nullable|string|max:500',
            'gallery_images' => 'nullable|array',
            'content' => 'nullable|string',
            'pages' => 'nullable|array',
            'use_pages' => 'nullable|boolean',
            'metadata' => 'nullable|array',
            'display_order' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
            'layout' => ['nullable', Rule::in(['full_width', 'contained', 'two_column', 'three_column', 'grid'])],
            'background_color' => 'nullable|string|max:50',
            'text_color' => 'nullable|string|max:50',
            'section_id' => 'nullable|string|max:100',
            'campus_id' => 'nullable|exists:campuses,id',
            'is_multi_campus' => 'nullable|boolean',
            'is_published' => 'nullable|boolean',
            'published_at' => 'nullable|date',
            'expires_at' => 'nullable|date|after:published_at',
        ]);

        $validated['created_by'] = $user->id;

        if (isset($validated['is_published']) && $validated['is_published'] && !isset($validated['published_at'])) {
            $validated['published_at'] = now();
        }

        $content = LandingContent::create($validated);

        $content->load(['campus:id,name', 'createdBy:id,name']);

        return response()->json([
            'success' => true,
            'message' => 'Landing page content created successfully.',
            'data' => $content,
        ], 201);
    }

    /**
     * Update an existing landing page content.
     */
    public function update(Request $request, LandingContent $content): JsonResponse
    {
        $user = Auth::user();

        if (!in_array($user->role, ['admin', 'super_admin', 'counselor'])) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied.',
            ], 403);
        }

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'content_type' => ['sometimes', 'required', Rule::in(['hero', 'video', 'image', 'text', 'carousel', 'stats', 'testimonial', 'feature', 'custom'])],
            'media_url' => 'nullable|string|max:500',
            'media_file' => 'nullable|string|max:500',
            'thumbnail' => 'nullable|string|max:500',
            'gallery_images' => 'nullable|array',
            'content' => 'nullable|string',
            'pages' => 'nullable|array',
            'use_pages' => 'nullable|boolean',
            'metadata' => 'nullable|array',
            'display_order' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
            'layout' => ['nullable', Rule::in(['full_width', 'contained', 'two_column', 'three_column', 'grid'])],
            'background_color' => 'nullable|string|max:50',
            'text_color' => 'nullable|string|max:50',
            'section_id' => 'nullable|string|max:100',
            'campus_id' => 'nullable|exists:campuses,id',
            'is_multi_campus' => 'nullable|boolean',
            'is_published' => 'nullable|boolean',
            'published_at' => 'nullable|date',
            'expires_at' => 'nullable|date|after:published_at',
        ]);

        $validated['updated_by'] = $user->id;

        // Auto-set published_at when publishing
        if (isset($validated['is_published']) && $validated['is_published'] && !$content->published_at && !isset($validated['published_at'])) {
            $validated['published_at'] = now();
        }

        $content->update($validated);

        $content->load(['campus:id,name', 'createdBy:id,name', 'updatedBy:id,name']);

        return response()->json([
            'success' => true,
            'message' => 'Landing page content updated successfully.',
            'data' => $content,
        ]);
    }

    /**
     * Delete a landing page content.
     */
    public function destroy(LandingContent $content): JsonResponse
    {
        $user = Auth::user();

        if (!in_array($user->role, ['admin', 'super_admin', 'counselor'])) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied.',
            ], 403);
        }

        $content->delete();

        return response()->json([
            'success' => true,
            'message' => 'Landing page content deleted successfully.',
        ]);
    }

    /**
     * Toggle publish status.
     */
    public function togglePublish(LandingContent $content): JsonResponse
    {
        $user = Auth::user();

        if (!in_array($user->role, ['admin', 'super_admin', 'counselor'])) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied.',
            ], 403);
        }

        $content->is_published = !$content->is_published;
        
        if ($content->is_published && !$content->published_at) {
            $content->published_at = now();
        }
        
        $content->updated_by = $user->id;
        $content->save();

        return response()->json([
            'success' => true,
            'message' => $content->is_published ? 'Content published successfully.' : 'Content unpublished successfully.',
            'data' => $content,
        ]);
    }

    /**
     * Reorder landing page content.
     */
    public function reorder(Request $request): JsonResponse
    {
        $user = Auth::user();

        if (!in_array($user->role, ['admin', 'super_admin', 'counselor'])) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied.',
            ], 403);
        }

        $validated = $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'required|exists:landing_page_contents,id',
            'items.*.display_order' => 'required|integer|min:0',
        ]);

        foreach ($validated['items'] as $item) {
            LandingContent::where('id', $item['id'])->update([
                'display_order' => $item['display_order'],
                'updated_by' => $user->id,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Content order updated successfully.',
        ]);
    }

    /**
     * Get content types with counts.
     */
    public function getStatistics(): JsonResponse
    {
        $user = Auth::user();

        if (!in_array($user->role, ['admin', 'super_admin', 'counselor'])) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied.',
            ], 403);
        }

        $stats = [
            'total_contents' => LandingContent::count(),
            'published_contents' => LandingContent::where('is_published', true)->count(),
            'active_contents' => LandingContent::where('is_active', true)->count(),
            'by_type' => LandingContent::selectRaw('content_type, COUNT(*) as count')
                ->groupBy('content_type')
                ->pluck('count', 'content_type'),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }
}
