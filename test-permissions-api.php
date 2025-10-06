<?php
// Test script to check Permissions API endpoints

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;

// Find an admin user
$admin = User::where('role', 'admin')->first();

if (!$admin) {
    echo "No admin user found!\n";
    exit(1);
}

echo "Testing with admin user: {$admin->email}\n\n";

// Create a token for testing
$token = $admin->createToken('test-token')->plainTextToken;
echo "Token created: $token\n\n";

// Test the roles endpoint
echo "Testing /api/v1/admin/roles endpoint...\n";
try {
    $controller = new \App\Http\Controllers\Api\AdminController();
    $request = new \Illuminate\Http\Request();
    $request->setUserResolver(function () use ($admin) {
        return $admin;
    });
    
    $response = $controller->getRoles($request);
    $data = json_decode($response->getContent(), true);
    
    echo "Status: " . $response->getStatusCode() . "\n";
    echo "Response:\n";
    print_r($data);
    echo "\n";
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}

echo "\nTesting /api/v1/admin/permissions endpoint...\n";
try {
    $response = $controller->getPermissions($request);
    $data = json_decode($response->getContent(), true);
    
    echo "Status: " . $response->getStatusCode() . "\n";
    echo "Response:\n";
    print_r($data);
    echo "\n";
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}

echo "\nTesting /api/v1/admin/users/with-roles endpoint...\n";
try {
    $response = $controller->getUsersWithRoles($request);
    $data = json_decode($response->getContent(), true);
    
    echo "Status: " . $response->getStatusCode() . "\n";
    echo "Users count: " . count($data['data'] ?? []) . "\n";
    if (isset($data['error'])) {
        echo "Error message: " . $data['error'] . "\n";
    }
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}

echo "\nTesting /api/v1/admin/permissions/stats endpoint...\n";
try {
    $response = $controller->getPermissionsStats($request);
    $data = json_decode($response->getContent(), true);
    
    echo "Status: " . $response->getStatusCode() . "\n";
    echo "Response:\n";
    print_r($data);
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
