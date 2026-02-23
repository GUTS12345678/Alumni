<?php

namespace App\Observers;

use App\Models\SurveyResponse;
use Illuminate\Support\Facades\Cache;

class SurveyResponseObserver
{
    /**
     * Handle the SurveyResponse "created" event.
     */
    public function created(SurveyResponse $response): void
    {
        $this->clearDashboardCache($response->campus_id);
    }

    /**
     * Handle the SurveyResponse "updated" event.
     */
    public function updated(SurveyResponse $response): void
    {
        // Only clear cache if status changed to completed
        if ($response->isDirty('status') && $response->status === 'completed') {
            $this->clearDashboardCache($response->campus_id);
        }
    }

    /**
     * Handle the SurveyResponse "deleted" event.
     */
    public function deleted(SurveyResponse $response): void
    {
        $this->clearDashboardCache($response->campus_id);
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
