<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePasswordChanged
{
    /**
     * Handle an incoming request.
     *
     * Redirects users with must_change_password=true to the force change password page.
     * Allows access to force-change-password page, logout, and API password change endpoint.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->must_change_password) {
            // Allow these routes even when password must be changed
            $allowedRoutes = [
                'force-change-password',
                'force-change-password.update',
                'logout',
            ];

            $allowedPaths = [
                'force-change-password',
                'logout',
            ];

            $currentRouteName = $request->route()?->getName();
            $currentPath = $request->path();

            // Allow the force-change-password page and logout
            if (in_array($currentRouteName, $allowedRoutes) || in_array($currentPath, $allowedPaths)) {
                return $next($request);
            }

            // For Inertia requests, redirect to force-change-password
            if ($request->header('X-Inertia')) {
                return redirect()->route('force-change-password');
            }

            // For API requests, return 403
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => 'You must change your password before continuing.',
                    'must_change_password' => true,
                    'redirect' => route('force-change-password'),
                ], 403);
            }

            return redirect()->route('force-change-password');
        }

        return $next($request);
    }
}
