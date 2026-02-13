<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Security Headers Middleware
 * 
 * Implements security headers following:
 * - OWASP Top 10 (A05:2021 - Security Misconfiguration)
 * - DICT Philippines Cybersecurity Guidelines
 * - ISO 27001 Security Controls
 */
class SecurityHeaders
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Content Security Policy - Prevents XSS attacks (OWASP A03:2021)
        $cspDirectives = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.bunny.net",
            "font-src 'self' https://fonts.gstatic.com https://fonts.bunny.net data:",
            "img-src 'self' data: https: blob:",
            "connect-src 'self' wss: https:",
            "frame-ancestors 'self'",
            "base-uri 'self'",
            "form-action 'self'",
            "object-src 'none'",
        ];
        $response->headers->set('Content-Security-Policy', implode('; ', $cspDirectives));

        // X-Content-Type-Options - Prevents MIME type sniffing
        $response->headers->set('X-Content-Type-Options', 'nosniff');

        // X-Frame-Options - Prevents clickjacking attacks (OWASP A05:2021)
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');

        // X-XSS-Protection - Legacy XSS protection (still useful for older browsers)
        $response->headers->set('X-XSS-Protection', '1; mode=block');

        // Strict-Transport-Security - Forces HTTPS (OWASP A02:2021)
        if ($request->secure()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        }

        // Referrer-Policy - Controls referrer information
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        // Permissions-Policy - Controls browser features
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self), payment=()');

        // Cache-Control for sensitive pages
        if ($this->isSensitivePage($request)) {
            $response->headers->set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
            $response->headers->set('Pragma', 'no-cache');
            $response->headers->set('Expires', '0');
        }

        // Remove server information disclosure
        $response->headers->remove('X-Powered-By');
        $response->headers->remove('Server');

        return $response;
    }

    /**
     * Check if the current page contains sensitive information
     */
    protected function isSensitivePage(Request $request): bool
    {
        $sensitivePaths = [
            'admin',
            'dashboard',
            'profile',
            'settings',
            'account',
            'api/v1/messaging',
            'api/v1/profile',
        ];

        foreach ($sensitivePaths as $path) {
            if (str_contains($request->path(), $path)) {
                return true;
            }
        }

        return false;
    }
}
