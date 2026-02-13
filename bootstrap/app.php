<?php

use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\AdminMiddleware;
use App\Http\Middleware\AlumniMiddleware;
use App\Http\Middleware\SuperAdminMiddleware;
use App\Http\Middleware\CheckPermission;
use App\Http\Middleware\TrustProxies;
use App\Http\Middleware\SecurityHeaders;
use App\Http\Middleware\RateLimiter;
use App\Http\Middleware\SqlInjectionPrevention;
use App\Http\Middleware\XssPrevention;
use App\Http\Middleware\SecureFileUpload;
use App\Http\Middleware\SensitiveDataProtection;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        // Use custom CSRF middleware with logout exemption
        $middleware->validateCsrfTokens(except: [
            '/logout',
        ]);

        // Security middleware applied globally
        $middleware->web(prepend: [
            SecurityHeaders::class,
            SensitiveDataProtection::class,
        ]);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        // Enable stateful middleware for session and token authentication
        // Security middleware for API
        $middleware->api(prepend: [
            SecurityHeaders::class,
            \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
        ]);

        $middleware->alias([
            'admin' => AdminMiddleware::class,
            'alumni' => AlumniMiddleware::class,
            'super_admin' => SuperAdminMiddleware::class,
            'permission' => CheckPermission::class,
            // Security middleware aliases
            'security.headers' => SecurityHeaders::class,
            'security.rate_limit' => RateLimiter::class,
            'security.sql_injection' => SqlInjectionPrevention::class,
            'security.xss' => XssPrevention::class,
            'security.file_upload' => SecureFileUpload::class,
            'security.sensitive_data' => SensitiveDataProtection::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
