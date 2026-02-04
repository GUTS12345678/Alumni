<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Traits\BelongsToCampus;

class Department extends Model
{
    use SoftDeletes, BelongsToCampus;

    protected $fillable = [
        'name',
        'code',
        'description',
        'status',
        'campus_id',
    ];

    protected $casts = [
        'status' => 'string',
    ];

    /**
     * Get the courses for the department.
     */
    public function courses(): HasMany
    {
        return $this->hasMany(Course::class);
    }

    /**
     * Get the alumni profiles for the department.
     */
    public function alumniProfiles(): HasMany
    {
        return $this->hasMany(AlumniProfile::class);
    }

    /**
     * Scope to get only active departments.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Get the count of active courses.
     */
    public function getActiveCoursesCountAttribute(): int
    {
        return $this->courses()->where('status', 'active')->count();
    }

    /**
     * Get the count of alumni in this department.
     */
    public function getAlumniCountAttribute(): int
    {
        return $this->alumniProfiles()->count();
    }

    /**
     * Calculate employment rate for the department.
     * Returns percentage of employed graduates.
     */
    public function calculateEmploymentRate(): float
    {
        $totalAlumni = $this->alumniProfiles()->count();
        
        if ($totalAlumni === 0) {
            return 0.0;
        }

        $employedCount = $this->alumniProfiles()
            ->whereIn('employment_status', [
                'employed_full_time',
                'employed_part_time',
                'self_employed'
            ])
            ->count();

        return round(($employedCount / $totalAlumni) * 100, 2);
    }

    /**
     * Get average time to employment in days.
     * Calculates from graduation date to first job start date.
     */
    public function getAverageTimeToEmployment(): ?float
    {
        $alumni = $this->alumniProfiles()
            ->whereNotNull('graduation_date')
            ->whereNotNull('job_start_date')
            ->whereIn('employment_status', [
                'employed_full_time',
                'employed_part_time',
                'self_employed'
            ])
            ->get();

        if ($alumni->isEmpty()) {
            return null;
        }

        $totalDays = 0;
        $count = 0;

        foreach ($alumni as $profile) {
            if ($profile->graduation_date && $profile->job_start_date) {
                $days = $profile->graduation_date->diffInDays($profile->job_start_date);
                $totalDays += $days;
                $count++;
            }
        }

        return $count > 0 ? round($totalDays / $count, 1) : null;
    }

    /**
     * Get top employers hiring from this department.
     * Returns array of employers with count.
     */
    public function getTopEmployers(int $limit = 5): array
    {
        return $this->alumniProfiles()
            ->whereNotNull('current_employer')
            ->where('current_employer', '!=', '')
            ->selectRaw('current_employer, COUNT(*) as count')
            ->groupBy('current_employer')
            ->orderByDesc('count')
            ->limit($limit)
            ->get()
            ->map(function ($item) {
                return [
                    'name' => $item->current_employer,
                    'count' => $item->count
                ];
            })
            ->toArray();
    }

    /**
     * Get salary range distribution.
     * Returns count of alumni in each salary range.
     */
    public function getSalaryDistribution(): array
    {
        $ranges = [
            'below_15k' => 'Below ₱15,000',
            '15k_25k' => '₱15,000 - ₱25,000',
            '25k_35k' => '₱25,000 - ₱35,000',
            '35k_50k' => '₱35,000 - ₱50,000',
            '50k_75k' => '₱50,000 - ₱75,000',
            '75k_100k' => '₱75,000 - ₱100,000',
            'above_100k' => 'Above ₱100,000',
            'prefer_not_say' => 'Prefer not to say'
        ];

        $distribution = $this->alumniProfiles()
            ->whereNotNull('salary_range')
            ->selectRaw('salary_range, COUNT(*) as count')
            ->groupBy('salary_range')
            ->get()
            ->pluck('count', 'salary_range')
            ->toArray();

        $result = [];
        foreach ($ranges as $key => $label) {
            $result[] = [
                'range' => $label,
                'count' => $distribution[$key] ?? 0
            ];
        }

        return $result;
    }

    /**
     * Get career field distribution.
     * Returns count of alumni in each career field.
     */
    public function getCareerFieldDistribution(): array
    {
        $fields = [
            'information_technology' => 'Information Technology',
            'education' => 'Education',
            'business_management' => 'Business & Management',
            'healthcare' => 'Healthcare',
            'engineering' => 'Engineering',
            'government' => 'Government',
            'finance' => 'Finance',
            'marketing' => 'Marketing',
            'hospitality' => 'Hospitality & Tourism',
            'manufacturing' => 'Manufacturing',
            'agriculture' => 'Agriculture',
            'other' => 'Other'
        ];

        $distribution = $this->alumniProfiles()
            ->whereNotNull('career_field')
            ->selectRaw('career_field, COUNT(*) as count')
            ->groupBy('career_field')
            ->get()
            ->pluck('count', 'career_field')
            ->toArray();

        $result = [];
        foreach ($fields as $key => $label) {
            if (isset($distribution[$key]) && $distribution[$key] > 0) {
                $result[] = [
                    'field' => $label,
                    'count' => $distribution[$key]
                ];
            }
        }

        return $result;
    }

    /**
     * Get employment status breakdown.
     */
    public function getEmploymentStatusBreakdown(): array
    {
        $statuses = [
            'employed_full_time' => 'Employed Full-time',
            'employed_part_time' => 'Employed Part-time',
            'self_employed' => 'Self-employed',
            'unemployed_seeking' => 'Unemployed (Seeking)',
            'unemployed_not_seeking' => 'Unemployed (Not Seeking)',
            'continuing_education' => 'Continuing Education',
            'military_service' => 'Military Service',
            'other' => 'Other'
        ];

        $breakdown = $this->alumniProfiles()
            ->whereNotNull('employment_status')
            ->selectRaw('employment_status, COUNT(*) as count')
            ->groupBy('employment_status')
            ->get()
            ->pluck('count', 'employment_status')
            ->toArray();

        $result = [];
        foreach ($statuses as $key => $label) {
            if (isset($breakdown[$key]) && $breakdown[$key] > 0) {
                $result[] = [
                    'status' => $label,
                    'count' => $breakdown[$key]
                ];
            }
        }

        return $result;
    }

    /**
     * Get engagement metrics for alumni.
     */
    public function getEngagementMetrics(): array
    {
        $totalAlumni = $this->alumniProfiles()->count();
        
        if ($totalAlumni === 0) {
            return [
                'total_alumni' => 0,
                'profile_completion_rate' => 0,
                'willing_to_mentor' => 0,
                'willing_to_mentor_rate' => 0,
                'avg_survey_participation' => 0
            ];
        }

        $completedProfiles = $this->alumniProfiles()
            ->where('profile_completed', true)
            ->count();

        $willingToMentor = $this->alumniProfiles()
            ->where('willing_to_mentor', true)
            ->count();

        $avgSurveyParticipation = $this->alumniProfiles()
            ->avg('survey_participation_count') ?? 0;

        return [
            'total_alumni' => $totalAlumni,
            'profile_completion_rate' => round(($completedProfiles / $totalAlumni) * 100, 2),
            'willing_to_mentor' => $willingToMentor,
            'willing_to_mentor_rate' => round(($willingToMentor / $totalAlumni) * 100, 2),
            'avg_survey_participation' => round($avgSurveyParticipation, 2)
        ];
    }

    /**
     * Get comprehensive analytics for the department.
     */
    public function getComprehensiveAnalytics(): array
    {
        return [
            'department' => [
                'id' => $this->id,
                'name' => $this->name,
                'code' => $this->code,
                'total_alumni' => $this->alumniProfiles()->count(),
                'total_courses' => $this->courses()->count(),
            ],
            'employment' => [
                'employment_rate' => $this->calculateEmploymentRate(),
                'avg_time_to_employment_days' => $this->getAverageTimeToEmployment(),
                'status_breakdown' => $this->getEmploymentStatusBreakdown(),
                'top_employers' => $this->getTopEmployers(5),
            ],
            'compensation' => [
                'salary_distribution' => $this->getSalaryDistribution(),
            ],
            'career_fields' => [
                'distribution' => $this->getCareerFieldDistribution(),
            ],
            'engagement' => $this->getEngagementMetrics(),
        ];
    }
}
