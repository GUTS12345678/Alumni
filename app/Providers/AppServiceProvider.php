<?php

namespace App\Providers;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL;
use App\Models\AlumniProfile;
use App\Models\Survey;
use App\Models\SurveyResponse;
use App\Observers\AlumniProfileObserver;
use App\Observers\SurveyObserver;
use App\Observers\SurveyResponseObserver;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Force HTTPS in production
        if (config('app.env') === 'production') {
            URL::forceScheme('https');
        }
        
        // Trust ALL proxies for Cloudflare tunnel (localhost connection)
        \Request::setTrustedProxies(
            ['*'], 
            \Illuminate\Http\Request::HEADER_X_FORWARDED_FOR | 
            \Illuminate\Http\Request::HEADER_X_FORWARDED_HOST | 
            \Illuminate\Http\Request::HEADER_X_FORWARDED_PORT | 
            \Illuminate\Http\Request::HEADER_X_FORWARDED_PROTO
        );

        // Register model observers for auto-classification
        AlumniProfile::observe(AlumniProfileObserver::class);
        Survey::observe(SurveyObserver::class);
        SurveyResponse::observe(SurveyResponseObserver::class);

        // Prevent lazy loading in non-production to catch N+1 issues early.
        // In production, lazy loads are allowed (but logged) to avoid breaking pages.
        Model::preventLazyLoading(! app()->isProduction());
    }
}
