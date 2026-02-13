<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class JobPosting extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        // Basic Info
        'title',
        'slug',
        'company_name',
        'company_logo',
        'poster_image',
        'background_image',
        'company_website',
        'description',
        'pages',
        'use_pages',
        
        // Category & Type
        'category_id',
        'job_type',
        'job_type',
        'experience_level',
        'work_arrangement',
        
        // Location
        'location',
        'is_remote',
        
        // Contact Information
        'contact_person',
        'contact_email',
        'contact_phone',
        
        // External Application
        'application_url',
        'external_url',
        'application_instructions',
        
        // Additional Info
        'salary_range',
        'salary_min',
        'salary_max',
        'salary_currency',
        'salary_period',
        'is_salary_visible',
        'benefits',
        'requirements',
        'qualifications',
        
        // Dates
        'application_deadline',
        'start_date',
        
        // Status & Tracking
        'status',
        'is_featured',
        'featured_until',
        'views',
        'views_count',
        'show_on_landing',
        
        // Admin tracking
        'created_by',
        'published_at',
    ];

    protected $casts = [
        'is_remote' => 'boolean',
        'is_featured' => 'boolean',
        'is_salary_visible' => 'boolean',
        'show_on_landing' => 'boolean',
        'use_pages' => 'boolean',
        'pages' => 'array',
        'views' => 'integer',
        'views_count' => 'integer',
        'salary_min' => 'decimal:2',
        'salary_max' => 'decimal:2',
        'application_deadline' => 'date',
        'start_date' => 'date',
        'featured_until' => 'date',
        'published_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($job) {
            if (empty($job->slug)) {
                $job->slug = Str::slug($job->title) . '-' . Str::random(6);
            }
        });
    }

    /**
     * Get the category
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(JobCategory::class, 'category_id');
    }

    /**
     * Get the user who created the job
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Alias for creator() - used by controller
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Alias for creator() - some controllers use 'user' relationship
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get job views
     */
    public function jobViews(): HasMany
    {
        return $this->hasMany(JobView::class);
    }

    /**
     * Get job views (alias for controller compatibility)
     */
    public function views(): HasMany
    {
        return $this->hasMany(JobView::class);
    }

    /**
     * Scope for published jobs
     */
    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    /**
     * Scope for active jobs (published and not expired)
     */
    public function scopeActive($query)
    {
        return $query->published()
            ->where(function ($q) {
                $q->whereNull('application_deadline')
                    ->orWhere('application_deadline', '>=', now()->toDateString());
            });
    }

    /**
     * Scope for featured jobs
     */
    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true)
            ->where(function ($q) {
                $q->whereNull('featured_until')
                    ->orWhere('featured_until', '>=', now()->toDateString());
            });
    }

    /**
     * Scope for expired jobs
     */
    public function scopeExpired($query)
    {
        return $query->where('application_deadline', '<', now()->toDateString());
    }

    /**
     * Scope by job type
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('job_type', $type);
    }

    /**
     * Scope by experience level
     */
    public function scopeOfExperience($query, string $level)
    {
        return $query->where('experience_level', $level);
    }

    /**
     * Scope for remote jobs
     */
    public function scopeRemote($query)
    {
        return $query->where('is_remote', true);
    }

    /**
     * Scope for search
     */
    public function scopeSearch($query, string $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('title', 'like', "%{$search}%")
                ->orWhere('company_name', 'like', "%{$search}%")
                ->orWhere('description', 'like', "%{$search}%")
                ->orWhere('location', 'like', "%{$search}%");
        });
    }

    /**
     * Increment views and record view
     */
    public function recordView(?int $userId = null, ?string $ip = null, ?string $userAgent = null): void
    {
        $this->increment('views');
        
        JobView::recordView($this->id, $userId, $ip, $userAgent);
    }

    /**
     * Check if job is expired
     */
    public function isExpired(): bool
    {
        return $this->application_deadline && $this->application_deadline->isPast();
    }

    /**
     * Check if job is currently featured
     */
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

    /**
     * Publish the job
     */
    public function publish(): void
    {
        $this->update([
            'status' => 'published',
            'published_at' => now(),
        ]);
    }

    /**
     * Close the job
     */
    public function close(): void
    {
        $this->update(['status' => 'closed']);
    }

    /**
     * Get formatted job type
     */
    public function getFormattedJobTypeAttribute(): string
    {
        $types = [
            'full_time' => 'Full Time',
            'part_time' => 'Part Time',
            'contract' => 'Contract',
            'internship' => 'Internship',
            'temporary' => 'Temporary',
        ];

        return $types[$this->job_type] ?? $this->job_type;
    }

    /**
     * Get formatted experience level
     */
    public function getFormattedExperienceLevelAttribute(): string
    {
        $levels = [
            'entry' => 'Entry Level',
            'mid' => 'Mid Level',
            'senior' => 'Senior Level',
            'executive' => 'Executive',
            'any' => 'Any Experience',
        ];

        return $levels[$this->experience_level] ?? $this->experience_level;
    }
}
