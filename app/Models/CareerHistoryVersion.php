<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CareerHistoryVersion extends Model
{
    protected $table = 'career_history_versions';

    protected $fillable = [
        'career_history_id',
        'user_id',
        'modified_by',
        'version_number',
        'action_type',
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
        'changes',
        'change_notes',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'is_current' => 'boolean',
        'skills_used' => 'array',
        'achievements' => 'array',
        'changes' => 'array',
        'salary' => 'decimal:2',
    ];

    /**
     * Get the career history record this version belongs to
     */
    public function careerHistory(): BelongsTo
    {
        return $this->belongsTo(CareerHistory::class)->withTrashed();
    }

    /**
     * Get the user who owns the career history
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the user who made this modification
     */
    public function modifiedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'modified_by');
    }

    /**
     * Create a version snapshot from a CareerHistory record
     */
    public static function createSnapshot(
        CareerHistory $careerHistory, 
        string $actionType, 
        ?int $modifiedBy = null,
        ?array $changes = null,
        ?string $changeNotes = null
    ): self {
        // Get the next version number
        $nextVersion = self::where('career_history_id', $careerHistory->id)->max('version_number') + 1;

        return self::create([
            'career_history_id' => $careerHistory->id,
            'user_id' => $careerHistory->user_id,
            'modified_by' => $modifiedBy,
            'version_number' => $nextVersion,
            'action_type' => $actionType,
            'job_title' => $careerHistory->job_title,
            'company_name' => $careerHistory->company_name,
            'company_location' => $careerHistory->company_location,
            'employment_type' => $careerHistory->employment_type,
            'job_description' => $careerHistory->job_description,
            'start_date' => $careerHistory->start_date,
            'end_date' => $careerHistory->end_date,
            'is_current' => $careerHistory->is_current,
            'industry' => $careerHistory->industry,
            'skills_used' => $careerHistory->skills_used,
            'achievements' => $careerHistory->achievements,
            'salary' => $careerHistory->salary,
            'salary_currency' => $careerHistory->salary_currency,
            'changes' => $changes,
            'change_notes' => $changeNotes,
        ]);
    }

    /**
     * Get human-readable action type
     */
    public function getActionLabelAttribute(): string
    {
        return match($this->action_type) {
            'created' => 'Created',
            'updated' => 'Modified',
            'archived' => 'Archived',
            'restored' => 'Restored',
            default => ucfirst($this->action_type),
        };
    }

    /**
     * Scope to get versions ordered by version number descending
     */
    public function scopeLatestFirst($query)
    {
        return $query->orderBy('version_number', 'desc');
    }

    /**
     * Scope to get versions by action type
     */
    public function scopeByAction($query, string $actionType)
    {
        return $query->where('action_type', $actionType);
    }
}
