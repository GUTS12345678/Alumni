<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Rate Limiting Middleware
 * 
 * Implements rate limiting following:
 * - OWASP Top 10 (A04:2021 - Insecure Design, A07:2021 - Identification and Authentication Failures)
 * - DICT Philippines DDoS Protection Guidelines
 * - ISO 27001 Access Control
 */
class RateLimiter
{
    /**
     * Rate limit configurations by route type
     */
    protected array $limits = [
        'login' => ['attempts' => 5, 'decay' => 300],        // 5 attempts per 5 minutes
        'register' => ['attempts' => 3, 'decay' => 3600],    // 3 attempts per hour
        'api' => ['attempts' => 60, 'decay' => 60],          // 60 requests per minute
        'password_reset' => ['attempts' => 3, 'decay' => 3600], // 3 attempts per hour
        'otp' => ['attempts' => 5, 'decay' => 300],          // 5 attempts per 5 minutes
        'messaging' => ['attempts' => 100, 'decay' => 60],   // 100 messages per minute
        'upload' => ['attempts' => 10, 'decay' => 60],       // 10 uploads per minute
        'search' => ['attempts' => 30, 'decay' => 60],       // 30 searches per minute
        'default' => ['attempts' => 100, 'decay' => 60],     // 100 requests per minute
    ];

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, string $type = 'default'): Response
    {
        $key = $this->resolveRequestSignature($request, $type);
        $limit = $this->limits[$type] ?? $this->limits['default'];
        
        try {
            $attempts = Cache::get($key, 0);
        } catch (\Exception $e) {
            // If cache is unavailable, allow the request through rather than blocking the entire app
            Log::warning('RateLimiter: Cache unavailable, skipping rate limit check', [
                'error' => $e->getMessage(),
                'path' => $request->path(),
            ]);
            return $next($request);
        }
        
        if ($attempts >= $limit['attempts']) {
            // Log potential abuse
            Log::warning('Rate limit exceeded', [
                'ip' => $request->ip(),
                'user_id' => $request->user()?->id,
                'path' => $request->path(),
                'type' => $type,
                'attempts' => $attempts,
            ]);

            // Check for potential brute force attack
            $this->checkForBruteForce($request, $type);

            return response()->json([
                'success' => false,
                'message' => 'Too many requests. Please try again later.',
                'retry_after' => $limit['decay'],
            ], 429)->withHeaders([
                'Retry-After' => $limit['decay'],
                'X-RateLimit-Limit' => $limit['attempts'],
                'X-RateLimit-Remaining' => 0,
                'X-RateLimit-Reset' => now()->addSeconds($limit['decay'])->timestamp,
            ]);
        }

        // Increment attempts
        try {
            Cache::put($key, $attempts + 1, now()->addSeconds($limit['decay']));
        } catch (\Exception $e) {
            Log::warning('RateLimiter: Failed to increment attempts', ['error' => $e->getMessage()]);
        }

        $response = $next($request);

        // Add rate limit headers
        return $response->withHeaders([
            'X-RateLimit-Limit' => $limit['attempts'],
            'X-RateLimit-Remaining' => max(0, $limit['attempts'] - $attempts - 1),
            'X-RateLimit-Reset' => now()->addSeconds($limit['decay'])->timestamp,
        ]);
    }

    /**
     * Resolve request signature for rate limiting
     */
    protected function resolveRequestSignature(Request $request, string $type): string
    {
        $identifier = $request->user()?->id ?? $request->ip();
        return "rate_limit:{$type}:{$identifier}";
    }

    /**
     * Check for brute force attack patterns
     */
    protected function checkForBruteForce(Request $request, string $type): void
    {
        try {
            // Track IPs that consistently hit rate limits
            $bruteForceKey = "brute_force:{$request->ip()}";
            $bruteForceCount = Cache::get($bruteForceKey, 0) + 1;
            Cache::put($bruteForceKey, $bruteForceCount, now()->addHours(24));

            // If same IP hits rate limits multiple times, log as potential attack
            if ($bruteForceCount >= 5) {
                Log::alert('Potential brute force attack detected', [
                    'ip' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'path' => $request->path(),
                    'type' => $type,
                    'brute_force_count' => $bruteForceCount,
                ]);
            }
        } catch (\Exception $e) {
            Log::warning('RateLimiter: Failed to check brute force', ['error' => $e->getMessage()]);
        }
    }
}
