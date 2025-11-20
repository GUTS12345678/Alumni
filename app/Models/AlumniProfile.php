<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AlumniProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'batch_id',
        'department_id',
        'course_id',
        'profile_complete',
        'first_name',
        'last_name',
        'middle_name',
        'student_id',
        'birth_date',
        'gender',
        'phone',
        'alternate_email',
        'current_address',
        'city',
        'state_province',
        'postal_code',
        'country',
        'degree_program',
        'major',
        'minor',
        'gpa',
        'graduation_year',
        'graduation_date',
        'employment_status',
        'current_job_title',
        'current_employer',
        'company_industry',
        'company_size',
        'current_salary',
        'salary_currency',
        'job_start_date',
        'job_description',
        'job_related_to_degree',
        'job_mismatch_reason',
        'job_satisfaction',
        'unemployment_reason',
        'skills',
        'certifications',
        'career_goals',
        'feedback_to_institution',
        'willing_to_mentor',
        'willing_to_hire_alumni',
        'profile_completed',
        'profile_completed_at',
        'salary_range',
        'career_field',
        'survey_participation_count',
        'last_profile_update',
    ];

    protected $casts = [
        'department_id' => 'integer',
        'course_id' => 'integer',
        'profile_complete' => 'boolean',
        'birth_date' => 'date',
        'graduation_date' => 'date',
        'job_start_date' => 'date',
        'gpa' => 'decimal:2',
        'current_salary' => 'decimal:2',
        'job_related_to_degree' => 'boolean',
        'job_satisfaction' => 'integer',
        'willing_to_mentor' => 'boolean',
        'willing_to_hire_alumni' => 'boolean',
        'profile_completed' => 'boolean',
        'profile_completed_at' => 'datetime',
        'skills' => 'array',
        'certifications' => 'array',
        'survey_participation_count' => 'integer',
        'last_profile_update' => 'datetime',
    ];

    /**
     * Get the user that owns this profile
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the batch this alumni belongs to
     */
    public function batch()
    {
        return $this->belongsTo(Batch::class);
    }

    /**
     * Get the department this alumni belongs to
     */
    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * Get the course this alumni belongs to
     */
    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    /**
     * Get the employment records for this alumni
     */
    public function employments()
    {
        return $this->hasMany(Employment::class, 'alumni_id');
    }

    /**
     * Get full name
     */
    public function getFullNameAttribute(): string
    {
        return trim($this->first_name . ' ' . ($this->middle_name ? $this->middle_name . ' ' : '') . $this->last_name);
    }

    /**
     * Check if profile is complete
     */
    public function isProfileComplete(): bool
    {
        $requiredFields = [
            'first_name',
            'last_name',
            'degree_program',
            'major',
            'graduation_year',
            'employment_status'
        ];

        foreach ($requiredFields as $field) {
            if (empty($this->$field)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Mark profile as completed
     */
    public function markAsCompleted(): void
    {
        $this->update([
            'profile_completed' => true,
            'profile_completed_at' => now(),
        ]);
    }
}
