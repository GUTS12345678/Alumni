<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MentorProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'expertise_area',
        'bio',
        'specializations',
        'years_of_experience',
        'max_mentees',
        'is_available',
        'availability',
        'status',
    ];

    protected $casts = [
        'specializations' => 'array',
        'availability' => 'array',
        'is_available' => 'boolean',
    ];

    /**
     * Get the user associated with this mentor profile
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get mentorships where this user is the mentor
     */
    public function mentorships()
    {
        return $this->hasMany(Mentorship::class, 'mentor_id', 'user_id');
    }

    /**
     * Get active mentors
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active')->where('is_available', true);
    }

    /**
     * Get current mentee count
     */
    public function getCurrentMenteesCountAttribute()
    {
        return $this->mentorships()->where('status', 'active')->count();
    }

    /**
     * Check if mentor can accept more mentees
     */
    public function canAcceptMentees()
    {
        return $this->is_available && 
               $this->status === 'active' && 
               $this->current_mentees_count < $this->max_mentees;
    }
}
