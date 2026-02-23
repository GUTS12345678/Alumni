<?php

namespace App\Http\Middleware;

use App\Models\ActivityLog;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class TrackActivity
{
    /**
     * Routes/patterns to exclude from tracking.
     */
    protected array $excludedPaths = [
        'api/*',
        'sanctum/*',
        '_ignition/*',
        '__clockwork/*',
        'livewire/*',
        'broadcasting/*',
    ];

    /**
     * Handle an incoming request — log authenticated page visits.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Only track GET requests for authenticated users (page visits)
        if (
            !$request->isMethod('GET') ||
            !Auth::check() ||
            $request->ajax() ||
            $request->wantsJson() ||
            $this->shouldExclude($request)
        ) {
            return $response;
        }

        $user = Auth::user();
        $url = $request->path();

        // Throttle: don't log the same page for the same user within 60 seconds
        $cacheKey = "activity_track:{$user->id}:" . md5($url);
        if (Cache::has($cacheKey)) {
            return $response;
        }
        Cache::put($cacheKey, true, 60);

        try {
            $routeName = $request->route()?->getName() ?? $url;
            $pageTitle = $this->getPageTitle($url, $routeName);

            ActivityLog::logActivity(
                userId: $user->id,
                action: 'page_visit',
                description: "Visited {$pageTitle}",
                entityType: 'Page',
                entityId: null,
                metadata: [
                    'url' => '/' . $url,
                    'route' => $routeName,
                    'method' => $request->method(),
                    'referrer' => $request->header('referer'),
                ],
                ipAddress: $request->ip(),
                userAgent: $request->userAgent()
            );
        } catch (\Throwable $e) {
            // Silently fail — don't break the request
            \Log::warning('Activity tracking failed: ' . $e->getMessage());
        }

        return $response;
    }

    /**
     * Check if the request path should be excluded from tracking.
     */
    protected function shouldExclude(Request $request): bool
    {
        $path = $request->path();

        foreach ($this->excludedPaths as $pattern) {
            if ($request->is($pattern)) {
                return true;
            }
        }

        // Exclude asset requests
        if (preg_match('/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?|ttf|eot|map)$/i', $path)) {
            return true;
        }

        return false;
    }

    /**
     * Generate a human-readable page title from the URL/route.
     */
    protected function getPageTitle(string $url, string $routeName): string
    {
        $titles = [
            'admin/dashboard' => 'Admin Dashboard',
            'admin/users' => 'User Management',
            'admin/sessions' => 'Session Management',
            'admin/activity' => 'Activity Logs',
            'admin/analytics' => 'Analytics',
            'admin/surveys' => 'Survey Management',
            'admin/content' => 'Content Management',
            'admin/settings' => 'Settings',
            'admin/alumni-bank' => 'Alumni Bank',
            'alumni/dashboard' => 'Alumni Dashboard',
            'alumni/profile' => 'Alumni Profile',
            'alumni/surveys' => 'Alumni Surveys',
            'dashboard' => 'Dashboard',
            'login' => 'Login Page',
            'register' => 'Registration Page',
        ];

        // Check exact match first
        foreach ($titles as $pattern => $title) {
            if ($url === $pattern || str_starts_with($url, $pattern)) {
                return $title;
            }
        }

        // Fallback: humanize the last URL segment
        $segments = explode('/', trim($url, '/'));
        $last = end($segments);
        return ucwords(str_replace(['-', '_'], ' ', $last));
    }
}
