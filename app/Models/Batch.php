<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\BelongsToCampus;

class Batch extends Model
{
    use HasFactory, BelongsToCampus, SoftDeletes;

    protected $fillable = [
        'name',
        'graduation_year',
        'description',
        'status',
        'campus_id',
    ];

    protected $casts = [
        'graduation_year' => 'integer',
    ];

    /**
     * Get all alumni profiles for this batch
     */
    public function alumniProfiles()
    {
        return $this->hasMany(AlumniProfile::class);
    }

    /**
     * Get survey invitations for this batch
     */
    public function surveyInvitations()
    {
        return $this->hasMany(SurveyInvitation::class);
    }

    /**
     * Scope to get active batches
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Get alumni count for this batch
     */
    public function getAlumniCountAttribute(): int
    {
        return $this->alumniProfiles()->count();
    }
}
