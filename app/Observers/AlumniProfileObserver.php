<?php

namespace App\Observers;

use App\Models\AlumniProfile;
use App\Services\JobClassifierService;

class AlumniProfileObserver
{
    protected JobClassifierService $classifier;

    /**
     * Guard against infinite recursion: when classifyAndUpdate() calls
     * $alumni->update(), it triggers this observer again. This flag
     * prevents the re-entrant call from re-classifying.
     */
    protected static bool $classifying = false;

    public function __construct(JobClassifierService $classifier)
    {
        $this->classifier = $classifier;
    }

    /**
     * Handle the AlumniProfile "saved" event.
     * Triggered on both create and update.
     */
    public function saved(AlumniProfile $alumniProfile): void
    {
        // Prevent infinite recursion: classifyAndUpdate() calls update()
        // which triggers saved() again
        if (static::$classifying) {
            return;
        }

        // Only auto-classify if employment-related fields changed
        if ($this->shouldReclassify($alumniProfile)) {
            static::$classifying = true;
            try {
                $this->classifier->classifyAndUpdate($alumniProfile);
            } finally {
                static::$classifying = false;
            }
        }
    }

    /**
     * Check if we should reclassify based on what changed
     */
    private function shouldReclassify(AlumniProfile $alumniProfile): bool
    {
        // Fields that affect classification
        $relevantFields = [
            'employment_status',
            'current_job_title',
            'degree_program',
            'company_industry',
            'current_employer',
        ];

        // Check if any relevant field was changed
        foreach ($relevantFields as $field) {
            if ($alumniProfile->wasChanged($field)) {
                return true;
            }
        }

        // Also classify if never classified before and employed
        $employedStatuses = ['employed_full_time', 'employed_part_time', 'self_employed'];
        if (in_array($alumniProfile->employment_status, $employedStatuses) && 
            empty($alumniProfile->job_mismatch_reason)) {
            return true;
        }

        return false;
    }
}
