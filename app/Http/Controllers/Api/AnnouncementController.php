<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\AnnouncementRead;
use App\Models\User;
use App\Events\AnnouncementPublished;
use App\Events\ContentChanged;
use App\Services\EmailNotificationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use App\Traits\ExportsPdf;

class AnnouncementController extends Controller
{
    use ExportsPdf;
    /**
     * Get announcements for the authenticated user (alumni).
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        $query = Announcement::where('is_published', true)
            ->where(function ($q) use ($user) {
                // All alumni announcements
                $q->where('target_type', 'all');
                
                // Batch-specific announcements
                if ($user->alumniProfile && $user->alumniProfile->graduation_year) {
                    $q->orWhere(function ($batchQuery) use ($user) {
                        $batchQuery->where('target_type', 'batch')
                            ->whereJsonContains('target_batch_years', (string) $user->alumniProfile->graduation_year);
                    });
                }
                
                // Department-specific announcements
                if ($user->alumniProfile && $user->alumniProfile->department_id) {
                    $q->orWhere(function ($deptQuery) use ($user) {
                        $deptQuery->where('target_type', 'department')
                            ->whereJsonContains('target_department_ids', $user->alumniProfile->department_id);
                    });
                }
            })
            ->with('createdBy:id,name')
            ->withCount(['reads as is_read' => function ($query) use ($user) {
                $query->where('user_id', $user->id);
            }])
            ->orderBy('priority', 'desc')
            ->orderBy('created_at', 'desc');

        // Filter by read status
        if ($request->has('unread_only') && $request->unread_only) {
            $query->whereDoesntHave('reads', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            });
        }

        $announcements = $query->paginate($request->get('per_page', 10));

        return response()->json([
            'success' => true,
            'data' => $announcements,
        ]);
    }

    /**
     * Get a single announcement.
     */
    public function show(Announcement $announcement): JsonResponse
    {
        $user = Auth::user();
        
        // Check if user can view this announcement
        if (!$this->canViewAnnouncement($user, $announcement)) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to view this announcement.',
            ], 403);
        }

        $announcement->load('createdBy:id,name');

        // Mark as read
        AnnouncementRead::firstOrCreate([
            'announcement_id' => $announcement->id,
            'user_id' => $user->id,
        ], [
            'read_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'data' => $announcement,
        ]);
    }

    /**
     * Create a new announcement (admin only).
     */
    public function store(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        if (!in_array($user->role, ['admin', 'super_admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Only administrators can create announcements.',
            ], 403);
        }

        $request->validate([
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
            'target_type' => ['required', Rule::in(['all', 'batch', 'department'])],
            'target_batch_years' => 'required_if:target_type,batch|nullable|array',
            'target_batch_years.*' => 'integer|min:1950|max:2100',
            'target_department_ids' => 'required_if:target_type,department|nullable|array',
            'target_department_ids.*' => 'exists:departments,id',
            'priority' => ['nullable', Rule::in(['low', 'normal', 'high', 'urgent'])],
            'publish_now' => 'nullable|boolean',
            'scheduled_at' => 'nullable|date|after:now',
        ]);

        $announcement = Announcement::create([
            'title' => $request->title,
            'content' => $request->content ?? '',
            'pages' => $request->pages,
            'use_pages' => $request->use_pages ?? false,
            'featured_image' => $request->featured_image,
            'show_on_landing' => $request->show_on_landing ?? false,
            'target_type' => $request->target_type,
            'target_batch_years' => $request->target_batch_years,
            'target_department_ids' => $request->target_department_ids,
            'priority' => $request->priority ?? 'normal',
            'is_published' => $request->publish_now ?? true,
            'published_at' => $request->publish_now ? now() : null,
            'scheduled_at' => $request->scheduled_at,
            'created_by' => $user->id,
        ]);

        if ($announcement->is_published) {
            broadcast(new AnnouncementPublished($announcement));
            
            // Send email notifications to all eligible alumni
            try {
                $emailService = app(EmailNotificationService::class);
                $emailResult = $emailService->sendAnnouncementNotification($announcement);
                
                $emailInfo = $emailResult['success'] 
                    ? " Email notifications queued for {$emailResult['total_recipients']} recipients."
                    : '';
            } catch (\Exception $e) {
                \Log::error('Failed to send announcement emails: ' . $e->getMessage());
                $emailInfo = '';
            }
        }

        return response()->json([
            'success' => true,
            'data' => $announcement,
            'message' => 'Announcement created successfully.' . ($emailInfo ?? ''),
        ], 201);
    }

    /**
     * Update an announcement (admin only).
     */
    public function update(Announcement $announcement, Request $request): JsonResponse
    {
        $user = Auth::user();
        
        if (!in_array($user->role, ['admin', 'super_admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Only administrators can update announcements.',
            ], 403);
        }

        $request->validate([
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
            'target_type' => ['sometimes', Rule::in(['all', 'batch', 'department'])],
            'target_batch_years' => 'nullable|array',
            'target_batch_years.*' => 'integer|min:1950|max:2100',
            'target_department_ids' => 'nullable|array',
            'target_department_ids.*' => 'exists:departments,id',
            'priority' => ['nullable', Rule::in(['low', 'normal', 'high', 'urgent'])],
            'is_published' => 'sometimes|boolean',
        ]);

        $wasPublished = $announcement->is_published;
        
        $announcement->update($request->only([
            'title', 'content', 'pages', 'use_pages', 'featured_image', 'show_on_landing',
            'target_type', 'target_batch_years',
            'target_department_ids', 'priority', 'is_published',
        ]));

        // If just published, broadcast and send emails
        if (!$wasPublished && $announcement->is_published) {
            $announcement->update(['published_at' => now()]);
            broadcast(new AnnouncementPublished($announcement));
            
            // Send email notifications
            try {
                $emailService = app(EmailNotificationService::class);
                $emailResult = $emailService->sendAnnouncementNotification($announcement);
                
                $emailInfo = $emailResult['success'] 
                    ? " Email notifications queued for {$emailResult['total_recipients']} recipients."
                    : '';
            } catch (\Exception $e) {
                \Log::error('Failed to send announcement emails: ' . $e->getMessage());
                $emailInfo = '';
            }
        }

        return response()->json([
            'success' => true,
            'data' => $announcement,
            'message' => 'Announcement updated successfully.' . ($emailInfo ?? ''),
        ]);
    }

    /**
     * Delete an announcement (admin only).
     */
    public function destroy(Announcement $announcement): JsonResponse
    {
        $user = Auth::user();
        
        if (!in_array($user->role, ['admin', 'super_admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Only administrators can delete announcements.',
            ], 403);
        }

        $announcement->delete();

        ContentChanged::dispatch('announcement', 'deleted', $announcement->id, $announcement->title);

        return response()->json([
            'success' => true,
            'message' => 'Announcement deleted successfully.',
        ]);
    }

    /**
     * Get all announcements for admin management.
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

        $query = Announcement::with('createdBy:id,name')
            ->withCount('reads')
            ->orderBy('created_at', 'desc');

        // Filter by campus
        if ($request->has('campus_id')) {
            $campusId = $request->campus_id;
            $query->where(function ($q) use ($campusId) {
                $q->where('campus_id', $campusId)
                  ->orWhere('is_multi_campus', true)
                  ->orWhereNull('campus_id');
            });
        }

        // Filter by published status
        if ($request->has('is_published')) {
            $query->where('is_published', $request->boolean('is_published'));
        }

        // Filter by target type
        if ($request->has('target_type')) {
            $query->where('target_type', $request->target_type);
        }

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('content', 'like', "%{$search}%");
            });
        }

        $announcements = $query->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $announcements,
        ]);
    }

    /**
     * Get unread announcement count.
     */
    public function getUnreadCount(): JsonResponse
    {
        $user = Auth::user();
        
        $count = Announcement::where('is_published', true)
            ->where(function ($q) use ($user) {
                $q->where('target_type', 'all');
                
                if ($user->alumniProfile && $user->alumniProfile->graduation_year) {
                    $q->orWhere(function ($batchQuery) use ($user) {
                        $batchQuery->where('target_type', 'batch')
                            ->whereJsonContains('target_batch_years', (string) $user->alumniProfile->graduation_year);
                    });
                }
                
                if ($user->alumniProfile && $user->alumniProfile->department_id) {
                    $q->orWhere(function ($deptQuery) use ($user) {
                        $deptQuery->where('target_type', 'department')
                            ->whereJsonContains('target_department_ids', $user->alumniProfile->department_id);
                    });
                }
            })
            ->whereDoesntHave('reads', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->count();

        return response()->json([
            'success' => true,
            'data' => ['unread_count' => $count],
        ]);
    }

    /**
     * Mark an announcement as read.
     */
    public function markAsRead(Announcement $announcement): JsonResponse
    {
        $user = Auth::user();
        
        AnnouncementRead::firstOrCreate([
            'announcement_id' => $announcement->id,
            'user_id' => $user->id,
        ], [
            'read_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Announcement marked as read.',
        ]);
    }

    /**
     * Get available batch years for targeting.
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

    // =========== HELPER METHODS ===========

    private function canViewAnnouncement(User $user, Announcement $announcement): bool
    {
        // Admins can view all announcements
        if (in_array($user->role, ['admin', 'super_admin'])) {
            return true;
        }

        if (!$announcement->is_published) {
            return false;
        }

        if ($announcement->target_type === 'all') {
            return true;
        }

        if ($announcement->target_type === 'batch' && $user->alumniProfile) {
            return in_array(
                (string) $user->alumniProfile->graduation_year,
                $announcement->target_batch_years ?? []
            );
        }

        if ($announcement->target_type === 'department' && $user->alumniProfile) {
            return in_array(
                $user->alumniProfile->department_id,
                $announcement->target_department_ids ?? []
            );
        }

        return false;
    }

    /**
     * Export announcements.
     */
    public function exportAnnouncements(Request $request)
    {
        $user = Auth::user();
        
        if (!in_array($user->role, ['admin', 'super_admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied.',
            ], 403);
        }

        $format = $request->get('format', 'csv');

        $query = Announcement::with('createdBy:id,name')
            ->withCount('reads')
            ->orderBy('created_at', 'desc');

        // Apply filters (same as adminIndex)
        if ($request->has('campus_id')) {
            $campusId = $request->campus_id;
            $query->where(function ($q) use ($campusId) {
                $q->where('campus_id', $campusId)
                  ->orWhere('is_multi_campus', true)
                  ->orWhereNull('campus_id');
            });
        }

        if ($request->has('is_published')) {
            $query->where('is_published', $request->boolean('is_published'));
        }

        if ($request->has('target_type')) {
            $query->where('target_type', $request->target_type);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('content', 'like', "%{$search}%");
            });
        }

        $announcements = $query->limit(5000)->get();

        switch ($format) {
            case 'excel':
                return $this->exportAnnouncementsToExcel($announcements);
            case 'pdf':
                return $this->exportAnnouncementsToPdf($announcements);
            case 'csv':
            default:
                return $this->exportAnnouncementsToCsv($announcements);
        }
    }

    private function exportAnnouncementsToCsv($announcements)
    {
        $handle = fopen('php://temp', 'w+');

        fputcsv($handle, [
            'Announcement ID', 'Title', 'Priority', 'Target Type', 'Target Audience',
            'Show on Landing', 'Status', 'Published Date', 'Created Date', 'Views Count', 'Created By'
        ]);

        foreach ($announcements as $announcement) {
            $targetType = ucfirst($announcement->target_type);

            $targetAudience = 'All';
            if ($announcement->target_type === 'batch' && $announcement->target_batch_years) {
                $targetAudience = 'Batches: ' . implode(', ', $announcement->target_batch_years);
            } elseif ($announcement->target_type === 'department' && $announcement->target_department_ids) {
                $targetAudience = 'Departments: ' . implode(', ', $announcement->target_department_ids);
            }

            $status = $announcement->is_published ? 'Published' : 'Draft';
            $publishedDate = $announcement->published_at ? $announcement->published_at->format('Y-m-d H:i:s') : 'Not published';
            $priority = ucfirst($announcement->priority ?? 'normal');
            $showOnLanding = $announcement->show_on_landing ? 'Yes' : 'No';

            fputcsv($handle, [
                $announcement->id,
                $announcement->title,
                $priority,
                $targetType,
                $targetAudience,
                $showOnLanding,
                $status,
                $publishedDate,
                $announcement->created_at->format('Y-m-d H:i:s'),
                $announcement->reads_count ?? 0,
                $announcement->createdBy->name ?? 'Unknown'
            ]);
        }

        rewind($handle);
        $content = stream_get_contents($handle);
        fclose($handle);

        return response($content, 200)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="announcements_' . date('Y-m-d_His') . '.csv"');
    }

    private function exportAnnouncementsToExcel($announcements)
    {
        $handle = fopen('php://temp', 'w+');
        fwrite($handle, "\xEF\xBB\xBF"); // UTF-8 BOM

        fputcsv($handle, [
            'Announcement ID', 'Title', 'Priority', 'Target Type', 'Target Audience',
            'Show on Landing', 'Status', 'Published Date', 'Created Date', 'Views Count', 'Created By'
        ]);

        foreach ($announcements as $announcement) {
            $targetType = ucfirst($announcement->target_type);

            $targetAudience = 'All';
            if ($announcement->target_type === 'batch' && $announcement->target_batch_years) {
                $targetAudience = 'Batches: ' . implode(', ', $announcement->target_batch_years);
            } elseif ($announcement->target_type === 'department' && $announcement->target_department_ids) {
                $targetAudience = 'Departments: ' . implode(', ', $announcement->target_department_ids);
            }

            $status = $announcement->is_published ? 'Published' : 'Draft';
            $publishedDate = $announcement->published_at ? $announcement->published_at->format('Y-m-d H:i:s') : 'Not published';
            $priority = ucfirst($announcement->priority ?? 'normal');
            $showOnLanding = $announcement->show_on_landing ? 'Yes' : 'No';

            fputcsv($handle, [
                $announcement->id,
                $announcement->title,
                $priority,
                $targetType,
                $targetAudience,
                $showOnLanding,
                $status,
                $publishedDate,
                $announcement->created_at->format('Y-m-d H:i:s'),
                $announcement->reads_count ?? 0,
                $announcement->createdBy->name ?? 'Unknown'
            ]);
        }

        rewind($handle);
        $content = stream_get_contents($handle);
        fclose($handle);

        return response($content, 200)
            ->header('Content-Type', 'application/vnd.ms-excel')
            ->header('Content-Disposition', 'attachment; filename="announcements_' . date('Y-m-d_His') . '.xlsx"');
    }

    private function exportAnnouncementsToPdf($announcements)
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
    </style>
</head>
<body>
    <h1>Announcements Report</h1>
    <div class="report-info">
        Generated on ' . date('F d, Y h:i A') . '<br>
        Total Records: ' . count($announcements) . '
    </div>
    <table>
        <thead>
            <tr>
                <th>Title</th>
                <th>Priority</th>
                <th>Target Type</th>
                <th>Target Audience</th>
                <th>Show on Landing</th>
                <th>Status</th>
                <th>Published Date</th>
                <th>Created Date</th>
                <th>Views</th>
                <th>Created By</th>
            </tr>
        </thead>
        <tbody>';

        foreach ($announcements as $announcement) {
            $targetType = ucfirst($announcement->target_type);
            
            $targetAudience = 'All';
            if ($announcement->target_type === 'batch' && $announcement->target_batch_years) {
                $years = array_slice($announcement->target_batch_years, 0, 3);
                $targetAudience = 'Batches: ' . implode(', ', $years);
                if (count($announcement->target_batch_years) > 3) {
                    $targetAudience .= '...';
                }
            } elseif ($announcement->target_type === 'department' && $announcement->target_department_ids) {
                $depts = array_slice($announcement->target_department_ids, 0, 2);
                $targetAudience = 'Depts: ' . implode(', ', $depts);
                if (count($announcement->target_department_ids) > 2) {
                    $targetAudience .= '...';
                }
            }

            $status = $announcement->is_published ? 'Published' : 'Draft';
            $statusClass = $announcement->is_published ? 'status-published' : 'status-draft';
            $publishedDate = $announcement->published_at ? $announcement->published_at->format('M d, Y') : 'N/A';
            $priority = ucfirst($announcement->priority ?? 'normal');
            $showOnLanding = $announcement->show_on_landing ? 'Yes' : 'No';
            
            $html .= '<tr>
                <td>' . htmlspecialchars($announcement->title) . '</td>
                <td>' . htmlspecialchars($priority) . '</td>
                <td>' . htmlspecialchars($targetType) . '</td>
                <td>' . htmlspecialchars($targetAudience) . '</td>
                <td>' . htmlspecialchars($showOnLanding) . '</td>
                <td class="' . $statusClass . '">' . htmlspecialchars($status) . '</td>
                <td>' . htmlspecialchars($publishedDate) . '</td>
                <td>' . $announcement->created_at->format('M d, Y') . '</td>
                <td>' . ($announcement->reads_count ?? 0) . '</td>
                <td>' . htmlspecialchars($announcement->createdBy->name ?? 'Unknown') . '</td>
            </tr>';
        }

        $html .= '</tbody>
    </table>
</body>
</html>';

        return $this->renderPdf($html, 'announcements_' . date('Y-m-d_His') . '.pdf');
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
