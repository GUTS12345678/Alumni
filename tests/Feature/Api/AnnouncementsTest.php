<?php

use App\Models\User;
use App\Models\Announcement;
use Tests\Feature\Traits\TestHelpers;

uses(TestHelpers::class);

beforeEach(function () {
    $this->setupTestData();
});

// ──────────────────────────────────────────────
// ADMIN ANNOUNCEMENT CRUD
// ──────────────────────────────────────────────

test('admin can list announcements', function () {
    $admin = $this->createAdmin();
    $headers = $this->apiHeaders($admin);

    $response = $this->withHeaders($headers)->getJson('/api/v1/announcements/admin/list');

    $response->assertStatus(200);
});

test('admin can create announcement', function () {
    $admin = $this->createAdmin();
    $headers = $this->apiHeaders($admin);

    $response = $this->withHeaders($headers)->postJson('/api/v1/announcements/admin/create', [
        'title' => 'Test Announcement',
        'content' => 'This is a test announcement body.',
        'type' => 'general',
        'target_type' => 'all',
        'priority' => 'normal',
        'status' => 'draft',
    ]);

    $response->assertStatus(201);
    expect(Announcement::where('title', 'Test Announcement')->exists())->toBeTrue();
});

test('admin can create announcement with featured image', function () {
    $admin = $this->createAdmin();
    $headers = $this->apiHeaders($admin);

    $response = $this->withHeaders($headers)->postJson('/api/v1/announcements/admin/create', [
        'title' => 'Image Announcement',
        'content' => 'Has an image.',
        'featured_image' => 'https://example.com/image.jpg',
        'type' => 'general',
        'target_type' => 'all',
        'priority' => 'normal',
        'status' => 'published',
    ]);

    $response->assertStatus(201);
});

test('admin can update announcement', function () {
    $admin = $this->createAdmin();
    $headers = $this->apiHeaders($admin);

    $announcement = Announcement::create([
        'title' => 'Original',
        'content' => 'Original content',
        'type' => 'general',
        'priority' => 'normal',
        'status' => 'draft',
        'created_by' => $admin->id,
    ]);

    $response = $this->withHeaders($headers)->putJson("/api/v1/announcements/admin/{$announcement->id}", [
        'title' => 'Updated Title',
        'content' => 'Updated content',
    ]);

    $response->assertStatus(200);
    expect($announcement->fresh()->title)->toBe('Updated Title');
});

test('admin can delete announcement', function () {
    $admin = $this->createAdmin();
    $headers = $this->apiHeaders($admin);

    $announcement = Announcement::create([
        'title' => 'To Delete',
        'content' => 'Will be deleted',
        'type' => 'general',
        'priority' => 'normal',
        'status' => 'draft',
        'created_by' => $admin->id,
    ]);

    $response = $this->withHeaders($headers)->deleteJson("/api/v1/announcements/admin/{$announcement->id}");

    $response->assertStatus(200);
});

test('announcement validation rejects empty title', function () {
    $admin = $this->createAdmin();
    $headers = $this->apiHeaders($admin);

    $response = $this->withHeaders($headers)->postJson('/api/v1/announcements/admin/create', [
        'title' => '',
        'content' => 'Has content but no title',
    ]);

    $response->assertStatus(422);
});

// ──────────────────────────────────────────────
// ALUMNI ANNOUNCEMENT VIEWING
// ──────────────────────────────────────────────

test('authenticated user can list announcements', function () {
    $alumni = $this->createAlumni();
    $headers = $this->apiHeaders($alumni);

    // Create a published announcement
    Announcement::create([
        'title' => 'Published',
        'content' => 'Published content',
        'type' => 'general',
        'target_type' => 'all',
        'priority' => 'normal',
        'status' => 'published',
        'is_published' => true,
        'published_at' => now(),
        'created_by' => $this->createAdmin()->id,
    ]);

    $response = $this->withHeaders($headers)->getJson('/api/v1/announcements');

    $response->assertStatus(200);
});

test('authenticated user can mark announcement as read', function () {
    $alumni = $this->createAlumni();
    $admin = $this->createAdmin();
    $headers = $this->apiHeaders($alumni);

    $announcement = Announcement::create([
        'title' => 'Unread',
        'content' => 'Content',
        'type' => 'general',
        'priority' => 'normal',
        'status' => 'published',
        'is_published' => true,
        'created_by' => $admin->id,
    ]);

    $response = $this->withHeaders($headers)->postJson("/api/v1/announcements/{$announcement->id}/read");

    $response->assertStatus(200);
});

test('authenticated user can get unread count', function () {
    $alumni = $this->createAlumni();
    $headers = $this->apiHeaders($alumni);

    $response = $this->withHeaders($headers)->getJson('/api/v1/announcements/unread-count');

    $response->assertStatus(200);
});

// ──────────────────────────────────────────────
// PUBLIC ANNOUNCEMENTS
// ──────────────────────────────────────────────

test('public can access landing announcements', function () {
    $response = $this->getJson('/api/v1/public/announcements');

    $response->assertStatus(200);
});

// ──────────────────────────────────────────────
// AUTHORIZATION
// ──────────────────────────────────────────────

test('alumni cannot create announcements via admin endpoint', function () {
    $alumni = $this->createAlumni();
    $headers = $this->apiHeaders($alumni);

    $response = $this->withHeaders($headers)->postJson('/api/v1/announcements/admin/create', [
        'title' => 'Unauthorized',
        'content' => 'Should fail',
    ]);

    $response->assertStatus(403);
});
