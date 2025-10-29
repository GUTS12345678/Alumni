<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Mentorship extends Model
{
    use HasFactory;

    protected $fillable = [
        'mentor_id',
        'mentee_id',
        'status',
        'mentee_message',
        'mentor_response',
        'goals',
        'start_date',
        'end_date',
        'sessions_completed',
        'notes',
    ];

    protected $casts = [
        'goals' => 'array',
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    /**
     * Get the mentor
     */
    public function mentor()
    {
        return $this->belongsTo(User::class, 'mentor_id');
    }

    /**
     * Get the mentee
     */
    public function mentee()
    {
        return $this->belongsTo(User::class, 'mentee_id');
    }

    /**
     * Get mentorship sessions
     */
    public function sessions()
    {
        return $this->hasMany(MentorshipSession::class);
    }

    /**
     * Get pending mentorship requests
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Get active mentorships
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Get completed mentorships
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }
}
