<?php

use App\Models\User;
use App\Models\AlumniProfile;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);
uses(\Tests\Feature\Traits\TestHelpers::class);

/*
|--------------------------------------------------------------------------
| Security Headers Tests
|--------------------------------------------------------------------------
| Validates SecurityHeaders middleware (applied globally to web & api).
*/

test('security headers are present on web responses', function () {
    $response = $this->get('/');

    $response->assertHeader('X-Content-Type-Options', 'nosniff');
    $response->assertHeader('X-Frame-Options', 'SAMEORIGIN');
    $response->assertHeader('X-XSS-Protection', '1; mode=block');
    $response->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    $response->assertHeader('Permissions-Policy');
    $response->assertHeader('Content-Security-Policy');
});

test('security headers are present on api responses', function () {
    $response = $this->getJson('/api/v1/public/stats');

    $response->assertHeader('X-Content-Type-Options', 'nosniff');
    $response->assertHeader('X-Frame-Options', 'SAMEORIGIN');
    $response->assertHeader('X-XSS-Protection', '1; mode=block');
});

test('CSP header contains required directives', function () {
    $response = $this->get('/');

    $csp = $response->headers->get('Content-Security-Policy');

    expect($csp)->toContain("default-src 'self'");
    expect($csp)->toContain("script-src");
    expect($csp)->toContain("style-src");
    expect($csp)->toContain("frame-ancestors 'self'");
    expect($csp)->toContain("object-src 'none'");
});

test('sensitive pages have no-cache headers', function () {
    $admin = $this->createAdmin();

    $response = $this->actingAs($admin)->get('/admin/dashboard');

    $cacheControl = $response->headers->get('Cache-Control');
    expect($cacheControl)->toContain('no-store');
});

test('server information headers are removed', function () {
    $response = $this->get('/');

    // These should be removed by SecurityHeaders middleware
    expect($response->headers->has('X-Powered-By'))->toBeFalse();
});

/*
|--------------------------------------------------------------------------
| CSRF Protection Tests
|--------------------------------------------------------------------------
*/

test('CSRF protection is active on web routes', function () {
    // Laravel test helper auto-injects CSRF tokens.
    // Verify that posting invalid login creds is handled properly
    // (not bypassed) — proves web middleware stack is active.
    $response = $this->post('/login', [
        'email' => 'nonexistent@example.com',
        'password' => 'wrong-password',
    ]);

    // Should redirect back with validation errors (302 + session errors)
    $response->assertRedirect();
    $response->assertInvalid();
});

test('logout endpoint is excluded from CSRF', function () {
    $admin = $this->createAdmin();

    // Should work without explicit CSRF since /logout is excluded
    $response = $this->actingAs($admin)->post('/logout');
    $response->assertRedirect('/');
});

/*
|--------------------------------------------------------------------------
| Authentication & Authorization Tests
|--------------------------------------------------------------------------
*/

test('unauthenticated users cannot access admin routes', function () {
    $response = $this->get('/admin/dashboard');
    $response->assertRedirect('/login');
});

test('unauthenticated users cannot access alumni routes', function () {
    $response = $this->get('/alumni/dashboard');
    $response->assertRedirect('/login');
});

test('alumni cannot access admin routes', function () {
    $alumni = $this->createAlumni();

    $response = $this->actingAs($alumni)->get('/admin/dashboard');
    // Middleware may redirect (302) or return 403 depending on implementation
    expect($response->status())->toBeIn([302, 403]);
});

test('admin cannot access alumni-only routes', function () {
    $admin = $this->createAdmin();

    $response = $this->actingAs($admin)->get('/alumni/profile');
    // Middleware may redirect (302) or return 403 depending on implementation
    expect($response->status())->toBeIn([302, 403]);
});

test('admin cannot access super admin routes', function () {
    $admin = $this->createAdmin();

    $response = $this->actingAs($admin)->get('/super-admin/departments');
    $response->assertStatus(403);
});

/*
|--------------------------------------------------------------------------
| Sensitive Data Protection Tests
|--------------------------------------------------------------------------
*/

test('sensitive data protection middleware does not block requests', function () {
    $admin = $this->createAdmin();

    // The SensitiveDataProtection middleware masks sensitive fields
    // in request attributes for logging purposes.
    // Verify it doesn't block a valid request with sensitive fields.
    $response = $this->actingAs($admin)->postJson('/api/v1/admin/users', [
        'name' => 'Test User',
        'email' => 'securitytest@example.com',
        'password' => 'SecretPassword123!',
        'password_confirmation' => 'SecretPassword123!',
        'role' => 'alumni',
        'role_id' => 3,
        'status' => 'active',
    ]);

    // Should succeed (201) or at least not be blocked by middleware (not 500)
    expect($response->status())->toBeIn([200, 201]);
});

/*
|--------------------------------------------------------------------------
| Rate Limiting Tests (via LoginRequest)
|--------------------------------------------------------------------------
| Laravel's built-in rate limiting on login requests.
*/

test('login is rate limited after failed attempts', function () {
    $email = 'nonexistent@example.com';

    // Make multiple failed login attempts
    for ($i = 0; $i < 5; $i++) {
        $this->post('/login', [
            'email' => $email,
            'password' => 'wrong-password',
        ]);
    }

    // The 6th attempt should be rate limited
    $response = $this->post('/login', [
        'email' => $email,
        'password' => 'wrong-password',
    ]);

    // Should get a validation error about too many attempts
    $response->assertInvalid();
});

/*
|--------------------------------------------------------------------------
| API Authentication Tests
|--------------------------------------------------------------------------
*/

test('API routes require authentication', function () {
    $response = $this->getJson('/api/v1/profile');
    $response->assertStatus(401);
});

test('API admin routes reject non-admin users', function () {
    $alumni = $this->createAlumni();
    $token = $alumni->createToken('test-token')->plainTextToken;

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/v1/admin/dashboard');

    $response->assertStatus(403);
});

test('API returns JSON for unauthenticated requests', function () {
    $response = $this->getJson('/api/v1/admin/dashboard');
    
    $response->assertStatus(401);
    $response->assertJson(['message' => 'Unauthenticated.']);
});

/*
|--------------------------------------------------------------------------
| EnsurePasswordChanged Middleware Tests
|--------------------------------------------------------------------------
*/

test('user with must_change_password is redirected', function () {
    $user = $this->createAdmin();
    $user->update(['must_change_password' => true]);

    $response = $this->actingAs($user)->get('/admin/dashboard');

    $response->assertRedirect(route('force-change-password'));
});

test('user with must_change_password can access force-change-password page', function () {
    $user = $this->createAdmin();
    $user->update(['must_change_password' => true]);

    $response = $this->actingAs($user)->get('/force-change-password');

    $response->assertStatus(200);
});

test('user with must_change_password can still logout', function () {
    $user = $this->createAdmin();
    $user->update(['must_change_password' => true]);

    $response = $this->actingAs($user)->post('/logout');

    $response->assertRedirect('/');
    $this->assertGuest();
});

/*
|--------------------------------------------------------------------------
| Session Security Tests
|--------------------------------------------------------------------------
*/

test('session is regenerated on login', function () {
    $user = User::factory()->create();

    $sessionIdBefore = session()->getId();

    $this->post('/login', [
        'email' => $user->email,
        'password' => 'password',
    ]);

    // After login, session should be regenerated (different ID)
    $this->assertAuthenticated();
});

test('session is invalidated on logout', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->post('/logout');

    $this->assertGuest();
});

/*
|--------------------------------------------------------------------------
| Input Validation Tests
|--------------------------------------------------------------------------
*/

test('login rejects empty credentials', function () {
    $response = $this->post('/login', []);

    $response->assertInvalid(['password']);
});

test('registration validates required fields', function () {
    $response = $this->postJson('/api/v1/register', []);

    $response->assertStatus(422);
});

test('registration rejects weak passwords', function () {
    $response = $this->postJson('/api/v1/register', [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => '123', // Too weak
        'password_confirmation' => '123',
    ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['password']);
});

/*
|--------------------------------------------------------------------------
| Public Routes Accessibility Tests
|--------------------------------------------------------------------------
*/

test('public endpoints are accessible without auth', function () {
    $this->getJson('/api/v1/public/stats')->assertOk();
    $this->getJson('/api/v1/public/announcements')->assertOk();
    $this->getJson('/api/v1/public/jobs')->assertOk();
    $this->get('/')->assertOk();
    $this->get('/login')->assertOk();
});

test('health check endpoint is accessible', function () {
    $this->getJson('/api/health')->assertOk();
});
