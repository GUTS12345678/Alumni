<?php

use App\Models\User;
use App\Models\AlumniProfile;
use App\Models\Batch;
use Tests\Feature\Traits\TestHelpers;

uses(TestHelpers::class);

beforeEach(function () {
    $this->setupTestData();
});

// ──────────────────────────────────────────────
// BATCHES
// ──────────────────────────────────────────────

test('admin can list batches', function () {
    $admin = $this->createAdmin();

    $response = $this->actingAs($admin)->getJson('/api/v1/admin/batches');

    $response->assertStatus(200);
});

test('admin can create batch', function () {
    $admin = $this->createAdmin();

    $response = $this->actingAs($admin)->postJson('/api/v1/admin/batches', [
        'name' => 'Batch 2025',
        'graduation_year' => 2025,
        'status' => 'active',
    ]);

    $response->assertStatus(201);
    expect(Batch::where('name', 'Batch 2025')->exists())->toBeTrue();
});

test('admin can update batch', function () {
    $admin = $this->createAdmin();

    $batch = Batch::create([
        'name' => 'Old Batch',
        'graduation_year' => 2024,
        'status' => 'active',
        'campus_id' => 1,
    ]);

    $response = $this->actingAs($admin)->putJson("/api/v1/admin/batches/{$batch->id}", [
        'name' => 'Updated Batch',
    ]);

    $response->assertStatus(200);
});

test('admin can delete batch', function () {
    $admin = $this->createAdmin();

    $batch = Batch::create([
        'name' => 'Delete Batch',
        'graduation_year' => 2024,
        'status' => 'active',
        'campus_id' => 1,
    ]);

    $response = $this->actingAs($admin)->deleteJson("/api/v1/admin/batches/{$batch->id}");

    $response->assertStatus(200);
});

// ──────────────────────────────────────────────
// ALUMNI PROFILE API
// ──────────────────────────────────────────────

test('alumni can view own profile', function () {
    $alumni = $this->createAlumni();
    $headers = $this->apiHeaders($alumni);

    AlumniProfile::create([
        'user_id' => $alumni->id,
        'first_name' => 'My',
        'last_name' => 'Profile',
        'campus_id' => 1,
    ]);

    $response = $this->withHeaders($headers)->getJson('/api/v1/alumni/profile');

    $response->assertStatus(200);
});

test('alumni can update own profile', function () {
    $alumni = $this->createAlumni();
    $headers = $this->apiHeaders($alumni);

    AlumniProfile::create([
        'user_id' => $alumni->id,
        'first_name' => 'Old',
        'last_name' => 'Name',
        'campus_id' => 1,
    ]);

    $response = $this->withHeaders($headers)->putJson('/api/v1/alumni/profile', [
        'first_name' => 'New',
        'last_name' => 'Name',
        'employment_status' => 'employed_full_time',
    ]);

    $response->assertStatus(200);
});

// ──────────────────────────────────────────────
// ACTIVITY LOGS
// ──────────────────────────────────────────────

test('admin can view activity logs', function () {
    $admin = $this->createAdmin();

    $response = $this->actingAs($admin)->getJson('/api/v1/admin/activity-logs');

    $response->assertStatus(200);
});

// ──────────────────────────────────────────────
// PUBLIC ENDPOINTS
// ──────────────────────────────────────────────

test('public stats endpoint works', function () {
    $response = $this->getJson('/api/v1/public/stats');
    $response->assertStatus(200);
});

test('public alumni search works', function () {
    $response = $this->postJson('/api/v1/public/search-alumni', [
        'query' => 'test',
    ]);
    expect($response->status())->toBeIn([200, 422]);
});

test('health check endpoint works', function () {
    $response = $this->getJson('/api/health');
    $response->assertStatus(200);
});
