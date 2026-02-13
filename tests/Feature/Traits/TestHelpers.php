<?php

namespace Tests\Feature\Traits;

use App\Models\User;
use App\Models\Campus;

trait TestHelpers
{
    protected function setupTestData(): void
    {
        // Create default campus (required by FK constraints)
        if (!Campus::find(1)) {
            Campus::create([
                'id' => 1,
                'name' => 'Main Campus',
                'code' => 'MAIN',
                'display_name' => 'Main Campus',
                'is_active' => true,
            ]);
        }
    }

    protected function createSuperAdmin(array $attributes = []): User
    {
        $this->setupTestData();
        return User::factory()->superAdmin()->create($attributes);
    }

    protected function createAdmin(array $attributes = []): User
    {
        $this->setupTestData();
        return User::factory()->admin()->create($attributes);
    }

    protected function createAlumni(array $attributes = []): User
    {
        $this->setupTestData();
        return User::factory()->alumni()->create($attributes);
    }

    protected function apiHeaders(User $user): array
    {
        $token = $user->createToken('test-token')->plainTextToken;
        return [
            'Authorization' => 'Bearer ' . $token,
            'Accept' => 'application/json',
        ];
    }
}
