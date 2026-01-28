<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use App\Models\Role;

// Get roles
$superAdminRole = Role::where('name', 'super_admin')->first();
$adminRole = Role::where('name', 'admin')->first();
$alumniRole = Role::where('name', 'alumni')->first();

echo "Roles found:\n";
echo "- Super Admin: ID {$superAdminRole->id}\n";
echo "- Admin: ID {$adminRole->id}\n";
echo "- Alumni: ID {$alumniRole->id}\n\n";

// Update users based on their old role column
$superAdmins = User::where('role', 'super_admin')->update(['role_id' => $superAdminRole->id]);
echo "Updated {$superAdmins} super admin users\n";

$admins = User::where('role', 'admin')->update(['role_id' => $adminRole->id]);
echo "Updated {$admins} admin users\n";

$alumni = User::where('role', 'alumni')->update(['role_id' => $alumniRole->id]);
echo "Updated {$alumni} alumni users\n";

echo "\nDone!\n";
