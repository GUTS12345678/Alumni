<?php

namespace App\Observers;

use App\Models\AlumniProfile;
use App\Services\JobClassifierService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

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
        
        // Clear dashboard cache whenever alumni data changes
        $this->clearDashboardCache($alumniProfile->campus_id);
    }

    /**
     * Handle the AlumniProfile "deleted" event.
     */
    public function deleted(AlumniProfile $alumniProfile): void
    {
        $this->clearDashboardCache($alumniProfile->campus_id);
    }

    /**
     * Clear dashboard cache for specific campus and all campuses
     */
    private function clearDashboardCache(?int $campusId): void
    {
        // Clear specific campus cache
        if ($campusId) {
            Cache::forget('dashboard_metrics_' . $campusId);
            Cache::forget('alumni_stats_' . $campusId);
        }
        
        // Always clear "all campuses" cache
        Cache::forget('dashboard_metrics_all');
        Cache::forget('alumni_stats_all');
        
        // Clear analytics cache if it exists
        if ($campusId) {
            Cache::forget('analytics_overview_' . $campusId);
            Cache::forget('analytics_employment_' . $campusId);
            Cache::forget('analytics_batch_' . $campusId);
            Cache::forget('analytics_time_to_job_' . $campusId . '_all');
            Cache::forget('analytics_comprehensive_' . $campusId);
        }
        Cache::forget('analytics_overview_all');
        Cache::forget('analytics_employment_all');
        Cache::forget('analytics_batch_all');
        Cache::forget('analytics_time_to_job_all_all');
        Cache::forget('analytics_comprehensive_all');
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
