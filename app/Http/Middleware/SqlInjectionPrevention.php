<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * SQL Injection Prevention Middleware
 * 
 * Implements additional SQL injection protection following:
 * - OWASP Top 10 (A03:2021 - Injection)
 * - DICT Philippines Data Protection Guidelines
 * - ISO 27001 Input Validation Controls
 * 
 * Note: Laravel's Eloquent ORM already provides parameterized queries,
 * but this middleware adds an additional layer of protection.
 */
class SqlInjectionPrevention
{
    /**
     * Dangerous SQL patterns to detect
     */
    protected array $dangerousPatterns = [
        '/(\bunion\b.*\bselect\b)/i',
        '/(\bselect\b.*\bfrom\b.*\bwhere\b)/i',
        '/(\binsert\b.*\binto\b)/i',
        '/(\bupdate\b.*\bset\b)/i',
        '/(\bdelete\b.*\bfrom\b)/i',
        '/(\bdrop\b.*\b(table|database|index)\b)/i',
        '/(\balter\b.*\btable\b)/i',
        '/(\btruncate\b.*\btable\b)/i',
        '/(\bexec\b.*\bxp_)/i',
        '/(\bexecute\b.*\bimmediate\b)/i',
        '/(\'|\"|;|--|\bor\b|\band\b).*?(=|>|<)/i',
        '/(\bwaitfor\b.*\bdelay\b)/i',
        '/(\bbenchmark\b.*\()/i',
        '/(\bsleep\b\s*\()/i',
        '/(0x[0-9a-fA-F]+)/i', // Hex encoded strings
        '/(\bload_file\b|\binto\s+outfile\b)/i',
    ];

    /**
     * Fields to skip checking (may contain legitimate code/text)
     */
    protected array $skipFields = [
        'password',
        'password_confirmation',
        'content', // Message content
        'description', // Job/announcement descriptions
        'custom_css',
        'custom_js',
        'survey_data',
    ];

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Check all input parameters
        $suspiciousInputs = $this->detectSqlInjection($request->all());

        if (!empty($suspiciousInputs)) {
            // Log the attempt
            Log::warning('Potential SQL injection attempt detected', [
                'ip' => $request->ip(),
                'user_id' => $request->user()?->id,
                'path' => $request->path(),
                'method' => $request->method(),
                'suspicious_inputs' => $suspiciousInputs,
                'user_agent' => $request->userAgent(),
            ]);

            // Track repeat offenders
            $this->trackSuspiciousActivity($request);

            return response()->json([
                'success' => false,
                'message' => 'Invalid input detected. Your request has been logged.',
            ], 400);
        }

        return $next($request);
    }

    /**
     * Detect SQL injection patterns in input
     */
    protected function detectSqlInjection(array $inputs, string $prefix = ''): array
    {
        $suspicious = [];

        foreach ($inputs as $key => $value) {
            $fullKey = $prefix ? "{$prefix}.{$key}" : $key;

            // Skip certain fields
            if (in_array($key, $this->skipFields)) {
                continue;
            }

            if (is_array($value)) {
                $suspicious = array_merge($suspicious, $this->detectSqlInjection($value, $fullKey));
            } elseif (is_string($value)) {
                foreach ($this->dangerousPatterns as $pattern) {
                    if (preg_match($pattern, $value)) {
                        $suspicious[] = [
                            'field' => $fullKey,
                            'pattern' => $pattern,
                            'value_preview' => substr($value, 0, 100),
                        ];
                        break;
                    }
                }
            }
        }

        return $suspicious;
    }

    /**
     * Track suspicious activity for potential blocking
     */
    protected function trackSuspiciousActivity(Request $request): void
    {
        $key = "sql_injection_attempts:{$request->ip()}";
        $attempts = cache()->increment($key);
        
        if ($attempts === 1) {
            cache()->put($key, 1, now()->addHours(24));
        }

        // Alert on repeated attempts
        if ($attempts >= 3) {
            Log::alert('Repeated SQL injection attempts detected', [
                'ip' => $request->ip(),
                'attempts' => $attempts,
                'user_id' => $request->user()?->id,
            ]);
        }
    }
}
