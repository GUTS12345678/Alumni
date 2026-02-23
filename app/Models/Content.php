<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Content extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'contents';

    const TYPE_ANNOUNCEMENT = 'announcement';
    const TYPE_JOB = 'job';
    const TYPE_EVENT = 'event';
    const TYPE_NEWS = 'news';
    const TYPE_BLOG = 'blog';
    const TYPE_SCHOLARSHIP = 'scholarship';
    const TYPE_RESOURCE = 'resource';

    const TYPES = [
        self::TYPE_ANNOUNCEMENT,
        self::TYPE_JOB,
        self::TYPE_EVENT,
        self::TYPE_NEWS,
        self::TYPE_BLOG,
        self::TYPE_SCHOLARSHIP,
        self::TYPE_RESOURCE,
    ];

    protected $fillable = [
        // Shared fields
        'content_type',
        'title',
        'slug',
        'content',
        'pages',
        'use_pages',
        'featured_image',
        'gallery_images',
        'campus_id',
        'is_multi_campus',
        'status',
        'is_featured',
        'featured_until',
        'show_on_landing',
        'priority',
        'views_count',
        'created_by',
        'scheduled_at',
        'published_at',
        'expires_at',

        // Announcement-specific fields
        'target_type',
        'target_filters',
        'target_batch_years',
        'target_department_ids',
        'is_published',

        // Job-specific fields
        'company_name',
        'company_logo',
        'company_website',
        'category_id',
        'job_type',
        'experience_level',
        'work_arrangement',
        'location',
        'is_remote',
        'contact_person',
        'contact_email',
        'contact_phone',
        'application_url',
        'external_url',
        'application_instructions',
        'salary_min',
        'salary_max',
        'salary_currency',
        'salary_range',
        'salary_period',
        'is_salary_visible',
        'benefits',
        'requirements',
        'qualifications',
        'skills_required',
        'application_deadline',
        'start_date',
        'background_image',
    ];

    protected $casts = [
        // Shared
        'pages' => 'array',
        'gallery_images' => 'array',
        'use_pages' => 'boolean',
        'is_multi_campus' => 'boolean',
        'is_featured' => 'boolean',
        'show_on_landing' => 'boolean',
        'views_count' => 'integer',
        'scheduled_at' => 'datetime',
        'published_at' => 'datetime',
        'expires_at' => 'datetime',
        'featured_until' => 'date',

        // Announcement-specific
        'target_filters' => 'array',
        'target_batch_years' => 'array',
        'target_department_ids' => 'array',
        'is_published' => 'boolean',

        // Job-specific
        'is_remote' => 'boolean',
        'is_salary_visible' => 'boolean',
        'salary_min' => 'decimal:2',
        'salary_max' => 'decimal:2',
        'application_deadline' => 'date',
        'start_date' => 'date',
    ];

    protected $appends = [
        'featured_image_url',
        'company_logo_url',
        'background_image_url',
    ];

    // =========== BOOT ===========

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($content) {
            if (empty($content->slug)) {
                $content->slug = Str::slug($content->title) . '-' . Str::random(6);
            }
        });
    }

    // =========== IMAGE URL ACCESSORS ===========

    public function getFeaturedImageUrlAttribute(): ?string
    {
        return $this->getStorageUrl($this->featured_image);
    }

    public function getCompanyLogoUrlAttribute(): ?string
    {
        return $this->getStorageUrl($this->company_logo);
    }

    public function getBackgroundImageUrlAttribute(): ?string
    {
        return $this->getStorageUrl($this->background_image);
    }

    private function getStorageUrl(?string $path): ?string
    {
        if (!$path) {
            return null;
        }

        if (str_starts_with($path, '/api/') || str_starts_with($path, 'http')) {
            return $path;
        }

        // Strip legacy /storage/ prefix if present
        if (str_starts_with($path, '/storage/')) {
            $path = substr($path, 9);
        }

        return '/api/v1/files/' . $path;
    }

    // =========== RELATIONSHIPS ===========

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(JobCategory::class, 'category_id');
    }

    public function campus(): BelongsTo
    {
        return $this->belongsTo(Campus::class, 'campus_id');
    }

    public function reads(): HasMany
    {
        return $this->hasMany(ContentRead::class);
    }

    public function contentViews(): HasMany
    {
        return $this->hasMany(ContentView::class);
    }

    // =========== TYPE SCOPES ===========

    public function scopeAnnouncements($query)
    {
        return $query->where('content_type', self::TYPE_ANNOUNCEMENT);
    }

    public function scopeJobs($query)
    {
        return $query->where('content_type', self::TYPE_JOB);
    }

    public function scopeEvents($query)
    {
        return $query->where('content_type', self::TYPE_EVENT);
    }

    public function scopeOfType($query, string $type)
    {
        return $query->where('content_type', $type);
    }

    // =========== STATUS SCOPES ===========

    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    public function scopeDraft($query)
    {
        return $query->where('status', 'draft');
    }

    public function scopeActive($query)
    {
        return $query->published()
            ->where(function ($q) {
                $q->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->where(function ($q) {
                $q->whereNull('application_deadline')
                    ->orWhere('application_deadline', '>=', now()->toDateString());
            });
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true)
            ->where(function ($q) {
                $q->whereNull('featured_until')
                    ->orWhere('featured_until', '>=', now()->toDateString());
            });
    }

    public function scopeExpired($query)
    {
        return $query->where(function ($q) {
            $q->where(function ($sub) {
                $sub->whereNotNull('expires_at')
                    ->where('expires_at', '<=', now());
            })->orWhere(function ($sub) {
                $sub->whereNotNull('application_deadline')
                    ->where('application_deadline', '<', now()->toDateString());
            });
        });
    }

    // =========== ANNOUNCEMENT-SPECIFIC SCOPES ===========

    /**
     * Scope for announcements targeted to a specific user.
     */
    public function scopeForUser($query, User $user)
    {
        return $query->where(function ($q) use ($user) {
            // General announcements (target all)
            $q->where('target_type', 'all')
                ->orWhere(function ($sub) {
                    $sub->whereNull('target_filters')
                        ->orWhereRaw("JSON_LENGTH(target_filters) = 0");
                });

            // If user is alumni, check batch/department/course filters
            if ($user->isAlumni() && $user->alumniProfile) {
                $profile = $user->alumniProfile;

                $q->orWhere(function ($sub) use ($profile) {
                    if ($profile->graduation_year) {
                        $sub->orWhere(function ($bq) use ($profile) {
                            $bq->where('target_type', 'batch')
                                ->whereJsonContains('target_batch_years', (string) $profile->graduation_year);
                        });
                    }

                    if ($profile->department_id) {
                        $sub->orWhere(function ($dq) use ($profile) {
                            $dq->where('target_type', 'department')
                                ->whereJsonContains('target_department_ids', $profile->department_id);
                        });
                    }

                    if ($profile->course_id) {
                        $sub->orWhereJsonContains('target_filters->course_ids', $profile->course_id);
                    }
                });
            }
        });
    }

    // =========== JOB-SPECIFIC SCOPES ===========

    public function scopeOfJobType($query, string $type)
    {
        return $query->where('job_type', $type);
    }

    public function scopeOfExperience($query, string $level)
    {
        return $query->where('experience_level', $level);
    }

    public function scopeRemote($query)
    {
        return $query->where('is_remote', true);
    }

    // =========== GENERAL SCOPES ===========

    public function scopeSearch($query, string $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('title', 'like', "%{$search}%")
                ->orWhere('content', 'like', "%{$search}%")
                ->orWhere('company_name', 'like', "%{$search}%")
                ->orWhere('location', 'like', "%{$search}%");
        });
    }

    public function scopeByCampus($query, $campusId)
    {
        return $query->where(function ($q) use ($campusId) {
            $q->where('campus_id', $campusId)
                ->orWhere('is_multi_campus', true)
                ->orWhereNull('campus_id');
        });
    }

    // =========== HELPER METHODS ===========

    public function isAnnouncement(): bool
    {
        return $this->content_type === self::TYPE_ANNOUNCEMENT;
    }

    public function isJob(): bool
    {
        return $this->content_type === self::TYPE_JOB;
    }

    public function isEvent(): bool
    {
        return $this->content_type === self::TYPE_EVENT;
    }

    public function isExpired(): bool
    {
        if ($this->expires_at && $this->expires_at->isPast()) {
            return true;
        }
        if ($this->application_deadline && $this->application_deadline->isPast()) {
            return true;
        }
        return false;
    }

    public function isCurrentlyFeatured(): bool
    {
        if (!$this->is_featured) {
            return false;
        }
        if (!$this->featured_until) {
            return true;
        }
        return !$this->featured_until->isPast();
    }

    public function publish(): void
    {
        $this->update([
            'status' => 'published',
            'is_published' => true,
            'published_at' => now(),
        ]);
    }

    public function close(): void
    {
        $this->update(['status' => 'closed']);
    }

    /**
     * Check if the announcement was read by a user.
     */
    public function wasReadBy(int $userId): bool
    {
        return $this->reads()->where('user_id', $userId)->exists();
    }

    /**
     * Mark content as read by user.
     */
    public function markReadBy(int $userId): ContentRead
    {
        return ContentRead::firstOrCreate([
            'content_id' => $this->id,
            'user_id' => $userId,
        ], [
            'read_at' => now(),
        ]);
    }

    /**
     * Record a view for this content.
     */
    public function recordView(?int $userId = null, ?string $ip = null, ?string $userAgent = null): void
    {
        $this->increment('views_count');

        ContentView::create([
            'content_id' => $this->id,
            'user_id' => $userId,
            'ip_address' => $ip,
            'user_agent' => $userAgent,
            'viewed_at' => now(),
        ]);
    }

    /**
     * Get target audience description (for announcements).
     */
    public function getTargetDescription(): string
    {
        if ($this->target_type === 'all' || !$this->target_filters) {
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

    /**
     * Get formatted job type label.
     */
    public function getFormattedJobTypeAttribute(): ?string
    {
        if (!$this->job_type) return null;

        $types = [
            'full_time' => 'Full Time',
            'part_time' => 'Part Time',
            'contract' => 'Contract',
            'internship' => 'Internship',
            'temporary' => 'Temporary',
            'freelance' => 'Freelance',
        ];

        return $types[$this->job_type] ?? $this->job_type;
    }

    /**
     * Get formatted experience level label.
     */
    public function getFormattedExperienceLevelAttribute(): ?string
    {
        if (!$this->experience_level) return null;

        $levels = [
            'entry' => 'Entry Level',
            'mid' => 'Mid Level',
            'senior' => 'Senior Level',
            'executive' => 'Executive',
            'any' => 'Any Experience',
        ];

        return $levels[$this->experience_level] ?? $this->experience_level;
    }

    /**
     * Generate a unique slug for this content.
     */
    public static function generateUniqueSlug(string $title, ?int $excludeId = null): string
    {
        $slug = Str::slug($title);
        $originalSlug = $slug;
        $counter = 1;

        $query = static::where('slug', $slug);
        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        while ($query->exists()) {
            $slug = $originalSlug . '-' . $counter;
            $counter++;

            $query = static::where('slug', $slug);
            if ($excludeId) {
                $query->where('id', '!=', $excludeId);
            }
        }

        return $slug;
    }
}
