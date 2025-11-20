<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Update existing admin user to super_admin
        $existingAdmin = User::where('email', 'nacuadrian873@gmail.com')->first();
        
        if ($existingAdmin) {
            $existingAdmin->update([
                'role' => 'super_admin',
            ]);
            
            $this->command->info('✅ Updated nacuadrian873@gmail.com to Super Admin');
        } else {
            // Create new super admin if doesn't exist
            User::create([
                'name' => 'Super Administrator',
                'email' => 'nacuadrian873@gmail.com',
                'password' => Hash::make('password'), // Change this!
                'role' => 'super_admin',
                'status' => 'active',
                'email_verified_at' => now(),
            ]);
            
            $this->command->info('✅ Created Super Admin: nacuadrian873@gmail.com');
        }
    }
}
