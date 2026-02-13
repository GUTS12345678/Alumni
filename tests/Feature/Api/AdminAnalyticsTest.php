<?php

use App\Models\User;
use App\Models\AlumniProfile;
use Tests\Feature\Traits\TestHelpers;

uses(TestHelpers::class);

beforeEach(function () {
    $this->setupTestData();
});

// ──────────────────────────────────────────────
// ADMIN DASHBOARD
// ──────────────────────────────────────────────

test('admin can access dashboard', function () {
    $admin = $this->createAdmin();

    $response = $this->actingAs($admin)->getJson('/api/v1/admin/dashboard');

    $response->assertStatus(200);
});

test('alumni cannot access admin dashboard', function () {
    $alumni = $this->createAlumni();

    $response = $this->actingAs($alumni)->getJson('/api/v1/admin/dashboard');

    $response->assertStatus(403);
});

// ──────────────────────────────────────────────
// ALUMNI MANAGEMENT
// ──────────────────────────────────────────────

test('admin can list alumni', function () {
    $admin = $this->createAdmin();

    $response = $this->actingAs($admin)->getJson('/api/v1/admin/alumni');

    $response->assertStatus(200);
});

test('admin can get alumni stats', function () {
    $admin = $this->createAdmin();

    $response = $this->actingAs($admin)->getJson('/api/v1/admin/alumni/stats');

    $response->assertStatus(200);
});

test('admin can view alumni profile', function () {
    $admin = $this->createAdmin();
    $alumni = $this->createAlumni();

    $profile = AlumniProfile::create([
        'user_id' => $alumni->id,
        'first_name' => 'Test',
        'last_name' => 'Alumni',
        'campus_id' => 1,
    ]);

    $response = $this->actingAs($admin)->getJson("/api/v1/admin/alumni/{$profile->id}");

    $response->assertStatus(200);
});

test('admin can update alumni', function () {
    $admin = $this->createAdmin();
    $alumni = $this->createAlumni();

    $profile = AlumniProfile::create([
        'user_id' => $alumni->id,
        'first_name' => 'Original',
        'last_name' => 'Name',
        'campus_id' => 1,
    ]);

    $response = $this->actingAs($admin)->putJson("/api/v1/admin/alumni/{$profile->id}", [
        'first_name' => 'Updated',
        'last_name' => 'Name',
    ]);

    $response->assertStatus(200);
});

test('admin can delete alumni', function () {
    $admin = $this->createAdmin();
    $alumni = $this->createAlumni();

    $profile = AlumniProfile::create([
        'user_id' => $alumni->id,
        'first_name' => 'Delete',
        'last_name' => 'Me',
        'campus_id' => 1,
    ]);

    $response = $this->actingAs($admin)->deleteJson("/api/v1/admin/alumni/{$profile->id}");

    $response->assertStatus(200);
});

// ──────────────────────────────────────────────
// ANALYTICS
// ──────────────────────────────────────────────

test('admin can access comprehensive analytics', function () {
    $admin = $this->createAdmin();

    $response = $this->actingAs($admin)->getJson('/api/v1/admin/analytics/comprehensive');

    $response->assertStatus(200);
});

test('admin can access time-to-job analytics', function () {
    $admin = $this->createAdmin();

    $response = $this->actingAs($admin)->getJson('/api/v1/admin/analytics/time-to-job');

    $response->assertStatus(200);
});

test('admin can access analytics overview', function () {
    $admin = $this->createAdmin();

    $response = $this->actingAs($admin)->getJson('/api/v1/admin/analytics/overview');

    $response->assertStatus(200);
});

test('alumni cannot access analytics', function () {
    $alumni = $this->createAlumni();

    $response = $this->actingAs($alumni)->getJson('/api/v1/admin/analytics/comprehensive');

    $response->assertStatus(403);
});
