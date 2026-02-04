<?php

namespace App\Traits;

use App\Models\Campus;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

/**
 * Trait BelongsToCampus
 * 
 * Add this trait to any model that belongs to a campus.
 * Provides campus relationship and scopes for filtering.
 */
trait BelongsToCampus
{
    /**
     * Boot the trait.
     * Automatically set campus_id when creating a new model.
     */
    protected static function bootBelongsToCampus(): void
    {
        static::creating(function ($model) {
            // If campus_id is not set and user is authenticated, use user's campus
            if (empty($model->campus_id) && auth()->check()) {
                $model->campus_id = auth()->user()->campus_id ?? 1;
            }
            
            // Default to main campus if still not set
            if (empty($model->campus_id)) {
                $model->campus_id = 1;
            }
        });
    }

    /**
     * Get the campus that owns the model.
     */
    public function campus(): BelongsTo
    {
        return $this->belongsTo(Campus::class);
    }

    /**
     * Scope a query to only include models from a specific campus.
     */
    public function scopeForCampus(Builder $query, int|Campus $campus): Builder
    {
        $campusId = $campus instanceof Campus ? $campus->id : $campus;
        return $query->where($this->getTable() . '.campus_id', $campusId);
    }

    /**
     * Scope a query to only include models from the current user's campus.
     */
    public function scopeForCurrentUserCampus(Builder $query): Builder
    {
        if (auth()->check() && auth()->user()->campus_id) {
            return $query->where($this->getTable() . '.campus_id', auth()->user()->campus_id);
        }
        return $query;
    }

    /**
     * Scope to include multi-campus content (for models with is_multi_campus field).
     */
    public function scopeIncludeMultiCampus(Builder $query, int|Campus|null $campus = null): Builder
    {
        // Only apply if model has is_multi_campus column
        if (!$this->hasMultiCampusField()) {
            return $query;
        }

        $campusId = null;
        if ($campus instanceof Campus) {
            $campusId = $campus->id;
        } elseif (is_int($campus)) {
            $campusId = $campus;
        } elseif (auth()->check()) {
            $campusId = auth()->user()->campus_id;
        }

        if ($campusId) {
            return $query->where(function ($q) use ($campusId) {
                $q->where($this->getTable() . '.campus_id', $campusId)
                  ->orWhere($this->getTable() . '.is_multi_campus', true)
                  ->orWhereNull($this->getTable() . '.campus_id');
            });
        }

        return $query;
    }

    /**
     * Scope for campus-specific or multi-campus content.
     * Use this for content that can be either campus-specific or available to all.
     */
    public function scopeVisibleToCampus(Builder $query, int|Campus|null $campus = null): Builder
    {
        $campusId = null;
        if ($campus instanceof Campus) {
            $campusId = $campus->id;
        } elseif (is_int($campus)) {
            $campusId = $campus;
        } elseif (auth()->check()) {
            $campusId = auth()->user()->campus_id;
        }

        if (!$campusId) {
            return $query;
        }

        // If model has is_multi_campus field, include multi-campus content
        if ($this->hasMultiCampusField()) {
            return $query->where(function ($q) use ($campusId) {
                $q->where($this->getTable() . '.campus_id', $campusId)
                  ->orWhere($this->getTable() . '.is_multi_campus', true)
                  ->orWhereNull($this->getTable() . '.campus_id');
            });
        }

        // Otherwise, just filter by campus
        return $query->where($this->getTable() . '.campus_id', $campusId);
    }

    /**
     * Scope to exclude a specific campus.
     */
    public function scopeExcludeCampus(Builder $query, int|Campus $campus): Builder
    {
        $campusId = $campus instanceof Campus ? $campus->id : $campus;
        return $query->where($this->getTable() . '.campus_id', '!=', $campusId);
    }

    /**
     * Check if this model has is_multi_campus field.
     */
    protected function hasMultiCampusField(): bool
    {
        return in_array('is_multi_campus', $this->getFillable()) 
            || $this->getConnection()->getSchemaBuilder()->hasColumn($this->getTable(), 'is_multi_campus');
    }

    /**
     * Check if this model belongs to a specific campus.
     */
    public function belongsToCampusId(int $campusId): bool
    {
        return $this->campus_id === $campusId;
    }

    /**
     * Check if this model belongs to main campus.
     */
    public function isMainCampus(): bool
    {
        return $this->campus?->code === Campus::CODE_MAIN;
    }

    /**
     * Check if this model belongs to Cavite campus.
     */
    public function isCaviteCampus(): bool
    {
        return $this->campus?->code === Campus::CODE_CAVITE;
    }

    /**
     * Get campus code for this model.
     */
    public function getCampusCodeAttribute(): ?string
    {
        return $this->campus?->code;
    }

    /**
     * Get campus display name for this model.
     */
    public function getCampusDisplayNameAttribute(): ?string
    {
        return $this->campus?->display_name;
    }
}
