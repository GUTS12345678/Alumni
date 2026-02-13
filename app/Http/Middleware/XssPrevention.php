<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * XSS Prevention Middleware
 * 
 * Implements XSS protection following:
 * - OWASP Top 10 (A03:2021 - Injection)
 * - DICT Philippines Data Protection Guidelines  
 * - ISO 27001 Input Validation Controls
 */
class XssPrevention
{
    /**
     * Dangerous XSS patterns to detect
     */
    protected array $dangerousPatterns = [
        '/<script\b[^>]*>(.*?)<\/script>/is',
        '/javascript\s*:/i',
        '/vbscript\s*:/i',
        '/on\w+\s*=/i', // onclick, onload, onerror, etc.
        '/<iframe\b/i',
        '/<object\b/i',
        '/<embed\b/i',
        '/<link\b[^>]*\bhref\s*=/i',
        '/<meta\b[^>]*\bhttp-equiv\s*=/i',
        '/<base\b/i',
        '/<form\b[^>]*\baction\s*=/i',
        '/expression\s*\(/i', // CSS expression
        '/url\s*\(\s*["\']?\s*data:/i', // Data URLs in CSS
        '/<!--.*-->/s', // HTML comments that might hide malicious code
        '/<svg\b[^>]*\bonload\s*=/i',
        '/data\s*:\s*text\/html/i',
    ];

    /**
     * Fields that should be sanitized but allow some HTML
     */
    protected array $htmlAllowedFields = [
        'content',
        'description', 
        'bio',
        'message',
        'announcement_content',
    ];

    /**
     * Fields to skip (may contain legitimate code)
     */
    protected array $skipFields = [
        'password',
        'password_confirmation',
        'custom_css',
        'custom_js',
    ];

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $sanitizedInput = $this->sanitizeInput($request->all());
        
        // Check for malicious patterns before sanitization
        $maliciousPatterns = $this->detectMaliciousPatterns($request->all());
        
        if (!empty($maliciousPatterns)) {
            Log::warning('Potential XSS attempt detected', [
                'ip' => $request->ip(),
                'user_id' => $request->user()?->id,
                'path' => $request->path(),
                'method' => $request->method(),
                'patterns' => $maliciousPatterns,
                'user_agent' => $request->userAgent(),
            ]);

            $this->trackSuspiciousActivity($request);
        }

        // Replace request input with sanitized version
        $request->merge($sanitizedInput);

        return $next($request);
    }

    /**
     * Detect malicious XSS patterns
     */
    protected function detectMaliciousPatterns(array $inputs, string $prefix = ''): array
    {
        $detected = [];

        foreach ($inputs as $key => $value) {
            $fullKey = $prefix ? "{$prefix}.{$key}" : $key;

            if (in_array($key, $this->skipFields)) {
                continue;
            }

            if (is_array($value)) {
                $detected = array_merge($detected, $this->detectMaliciousPatterns($value, $fullKey));
            } elseif (is_string($value)) {
                foreach ($this->dangerousPatterns as $pattern) {
                    if (preg_match($pattern, $value)) {
                        $detected[] = [
                            'field' => $fullKey,
                            'pattern' => $pattern,
                        ];
                        break;
                    }
                }
            }
        }

        return $detected;
    }

    /**
     * Sanitize all input recursively
     */
    protected function sanitizeInput(array $inputs): array
    {
        $sanitized = [];

        foreach ($inputs as $key => $value) {
            if (in_array($key, $this->skipFields)) {
                $sanitized[$key] = $value;
                continue;
            }

            if (is_array($value)) {
                $sanitized[$key] = $this->sanitizeInput($value);
            } elseif (is_string($value)) {
                if (in_array($key, $this->htmlAllowedFields)) {
                    $sanitized[$key] = $this->sanitizeHtml($value);
                } else {
                    $sanitized[$key] = $this->sanitizeString($value);
                }
            } else {
                $sanitized[$key] = $value;
            }
        }

        return $sanitized;
    }

    /**
     * Sanitize a plain string (escape all HTML)
     */
    protected function sanitizeString(string $value): string
    {
        return htmlspecialchars($value, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }

    /**
     * Sanitize HTML while allowing safe tags
     */
    protected function sanitizeHtml(string $value): string
    {
        // Remove dangerous patterns
        foreach ($this->dangerousPatterns as $pattern) {
            $value = preg_replace($pattern, '', $value);
        }

        // Allow only safe HTML tags
        $allowedTags = '<p><br><strong><em><u><s><ul><ol><li><a><span><div><h1><h2><h3><h4><h5><h6><blockquote><code><pre>';
        
        return strip_tags($value, $allowedTags);
    }

    /**
     * Track suspicious activity
     */
    protected function trackSuspiciousActivity(Request $request): void
    {
        $key = "xss_attempts:{$request->ip()}";
        $attempts = cache()->increment($key);
        
        if ($attempts === 1) {
            cache()->put($key, 1, now()->addHours(24));
        }

        if ($attempts >= 3) {
            Log::alert('Repeated XSS attempts detected', [
                'ip' => $request->ip(),
                'attempts' => $attempts,
            ]);
        }
    }
}
