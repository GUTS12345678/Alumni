<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CareerHistory extends Model
{
    use SoftDeletes;

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
        'archived_reason',
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

    /**
     * Get all versions of this career history
     */
    public function versions(): HasMany
    {
        return $this->hasMany(CareerHistoryVersion::class)->orderBy('version_number', 'desc');
    }

    /**
     * Get the latest version
     */
    public function latestVersion()
    {
        return $this->hasOne(CareerHistoryVersion::class)->latestOfMany('version_number');
    }

    /**
     * Archive this career record (soft delete with reason)
     */
    public function archive(int $modifiedBy, ?string $reason = null): bool
    {
        // Create version snapshot before archiving
        CareerHistoryVersion::createSnapshot($this, 'archived', $modifiedBy, null, $reason);

        $this->archived_reason = $reason ?? 'Archived by user';
        $this->save();
        
        return $this->delete();
    }

    /**
     * Restore archived career record
     */
    public function restoreRecord(int $modifiedBy): bool
    {
        $this->restore();
        $this->archived_reason = null;
        $this->save();

        // Create version snapshot for restore
        CareerHistoryVersion::createSnapshot($this, 'restored', $modifiedBy);

        return true;
    }

    /**
     * Get fields that should be tracked for changes
     */
    public static function getTrackableFields(): array
    {
        return [
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
        ];
    }

    /**
     * Get changes between current state and an array of values
     * Note: Named getFieldChanges to avoid conflict with Laravel's Model::getChanges()
     */
    public function getFieldChanges(array $newValues): array
    {
        $changes = [];
        
        foreach (self::getTrackableFields() as $field) {
            $oldValue = $this->{$field};
            $newValue = $newValues[$field] ?? null;

            // Handle dates
            if (in_array($field, ['start_date', 'end_date']) && $oldValue) {
                $oldValue = $oldValue->format('Y-m-d');
            }

            // Handle arrays (JSON fields)
            if (is_array($oldValue)) {
                $oldValue = json_encode($oldValue);
                $newValue = is_array($newValue) ? json_encode($newValue) : $newValue;
            }

            if ($oldValue != $newValue) {
                $changes[$field] = [
                    'old' => $this->{$field},
                    'new' => $newValues[$field] ?? null,
                ];
            }
        }

        return $changes;
    }
}
