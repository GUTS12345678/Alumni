<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;

class VerifyCsrfToken extends Middleware
{
    /**
     * The URIs that should be excluded from CSRF verification.
     *
     * @var array<int, string>
     */
    protected $except = [
        '/logout',
        '/api/check-email',
        '/api/check-student-id',
        '/api/v1/check-email',
        '/api/v1/check-student-id',
        '/api/v1/otp/send',
        '/api/v1/otp/verify',
        '/api/v1/surveys/*/start',
        '/api/register',
        '/api/v1/register',
        '/api/v1/public/*',
    ];
}
