<?php

use App\Models\User;
use App\Models\JobPosting;
use App\Models\JobCategory;
use Tests\Feature\Traits\TestHelpers;

uses(TestHelpers::class);

beforeEach(function () {
    $this->setupTestData();
});

// ──────────────────────────────────────────────
// PUBLIC JOB BOARD
// ──────────────────────────────────────────────

test('public can list jobs', function () {
    $response = $this->getJson('/api/v1/jobs');
    $response->assertStatus(200);
});

test('public can get job categories', function () {
    $response = $this->getJson('/api/v1/jobs/categories');
    $response->assertStatus(200);
});

test('public can get featured jobs', function () {
    $response = $this->getJson('/api/v1/jobs/featured');
    $response->assertStatus(200);
});

test('public can get recent jobs', function () {
    $response = $this->getJson('/api/v1/jobs/recent');
    $response->assertStatus(200);
});

test('public can view single job', function () {
    $admin = $this->createAdmin();
    $job = JobPosting::create([
        'title' => 'Test Job',
        'slug' => 'test-job-' . uniqid(),
        'company_name' => 'Test Corp',
        'content' => 'A test job posting.',
        'location' => 'Manila',
        'job_type' => 'full_time',
        'status' => 'published',
        'created_by' => $admin->id,
        'published_at' => now(),
    ]);

    $response = $this->getJson("/api/v1/jobs/{$job->id}");
    $response->assertStatus(200);
});

test('public landing jobs endpoint works', function () {
    $response = $this->getJson('/api/v1/public/jobs');
    $response->assertStatus(200);
});

// ──────────────────────────────────────────────
// ADMIN JOB BOARD CRUD
// ──────────────────────────────────────────────

test('admin can list jobs', function () {
    $admin = $this->createAdmin();
    $headers = $this->apiHeaders($admin);

    $response = $this->withHeaders($headers)->getJson('/api/v1/admin/jobs');
    $response->assertStatus(200);
});

test('admin can create job posting', function () {
    $admin = $this->createAdmin();
    $headers = $this->apiHeaders($admin);

    // Create a job category first
    $category = \App\Models\JobCategory::create(['name' => 'Engineering', 'slug' => 'engineering', 'is_active' => true]);

    $response = $this->withHeaders($headers)->postJson('/api/v1/admin/jobs', [
        'title' => 'Software Engineer',
        'company_name' => 'TechCo',
        'content' => 'We need a developer.',
        'location' => 'Makati City',
        'job_type' => 'full_time',
        'experience_level' => 'mid',
        'work_arrangement' => 'onsite',
        'category_id' => $category->id,
        'status' => 'published',
    ]);

    $response->assertStatus(201);
    expect(JobPosting::where('title', 'Software Engineer')->exists())->toBeTrue();
});

test('admin can create job with background image', function () {
    $admin = $this->createAdmin();
    $headers = $this->apiHeaders($admin);

    $category = \App\Models\JobCategory::create(['name' => 'Design', 'slug' => 'design', 'is_active' => true]);

    $response = $this->withHeaders($headers)->postJson('/api/v1/admin/jobs', [
        'title' => 'Designer',
        'company_name' => 'DesignCo',
        'content' => 'Design things.',
        'location' => 'Remote',
        'job_type' => 'full_time',
        'work_arrangement' => 'remote',
        'category_id' => $category->id,
        'background_image' => '/storage/uploads/test.jpg',
        'poster_image' => '/storage/uploads/poster.jpg',
    ]);

    $response->assertStatus(201);
});

test('admin can update job posting', function () {
    $admin = $this->createAdmin();
    $headers = $this->apiHeaders($admin);

    $job = JobPosting::create([
        'title' => 'Original Title',
        'slug' => 'original-' . uniqid(),
        'company_name' => 'Corp',
        'content' => 'Job description content.',
        'location' => 'Manila',
        'job_type' => 'full_time',
        'status' => 'draft',
        'created_by' => $admin->id,
    ]);

    $response = $this->withHeaders($headers)->putJson("/api/v1/admin/jobs/{$job->id}", [
        'title' => 'Updated Title',
        'status' => 'published',
    ]);

    $response->assertStatus(200);
});

test('admin can delete job posting', function () {
    $admin = $this->createAdmin();
    $headers = $this->apiHeaders($admin);

    $job = JobPosting::create([
        'title' => 'To Delete',
        'slug' => 'delete-' . uniqid(),
        'company_name' => 'Corp',
        'content' => 'Will be deleted.',
        'location' => 'Manila',
        'job_type' => 'full_time',
        'status' => 'draft',
        'created_by' => $admin->id,
    ]);

    $response = $this->withHeaders($headers)->deleteJson("/api/v1/admin/jobs/{$job->id}");
    $response->assertStatus(200);
});

test('admin can get job statistics', function () {
    $admin = $this->createAdmin();
    $headers = $this->apiHeaders($admin);

    $response = $this->withHeaders($headers)->getJson('/api/v1/admin/jobs/statistics');
    $response->assertStatus(200);
});

// ──────────────────────────────────────────────
// JOB CATEGORIES
// ──────────────────────────────────────────────

test('admin can create job category', function () {
    $admin = $this->createAdmin();
    $headers = $this->apiHeaders($admin);

    $response = $this->withHeaders($headers)->postJson('/api/v1/admin/jobs/categories', [
        'name' => 'Engineering',
        'slug' => 'engineering',
        'description' => 'Engineering jobs',
    ]);

    $response->assertStatus(201);
    expect(JobCategory::where('slug', 'engineering')->exists())->toBeTrue();
});

test('admin can update job category', function () {
    $admin = $this->createAdmin();
    $headers = $this->apiHeaders($admin);

    $category = JobCategory::create([
        'name' => 'Old Category',
        'slug' => 'old-category',
    ]);

    $response = $this->withHeaders($headers)->putJson("/api/v1/admin/jobs/categories/{$category->id}", [
        'name' => 'New Category',
    ]);

    $response->assertStatus(200);
});

test('admin can delete job category', function () {
    $admin = $this->createAdmin();
    $headers = $this->apiHeaders($admin);

    $category = JobCategory::create([
        'name' => 'Temp',
        'slug' => 'temp-cat',
    ]);

    $response = $this->withHeaders($headers)->deleteJson("/api/v1/admin/jobs/categories/{$category->id}");
    $response->assertStatus(200);
});

// ──────────────────────────────────────────────
// BULK OPERATIONS
// ──────────────────────────────────────────────

test('admin can bulk update job status', function () {
    $admin = $this->createAdmin();
    $headers = $this->apiHeaders($admin);

    $job1 = JobPosting::create([
        'title' => 'Bulk 1', 'slug' => 'bulk-1-' . uniqid(), 'company_name' => 'C',
        'content' => 'Bulk job 1 content.', 'location' => 'L', 'job_type' => 'full_time',
        'status' => 'draft', 'created_by' => $admin->id,
    ]);
    $job2 = JobPosting::create([
        'title' => 'Bulk 2', 'slug' => 'bulk-2-' . uniqid(), 'company_name' => 'C',
        'content' => 'Bulk job 2 content.', 'location' => 'L', 'job_type' => 'full_time',
        'status' => 'draft', 'created_by' => $admin->id,
    ]);

    $response = $this->withHeaders($headers)->postJson('/api/v1/admin/jobs/bulk-status', [
        'job_ids' => [$job1->id, $job2->id],
        'status' => 'published',
    ]);

    $response->assertStatus(200);
});

// ──────────────────────────────────────────────
// AUTHORIZATION
// ──────────────────────────────────────────────

test('alumni cannot create job via admin endpoint', function () {
    $alumni = $this->createAlumni();
    $headers = $this->apiHeaders($alumni);

    $response = $this->withHeaders($headers)->postJson('/api/v1/admin/jobs', [
        'title' => 'Unauthorized',
        'company_name' => 'Corp',
        'content' => 'Should fail.',
        'location' => 'Manila',
        'job_type' => 'full_time',
    ]);

    $response->assertStatus(403);
});

test('job creation validation rejects missing required fields', function () {
    $admin = $this->createAdmin();
    $headers = $this->apiHeaders($admin);

    $response = $this->withHeaders($headers)->postJson('/api/v1/admin/jobs', [
        'title' => '', // empty
    ]);

    $response->assertStatus(422);
});
