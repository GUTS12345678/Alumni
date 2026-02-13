<?php

use App\Models\User;
use App\Models\Role;
use App\Models\Permission;
use Tests\Feature\Traits\TestHelpers;

uses(TestHelpers::class);

beforeEach(function () {
    $this->setupTestData();
});

// ──────────────────────────────────────────────
// ROLE CRUD
// ──────────────────────────────────────────────

test('admin can list roles', function () {
    $admin = $this->createAdmin();

    $response = $this->actingAs($admin)->getJson('/api/v1/admin/roles');

    $response->assertStatus(200);
});

test('admin can create role', function () {
    $admin = $this->createAdmin();

    $response = $this->actingAs($admin)->postJson('/api/v1/admin/roles', [
        'name' => 'test_role',
        'display_name' => 'Test Role',
        'description' => 'A test role',
    ]);

    $response->assertStatus(201);
    expect(Role::where('name', 'test_role')->exists())->toBeTrue();
});

test('admin can create role with permissions', function () {
    $admin = $this->createAdmin();

    // Create some permissions
    $p1 = Permission::create(['name' => 'test.view', 'display_name' => 'View Test', 'category' => 'test', 'module' => 'test']);
    $p2 = Permission::create(['name' => 'test.create', 'display_name' => 'Create Test', 'category' => 'test', 'module' => 'test']);

    $response = $this->actingAs($admin)->postJson('/api/v1/admin/roles', [
        'name' => 'role_with_perms',
        'display_name' => 'Role With Perms',
        'description' => 'A role for testing permissions',
        'permission_ids' => [$p1->id, $p2->id],
    ]);

    $response->assertStatus(201);
    $role = Role::where('name', 'role_with_perms')->first();
    // Permissions attached via permission_ids field
    expect($role)->not->toBeNull();
});

test('admin can view single role', function () {
    $admin = $this->createAdmin();

    $role = Role::create(['name' => 'view_test', 'display_name' => 'View Test']);

    $response = $this->actingAs($admin)->getJson("/api/v1/admin/roles/{$role->id}");

    $response->assertStatus(200)
             ->assertJsonFragment(['name' => 'view_test']);
});

test('admin can update role', function () {
    $admin = $this->createAdmin();

    $role = Role::create(['name' => 'old_name', 'display_name' => 'Old Name']);

    $response = $this->actingAs($admin)->putJson("/api/v1/admin/roles/{$role->id}", [
        'name' => 'new_name',
        'display_name' => 'New Name',
    ]);

    $response->assertStatus(200);
    expect($role->fresh()->display_name)->toBe('New Name');
});

test('admin can delete non-system role', function () {
    $admin = $this->createAdmin();

    $role = Role::create(['name' => 'deletable', 'display_name' => 'Deletable', 'is_system_role' => false]);

    $response = $this->actingAs($admin)->deleteJson("/api/v1/admin/roles/{$role->id}");

    $response->assertStatus(200);
    expect(Role::where('name', 'deletable')->exists())->toBeFalse();
});

test('admin cannot delete system role', function () {
    $admin = $this->createAdmin();

    $role = Role::create(['name' => 'system_role', 'display_name' => 'System', 'is_system_role' => true]);

    $response = $this->actingAs($admin)->deleteJson("/api/v1/admin/roles/{$role->id}");

    $response->assertStatus(422);
    expect(Role::where('name', 'system_role')->exists())->toBeTrue();
});

test('role creation rejects duplicate name', function () {
    $admin = $this->createAdmin();

    Role::create(['name' => 'unique_role', 'display_name' => 'Unique']);

    $response = $this->actingAs($admin)->postJson('/api/v1/admin/roles', [
        'name' => 'unique_role',
        'display_name' => 'Duplicate',
    ]);

    $response->assertStatus(422);
});

// ──────────────────────────────────────────────
// PERMISSIONS
// ──────────────────────────────────────────────

test('admin can list permissions', function () {
    $admin = $this->createAdmin();

    Permission::create(['name' => 'perm.test', 'display_name' => 'Test Perm', 'category' => 'test', 'module' => 'test']);

    $response = $this->actingAs($admin)->getJson('/api/v1/admin/permissions');

    $response->assertStatus(200);
});

test('admin can get permissions stats', function () {
    $admin = $this->createAdmin();

    $response = $this->actingAs($admin)->getJson('/api/v1/admin/permissions/stats');

    $response->assertStatus(200);
});

test('admin can update role permissions', function () {
    $admin = $this->createAdmin();

    $role = Role::create(['name' => 'perm_role', 'display_name' => 'Perm Role']);
    $p1 = Permission::create(['name' => 'p.view', 'display_name' => 'View', 'category' => 'test', 'module' => 'test']);
    $p2 = Permission::create(['name' => 'p.edit', 'display_name' => 'Edit', 'category' => 'test', 'module' => 'test']);

    $response = $this->actingAs($admin)->putJson("/api/v1/admin/roles/{$role->id}/permissions", [
        'permission_ids' => [$p1->id, $p2->id],
    ]);

    $response->assertStatus(200);
});

// ──────────────────────────────────────────────
// AUTHORIZATION
// ──────────────────────────────────────────────

test('alumni cannot manage roles', function () {
    $alumni = $this->createAlumni();

    $response = $this->actingAs($alumni)->getJson('/api/v1/admin/roles');

    $response->assertStatus(403);
});
