<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CareerHistory extends Model
{
    protected $table = 'career_history';

    protected $fillable = [
        'user_id',
        'job_title',
        'company_name',
        'company_location',
        'employment_type',
        'job_description',
        'start_date',
        'end_date',
        'is_current',
        'industry',
        'skills_used',
        'achievements',
        'salary',
        'salary_currency',
        'order',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'is_current' => 'boolean',
        'skills_used' => 'array',
        'achievements' => 'array',
        'salary' => 'decimal:2',
    ];

    protected $appends = ['duration_formatted'];

    /**
     * Get the user that owns the career history
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Calculate duration in months
     */
    public function getDurationInMonths()
    {
        $start = \Carbon\Carbon::parse($this->start_date);
        $end = $this->end_date ? \Carbon\Carbon::parse($this->end_date) : \Carbon\Carbon::now();
        
        return $start->diffInMonths($end);
    }

    /**
     * Get formatted duration
     */
    public function getDurationFormattedAttribute()
    {
        $months = $this->getDurationInMonths();
        
        if ($months < 12) {
            return $months == 1 ? '1 month' : "$months months";
        }
        
        $years = floor($months / 12);
        $remainingMonths = round($months % 12);
        
        $duration = $years == 1 ? '1 year' : "$years years";
        if ($remainingMonths > 0) {
            $duration .= $remainingMonths == 1 ? ', 1 month' : ", $remainingMonths months";
        }
        
        return $duration;
    }

    /**
     * Scope to get career history ordered by date
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('is_current', 'desc')
                    ->orderBy('start_date', 'desc')
                    ->orderBy('order', 'asc');
    }

    /**
     * Scope to get current positions
     */
    public function scopeCurrent($query)
    {
        return $query->where('is_current', true);
    }

    /**
     * Scope to get past positions
     */
    public function scopePast($query)
    {
        return $query->where('is_current', false);
    }
}
