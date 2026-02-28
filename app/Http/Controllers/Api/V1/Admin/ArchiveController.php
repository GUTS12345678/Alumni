<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\Batch;
use App\Models\CareerHistory;
use App\Models\Course;
use App\Models\Department;
use App\Models\JobPosting;
use App\Models\Message;
use App\Models\Survey;
use App\Models\AlumniProfile;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ArchiveController extends Controller
{
    /**
     * Model configuration for archive
     */
    private function getModelConfig(): array
    {
        return [
            'users' => [
                'model' => User::class,
                'label' => 'User',
                'searchable' => ['name', 'email'],
                'display' => fn($item) => [
                    'title' => $item->name,
                    'subtitle' => $item->email,
                    'meta' => $item->role ?? 'Unknown Role',
                ],
                'with' => ['campus'],
            ],
            'announcements' => [
                'model' => Announcement::class,
                'label' => 'Announcement',
                'searchable' => ['title', 'content'],
                'display' => fn($item) => [
                    'title' => $item->title,
                    'subtitle' => strip_tags(substr($item->content ?? '', 0, 100)),
                    'meta' => $item->type ?? 'general',
                ],
                'with' => ['campus'],
            ],
            'surveys' => [
                'model' => Survey::class,
                'label' => 'Survey',
                'searchable' => ['title', 'description'],
                'display' => fn($item) => [
                    'title' => $item->title,
                    'subtitle' => substr($item->description ?? '', 0, 100),
                    'meta' => $item->status ?? 'unknown',
                ],
                'with' => [],
            ],
            'batches' => [
                'model' => Batch::class,
                'label' => 'Batch',
                'searchable' => ['name'],
                'display' => fn($item) => [
                    'title' => $item->name,
                    'subtitle' => 'Graduation Year: ' . ($item->graduation_year ?? 'N/A'),
                    'meta' => $item->status ?? 'active',
                ],
                'with' => ['campus'],
            ],
            'departments' => [
                'model' => Department::class,
                'label' => 'Department',
                'searchable' => ['name', 'code'],
                'display' => fn($item) => [
                    'title' => $item->name,
                    'subtitle' => $item->code ?? '',
                    'meta' => $item->is_active ? 'Active' : 'Inactive',
                ],
                'with' => ['campus'],
            ],
            'courses' => [
                'model' => Course::class,
                'label' => 'Course',
                'searchable' => ['name', 'code'],
                'display' => fn($item) => [
                    'title' => $item->name,
                    'subtitle' => $item->code ?? '',
                    'meta' => $item->department ? $item->department->name : 'No Department',
                ],
                'with' => ['department', 'campus'],
            ],
            'job_postings' => [
                'model' => JobPosting::class,
                'label' => 'Job Posting',
                'searchable' => ['title', 'company_name', 'description'],
                'display' => fn($item) => [
                    'title' => $item->title,
                    'subtitle' => $item->company_name ?? '',
                    'meta' => $item->status ?? 'unknown',
                ],
                'with' => [],
            ],
            'messages' => [
                'model' => Message::class,
                'label' => 'Message',
                'searchable' => ['subject', 'body'],
                'display' => fn($item) => [
                    'title' => $item->subject ?? 'No Subject',
                    'subtitle' => substr($item->body ?? '', 0, 100),
                    'meta' => '',
                ],
                'with' => [],
            ],
            'alumni_profiles' => [
                'model' => AlumniProfile::class,
                'label' => 'Alumni Profile',
                'searchable' => ['first_name', 'last_name', 'student_id'],
                'display' => fn($item) => [
                    'title' => trim(($item->first_name ?? '') . ' ' . ($item->last_name ?? '')),
                    'subtitle' => 'Student ID: ' . ($item->student_id ?? 'N/A'),
                    'meta' => $item->graduation_year ?? '',
                ],
                'with' => ['campus'],
            ],
            'career_history' => [
                'model' => CareerHistory::class,
                'label' => 'Career History',
                'searchable' => ['job_title', 'company_name'],
                'display' => fn($item) => [
                    'title' => $item->job_title ?? 'Untitled Position',
                    'subtitle' => $item->company_name ?? '',
                    'meta' => '',
                ],
                'with' => [],
            ],
        ];
    }

    /**
     * Get all archived (soft-deleted) items across all models
     */
    public function index(Request $request)
    {
        $type = $request->get('type', 'all');
        $search = $request->get('search', '');
        $sortBy = $request->get('sort_by', 'deleted_at');
        $sortDir = $request->get('sort_dir', 'desc');
        $perPage = min((int) $request->get('per_page', 20), 100);

        $configs = $this->getModelConfig();
        $results = collect();

        $typesToQuery = $type === 'all' ? array_keys($configs) : [$type];

        foreach ($typesToQuery as $typeName) {
            if (!isset($configs[$typeName])) continue;

            $config = $configs[$typeName];
            $query = $config['model']::onlyTrashed();

            if (!empty($config['with'])) {
                $query->with($config['with']);
            }

            if ($search) {
                $query->where(function ($q) use ($search, $config) {
                    foreach ($config['searchable'] as $field) {
                        $q->orWhere($field, 'like', "%{$search}%");
                    }
                });
            }

            $items = $query->get()->map(function ($item) use ($config, $typeName) {
                $display = ($config['display'])($item);
                return [
                    'id' => $item->id,
                    'type' => $typeName,
                    'type_label' => $config['label'],
                    'title' => $display['title'],
                    'subtitle' => $display['subtitle'],
                    'meta' => $display['meta'],
                    'deleted_at' => $item->deleted_at->toISOString(),
                    'deleted_ago' => $item->deleted_at->diffForHumans(),
                    'created_at' => $item->created_at?->toISOString(),
                    'campus' => $item->campus->name ?? null,
                ];
            });

            $results = $results->concat($items);
        }

        // Sort
        if ($sortBy === 'deleted_at') {
            $results = $sortDir === 'desc'
                ? $results->sortByDesc('deleted_at')
                : $results->sortBy('deleted_at');
        } elseif ($sortBy === 'title') {
            $results = $sortDir === 'desc'
                ? $results->sortByDesc('title')
                : $results->sortBy('title');
        } elseif ($sortBy === 'type') {
            $results = $sortDir === 'desc'
                ? $results->sortByDesc('type_label')
                : $results->sortBy('type_label');
        }

        $results = $results->values();

        // Manual pagination
        $total = $results->count();
        $page = max(1, (int) $request->get('page', 1));
        $paginated = $results->slice(($page - 1) * $perPage, $perPage)->values();

        // Get counts per type
        $counts = [];
        foreach ($configs as $typeName => $config) {
            $counts[$typeName] = [
                'label' => $config['label'],
                'count' => $config['model']::onlyTrashed()->count(),
            ];
        }

        return response()->json([
            'data' => $paginated,
            'meta' => [
                'total' => $total,
                'per_page' => $perPage,
                'current_page' => $page,
                'last_page' => max(1, ceil($total / $perPage)),
            ],
            'counts' => $counts,
            'available_types' => collect($configs)->map(fn($c) => $c['label'])->toArray(),
        ]);
    }

    /**
     * Restore a soft-deleted item
     */
    public function restore(Request $request, string $type, int $id)
    {
        $configs = $this->getModelConfig();

        if (!isset($configs[$type])) {
            return response()->json(['message' => 'Invalid type'], 422);
        }

        $model = $configs[$type]['model']::onlyTrashed()->findOrFail($id);
        $model->restore();

        return response()->json([
            'message' => $configs[$type]['label'] . ' restored successfully',
        ]);
    }

    /**
     * Permanently delete a soft-deleted item
     */
    public function forceDelete(Request $request, string $type, int $id)
    {
        $configs = $this->getModelConfig();

        if (!isset($configs[$type])) {
            return response()->json(['message' => 'Invalid type'], 422);
        }

        $model = $configs[$type]['model']::onlyTrashed()->findOrFail($id);
        $model->forceDelete();

        return response()->json([
            'message' => $configs[$type]['label'] . ' permanently deleted',
        ]);
    }

    /**
     * Bulk restore items
     */
    public function bulkRestore(Request $request)
    {
        $request->validate([
            'items' => 'required|array',
            'items.*.type' => 'required|string',
            'items.*.id' => 'required|integer',
        ]);

        $configs = $this->getModelConfig();
        $restored = 0;

        foreach ($request->items as $item) {
            if (!isset($configs[$item['type']])) continue;

            $model = $configs[$item['type']]['model']::onlyTrashed()->find($item['id']);
            if ($model) {
                $model->restore();
                $restored++;
            }
        }

        return response()->json([
            'message' => "{$restored} item(s) restored successfully",
            'restored_count' => $restored,
        ]);
    }

    /**
     * Bulk force delete items
     */
    public function bulkForceDelete(Request $request)
    {
        $request->validate([
            'items' => 'required|array',
            'items.*.type' => 'required|string',
            'items.*.id' => 'required|integer',
        ]);

        $configs = $this->getModelConfig();
        $deleted = 0;

        foreach ($request->items as $item) {
            if (!isset($configs[$item['type']])) continue;

            $model = $configs[$item['type']]['model']::onlyTrashed()->find($item['id']);
            if ($model) {
                $model->forceDelete();
                $deleted++;
            }
        }

        return response()->json([
            'message' => "{$deleted} item(s) permanently deleted",
            'deleted_count' => $deleted,
        ]);
    }

    public function clearAll()
    {
        $configs = $this->getModelConfig();
        $deleted = 0;

        foreach ($configs as $config) {
            $count = $config['model']::onlyTrashed()->count();
            if ($count > 0) {
                $config['model']::onlyTrashed()->forceDelete();
                $deleted += $count;
            }
        }

        // Flush analytics caches
        $cacheKeys = ['dashboard_metrics', 'alumni_stats', 'analytics_overview', 'analytics_time_to_job', 'analytics_comprehensive'];
        foreach ($cacheKeys as $key) {
            \Illuminate\Support\Facades\Cache::forget($key);
            foreach (\App\Models\Campus::pluck('id') as $campusId) {
                \Illuminate\Support\Facades\Cache::forget("{$key}_campus_{$campusId}");
            }
        }

        return response()->json([
            'message' => "{$deleted} archived item(s) permanently deleted",
            'deleted_count' => $deleted,
        ]);
    }
}
