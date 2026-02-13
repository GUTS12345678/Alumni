<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Announcement extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'title',
        'content',
        'pages',
        'use_pages',
        'featured_image',
        'gallery_images',
        'type',
        'target_type',
        'target_batch_years',
        'target_department_ids',
        'target_filters',
        'priority',
        'is_published',
        'created_by',
        'scheduled_at',
        'published_at',
        'expires_at',
        'status',
        'show_on_landing',
    ];

    protected $casts = [
        'target_filters' => 'array',
        'target_batch_years' => 'array',
        'target_department_ids' => 'array',
        'gallery_images' => 'array',
        'pages' => 'array',
        'use_pages' => 'boolean',
        'is_published' => 'boolean',
        'show_on_landing' => 'boolean',
        'scheduled_at' => 'datetime',
        'published_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    /**
     * Get the creator
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Alias for creator relationship (used by controller)
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get read receipts
     */
    public function reads(): HasMany
    {
        return $this->hasMany(AnnouncementRead::class);
    }

    /**
     * Scope for published announcements
     */
    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    /**
     * Scope for active announcements (published and not expired)
     */
    public function scopeActive($query)
    {
        return $query->published()
            ->where(function ($q) {
                $q->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            });
    }

    /**
     * Scope for announcements targeted to a specific user
     */
    public function scopeForUser($query, User $user)
    {
        return $query->where(function ($q) use ($user) {
            // General announcements (no filters)
            $q->where('type', 'general')
                ->orWhere(function ($sub) {
                    $sub->whereNull('target_filters')
                        ->orWhereRaw("JSON_LENGTH(target_filters) = 0");
                });

            // If user is alumni, check batch/department/course filters
            if ($user->isAlumni() && $user->alumniProfile) {
                $profile = $user->alumniProfile;

                $q->orWhere(function ($sub) use ($profile) {
                    // Batch filter
                    if ($profile->batch_id) {
                        $sub->orWhereJsonContains('target_filters->batch_ids', $profile->batch_id);
                    }

                    // Department filter
                    if ($profile->department_id) {
                        $sub->orWhereJsonContains('target_filters->department_ids', $profile->department_id);
                    }

                    // Course filter
                    if ($profile->course_id) {
                        $sub->orWhereJsonContains('target_filters->course_ids', $profile->course_id);
                    }
                });
            }
        });
    }

    /**
     * Scope by priority
     */
    public function scopeByPriority($query, string $priority)
    {
        return $query->where('priority', $priority);
    }

    /**
     * Check if announcement was read by a user
     */
    public function wasReadBy(int $userId): bool
    {
        return $this->reads()->where('user_id', $userId)->exists();
    }

    /**
     * Mark as read by user
     */
    public function markReadBy(int $userId): AnnouncementRead
    {
        return AnnouncementRead::firstOrCreate([
            'announcement_id' => $this->id,
            'user_id' => $userId,
        ], [
            'read_at' => now(),
        ]);
    }

    /**
     * Publish the announcement
     */
    public function publish(): void
    {
        $this->update([
            'status' => 'published',
            'published_at' => now(),
        ]);
    }

    /**
     * Check if announcement is expired
     */
    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    /**
     * Get target audience description
     */
    public function getTargetDescription(): string
    {
        if ($this->type === 'general' || !$this->target_filters) {
            return 'All Users';
        }

        $targets = [];

        if (!empty($this->target_filters['batch_ids'])) {
            $targets[] = count($this->target_filters['batch_ids']) . ' batch(es)';
        }

        if (!empty($this->target_filters['department_ids'])) {
            $targets[] = count($this->target_filters['department_ids']) . ' department(s)';
        }

        if (!empty($this->target_filters['course_ids'])) {
            $targets[] = count($this->target_filters['course_ids']) . ' course(s)';
        }

        return implode(', ', $targets) ?: 'All Users';
    }
}
