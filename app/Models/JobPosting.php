<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JobPosting extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'posted_by',
        'user_id', // Keep for backwards compatibility
        'title',
        'company_name',
        'company_logo',
        'location',
        'job_type',
        'experience_level',
        'description',
        'requirements',
        'salary_min',
        'salary_max',
        'salary_currency',
        'application_email',
        'application_url',
        'application_deadline',
        'deadline', // Keep for backwards compatibility
        'status',
        'views',
        'skills_required',
        'contact_person',
        'contact_phone',
        'is_featured',
        'remote_work_allowed',
    ];

    protected $casts = [
        'salary_min' => 'decimal:2',
        'salary_max' => 'decimal:2',
        'application_deadline' => 'date',
        'deadline' => 'date',
        'skills_required' => 'array',
        'is_featured' => 'boolean',
        'remote_work_allowed' => 'boolean',
        'views' => 'integer',
    ];

    protected $appends = ['formatted_salary'];

    /**
     * Get the user who posted the job
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'posted_by')->orWhere('user_id');
    }

    /**
     * Get all applications for this job
     */
    public function applications(): HasMany
    {
        return $this->hasMany(JobApplication::class);
    }

    /**
     * Get users who saved this job
     */
    public function savedBy(): HasMany
    {
        return $this->hasMany(SavedJob::class);
    }

    /**
     * Get active job postings
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active')
            ->where(function($q) {
                $q->whereNull('application_deadline')
                  ->orWhere('application_deadline', '>=', now())
                  ->orWhereNull('deadline')
                  ->orWhere('deadline', '>=', now());
            });
    }

    /**
     * Get expired job postings
     */
    public function scopeExpired($query)
    {
        return $query->where(function($q) {
            $q->where('application_deadline', '<', now())
              ->orWhere('deadline', '<', now());
        });
    }

    /**
     * Scope for featured jobs
     */
    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    /**
     * Increment views
     */
    public function incrementViews()
    {
        $this->increment('views');
    }

    /**
     * Check if job is expired
     */
    public function isExpired()
    {
        $deadline = $this->application_deadline ?? $this->deadline;
        if (!$deadline) {
            return false;
        }
        return $deadline < now();
    }

    /**
     * Check if user has applied
     */
    public function hasUserApplied($userId)
    {
        return $this->applications()->where('user_id', $userId)->exists();
    }

    /**
     * Check if user has saved
     */
    public function hasUserSaved($userId)
    {
        return $this->savedBy()->where('user_id', $userId)->exists();
    }

    /**
     * Get formatted salary range
     */
    public function getFormattedSalaryAttribute()
    {
        if (!$this->salary_min && !$this->salary_max) {
            return 'Negotiable';
        }

        $currency = $this->salary_currency ?? 'USD';
        $symbol = $this->getCurrencySymbol($currency);
        
        if ($this->salary_min && $this->salary_max) {
            return $symbol . number_format($this->salary_min) . " - " . $symbol . number_format($this->salary_max);
        }

        if ($this->salary_min) {
            return $symbol . number_format($this->salary_min) . "+";
        }

        return "Up to " . $symbol . number_format($this->salary_max);
    }

    /**
     * Get currency symbol
     */
    private function getCurrencySymbol($currency)
    {
        $symbols = [
            'USD' => '$',
            'EUR' => '€',
            'GBP' => '£',
            'PHP' => '₱',
            'JPY' => '¥',
        ];

        return $symbols[$currency] ?? $currency . ' ';
    }
}
