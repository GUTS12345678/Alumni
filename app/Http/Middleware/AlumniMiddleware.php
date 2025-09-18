<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AlumniMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Check if user is authenticated
        if (!$user) {
            // For API requests, return JSON
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Please log in.'
                ], 401);
            }
            
            // For web requests, redirect to login
            return redirect('/login');
        }

        // Check if user has alumni role
        if ($user->role !== 'alumni') {
            // For API requests, return JSON
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied. Alumni access required.'
                ], 403);
            }
            
            // For web requests, redirect to home or unauthorized page
            return redirect('/')->with('error', 'Alumni access required');
        }

        return $next($request);
    }
}