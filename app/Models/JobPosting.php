<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JobPosting extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
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
        'deadline',
        'status',
        'views',
        'skills_required',
    ];

    protected $casts = [
        'salary_min' => 'decimal:2',
        'salary_max' => 'decimal:2',
        'deadline' => 'date',
        'skills_required' => 'array',
    ];

    /**
     * Get the user who posted the job
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get active job postings
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active')
            ->where(function($q) {
                $q->whereNull('deadline')
                  ->orWhere('deadline', '>=', now());
            });
    }

    /**
     * Get expired job postings
     */
    public function scopeExpired($query)
    {
        return $query->where('deadline', '<', now());
    }

    /**
     * Increment views
     */
    public function incrementViews()
    {
        $this->increment('views');
    }

    /**
     * Get formatted salary range
     */
    public function getFormattedSalaryAttribute()
    {
        if (!$this->salary_min && !$this->salary_max) {
            return 'Negotiable';
        }

        $currency = $this->salary_currency;
        
        if ($this->salary_min && $this->salary_max) {
            return "$currency " . number_format($this->salary_min) . " - " . number_format($this->salary_max);
        }

        if ($this->salary_min) {
            return "$currency " . number_format($this->salary_min) . "+";
        }

        return "$currency " . number_format($this->salary_max);
    }
}
