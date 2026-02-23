<?php

namespace App\Observers;

use App\Models\Survey;
use Illuminate\Support\Facades\Cache;

class SurveyObserver
{
    /**
     * Handle the Survey "created" event.
     */
    public function created(Survey $survey): void
    {
        $this->clearDashboardCache($survey->campus_id);
    }

    /**
     * Handle the Survey "updated" event.
     */
    public function updated(Survey $survey): void
    {
        // Clear cache for both old and new campus if campus_id changed
        if ($survey->isDirty('campus_id')) {
            $this->clearDashboardCache($survey->getOriginal('campus_id'));
        }
        
        $this->clearDashboardCache($survey->campus_id);
    }

    /**
     * Handle the Survey "deleted" event.
     */
    public function deleted(Survey $survey): void
    {
        $this->clearDashboardCache($survey->campus_id);
    }

    /**
     * Clear dashboard cache for specific campus and all campuses
     */
    private function clearDashboardCache(?int $campusId): void
    {
        // Clear specific campus cache
        if ($campusId) {
            Cache::forget('dashboard_metrics_' . $campusId);
            Cache::forget('analytics_overview_' . $campusId);
        }
        
        // Always clear "all campuses" cache
        Cache::forget('dashboard_metrics_all');
        Cache::forget('analytics_overview_all');
    }
}
