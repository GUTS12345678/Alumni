<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Traits\BelongsToCampus;

class Course extends Model
{
    use SoftDeletes, BelongsToCampus;

    protected $fillable = [
        'department_id',
        'name',
        'code',
        'description',
        'majors',
        'duration_years',
        'status',
        'campus_id',
    ];

    protected $casts = [
        'department_id' => 'integer',
        'duration_years' => 'integer',
        'status' => 'string',
    ];

    /**
     * Get the department that owns the course.
     */
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * Get the alumni profiles for the course.
     */
    public function alumniProfiles(): HasMany
    {
        return $this->hasMany(AlumniProfile::class);
    }

    /**
     * Scope to get only active courses.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Get the count of alumni in this course.
     */
    public function getAlumniCountAttribute(): int
    {
        return $this->alumniProfiles()->count();
    }
}
