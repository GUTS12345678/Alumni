<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'status',
        'last_login_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Check if user is admin
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * Check if user is alumni
     */
    public function isAlumni(): bool
    {
        return $this->role === 'alumni';
    }

    /**
     * Get the alumni profile for this user
     */
    public function alumniProfile()
    {
        return $this->hasOne(AlumniProfile::class);
    }

    /**
     * Get survey responses for this user
     */
    public function surveyResponses()
    {
        return $this->hasMany(SurveyResponse::class);
    }

    /**
     * Get activity logs for this user
     */
    public function activityLogs()
    {
        return $this->hasMany(ActivityLog::class);
    }

    /**
     * Get the settings for this user
     */
    public function settings()
    {
        return $this->hasOne(UserSettings::class);
    }

    /**
     * Get career history for this user
     */
    public function careerHistory()
    {
        return $this->hasMany(CareerHistory::class);
    }

    /**
     * Get job postings created by this user
     */
    public function jobPostings()
    {
        return $this->hasMany(JobPosting::class);
    }

    /**
     * Get connections where user is sender
     */
    public function sentConnections()
    {
        return $this->hasMany(AlumniConnection::class, 'sender_id');
    }

    /**
     * Get connections where user is receiver
     */
    public function receivedConnections()
    {
        return $this->hasMany(AlumniConnection::class, 'receiver_id');
    }

    /**
     * Get mentor profile
     */
    public function mentorProfile()
    {
        return $this->hasOne(MentorProfile::class);
    }

    /**
     * Get mentorships where user is mentor
     */
    public function asMentor()
    {
        return $this->hasMany(Mentorship::class, 'mentor_id');
    }

    /**
     * Get mentorships where user is mentee
     */
    public function asMentee()
    {
        return $this->hasMany(Mentorship::class, 'mentee_id');
    }
}
