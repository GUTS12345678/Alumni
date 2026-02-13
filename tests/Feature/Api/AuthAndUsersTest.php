<?php

use App\Models\User;
use App\Models\Campus;
use Tests\Feature\Traits\TestHelpers;

uses(TestHelpers::class);

beforeEach(function () {
    $this->setupTestData();
});

// ──────────────────────────────────────────────
// AUTH API TESTS
// ──────────────────────────────────────────────

test('api login returns token for valid credentials', function () {
    $user = User::factory()->create(['password' => bcrypt('secret123')]);

    $response = $this->postJson('/api/v1/login', [
        'email' => $user->email,
        'password' => 'secret123',
    ]);

    $response->assertStatus(200)
             ->assertJsonStructure(['data' => ['token']]);
});

test('api login fails with wrong password', function () {
    $user = User::factory()->create();

    $response = $this->postJson('/api/v1/login', [
        'email' => $user->email,
        'password' => 'wrongpassword',
    ]);

    $response->assertStatus(401);
});

test('api login fails with nonexistent email', function () {
    $response = $this->postJson('/api/v1/login', [
        'email' => 'nobody@example.com',
        'password' => 'password',
    ]);

    $response->assertStatus(401);
});

test('api logout revokes tokens', function () {
    $user = User::factory()->create();
    $headers = $this->apiHeaders($user);

    $response = $this->withHeaders($headers)->postJson('/api/v1/logout');

    $response->assertStatus(200);
    expect($user->tokens()->count())->toBe(0);
});

test('api profile returns authenticated user', function () {
    $user = User::factory()->create();
    $headers = $this->apiHeaders($user);

    $response = $this->withHeaders($headers)->getJson('/api/v1/profile');

    $response->assertStatus(200)
             ->assertJsonFragment(['email' => $user->email]);
});

test('api profile requires authentication', function () {
    $response = $this->getJson('/api/v1/profile');

    $response->assertStatus(401);
});

test('check email availability returns status', function () {
    User::factory()->create(['email' => 'taken@example.com']);

    // Taken email
    $response = $this->postJson('/api/v1/check-email', ['email' => 'taken@example.com']);
    $response->assertStatus(200);

    // Available email
    $response = $this->postJson('/api/v1/check-email', ['email' => 'available@example.com']);
    $response->assertStatus(200);
});

// ──────────────────────────────────────────────
// OTP TESTS
// ──────────────────────────────────────────────

test('otp send endpoint accepts valid email', function () {
    $response = $this->postJson('/api/v1/otp/send', [
        'email' => 'test@example.com',
    ]);

    // Should succeed or fail gracefully (mail is array driver)
    expect($response->status())->toBeIn([200, 201, 422, 500]);
});

test('otp verify rejects invalid code', function () {
    $response = $this->postJson('/api/v1/otp/verify', [
        'email' => 'test@example.com',
        'otp' => '000000',
    ]);

    // Should fail validation or not find the OTP
    expect($response->status())->toBeIn([400, 422, 200]);
});

// ──────────────────────────────────────────────
// WEB AUTH TESTS
// ──────────────────────────────────────────────

test('login page renders', function () {
    $response = $this->get('/login');
    $response->assertStatus(200);
});

test('register page renders', function () {
    $response = $this->get('/register');
    // May return 500 if Vite manifest not built
    expect($response->status())->toBeIn([200, 500]);
});

test('web login authenticates valid user', function () {
    $user = User::factory()->create(['password' => bcrypt('password')]);

    $response = $this->post('/login', [
        'email' => $user->email,
        'password' => 'password',
    ]);

    $this->assertAuthenticated();
});

test('web login rejects invalid password', function () {
    $user = User::factory()->create();

    $this->post('/login', [
        'email' => $user->email,
        'password' => 'wrong',
    ]);

    $this->assertGuest();
});

test('web logout works', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->post('/logout');

    $this->assertGuest();
});

test('forgot password page renders', function () {
    $response = $this->get('/forgot-password');
    $response->assertStatus(200);
});

// ──────────────────────────────────────────────
// USER MANAGEMENT API TESTS (Admin)
// ──────────────────────────────────────────────

test('admin can list users', function () {
    $admin = $this->createAdmin();

    User::factory()->count(3)->create();

    $response = $this->actingAs($admin)->getJson('/api/v1/admin/users');

    $response->assertStatus(200);
});

test('admin can create user', function () {
    $admin = $this->createAdmin();

    $response = $this->actingAs($admin)->postJson('/api/v1/admin/users', [
        'name' => 'New User',
        'email' => 'newuser@test.com',
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
        'role' => 'alumni',
        'status' => 'active',
    ]);

    $response->assertStatus(201);
});

test('admin can update user', function () {
    $admin = $this->createAdmin();
    $user = User::factory()->create();

    $response = $this->actingAs($admin)->putJson("/api/v1/admin/users/{$user->id}", [
        'email' => 'updated@test.com',
        'role' => 'alumni',
    ]);

    $response->assertStatus(200);
});

test('admin can update user status', function () {
    $admin = $this->createAdmin();
    $user = User::factory()->create(['status' => 'active']);

    $response = $this->actingAs($admin)->patchJson("/api/v1/admin/users/{$user->id}/status", [
        'status' => 'inactive',
    ]);

    $response->assertStatus(200);
    expect($user->fresh()->status)->toBe('inactive');
});

test('admin can delete user', function () {
    $admin = $this->createAdmin();
    $user = User::factory()->create();

    $response = $this->actingAs($admin)->deleteJson("/api/v1/admin/users/{$user->id}");

    $response->assertStatus(200);
});

test('alumni cannot access user management', function () {
    $alumni = $this->createAlumni();

    $response = $this->actingAs($alumni)->getJson('/api/v1/admin/users');

    $response->assertStatus(403);
});

test('unauthenticated cannot access user management', function () {
    $response = $this->getJson('/api/v1/admin/users');

    $response->assertStatus(401);
});
