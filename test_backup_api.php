<?php

require __DIR__.'/vendor/autoload.php';

use Illuminate\Support\Facades\Artisan;

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Backup API Functionality Test ===\n\n";

// Test 1: Get System Info
echo "1. Testing getSystemInfo()...\n";
$controller = new App\Http\Controllers\Api\AdminController();
$request = new Illuminate\Http\Request();
$response = $controller->getSystemInfo();
$data = json_decode($response->getContent(), true);

if ($data['success']) {
    echo "✅ System Info retrieved successfully\n";
    echo "   - Database Size: {$data['data']['database_size']}\n";
    echo "   - Total Tables: {$data['data']['total_tables']}\n";
    echo "   - Total Records: {$data['data']['total_records']}\n";
    echo "   - Available Space: {$data['data']['available_space']}\n";
    echo "   - Last Backup: {$data['data']['last_backup']}\n";
} else {
    echo "❌ Failed to get system info\n";
    echo "   Error: {$data['message']}\n";
}
echo "\n";

// Test 2: Create Backup
echo "2. Testing createBackup()...\n";
$response = $controller->createBackup();
$data = json_decode($response->getContent(), true);

if ($data['success']) {
    echo "✅ Backup created successfully\n";
    echo "   - Filename: {$data['data']['filename']}\n";
    echo "   - Size: {$data['data']['size']}\n";
    echo "   - ID: {$data['data']['id']}\n";
    $backupId = $data['data']['id'];
    $backupFilename = $data['data']['filename'];
} else {
    echo "❌ Failed to create backup\n";
    echo "   Error: {$data['message']}\n";
    exit(1);
}
echo "\n";

// Test 3: List Backups
echo "3. Testing getBackups()...\n";
$response = $controller->getBackups();
$data = json_decode($response->getContent(), true);

if ($data['success']) {
    $count = count($data['data']);
    echo "✅ Backups retrieved successfully\n";
    echo "   - Total backups: {$count}\n";
    if ($count > 0) {
        $backup = $data['data'][0];
        echo "   - Latest: {$backup['filename']}\n";
        echo "   - Size: {$backup['size']}\n";
        echo "   - Type: {$backup['type']}\n";
        echo "   - Status: {$backup['status']}\n";
    }
} else {
    echo "❌ Failed to get backups\n";
    echo "   Error: {$data['message']}\n";
}
echo "\n";

// Test 4: Verify Backup File Exists
echo "4. Verifying backup file exists...\n";
$backupPath = storage_path('app/backups/' . $backupFilename);
if (file_exists($backupPath)) {
    $size = filesize($backupPath);
    echo "✅ Backup file exists\n";
    echo "   - Path: {$backupPath}\n";
    echo "   - Size: " . number_format($size) . " bytes\n";
} else {
    echo "❌ Backup file not found at: {$backupPath}\n";
}
echo "\n";

// Test 5: Delete Backup
echo "5. Testing deleteBackup()...\n";
$response = $controller->deleteBackup($backupId);
$data = json_decode($response->getContent(), true);

if ($data['success']) {
    echo "✅ Backup deleted successfully\n";
    
    // Verify file is gone
    if (!file_exists($backupPath)) {
        echo "   ✅ Backup file removed from disk\n";
    } else {
        echo "   ⚠️  Backup file still exists on disk\n";
    }
} else {
    echo "❌ Failed to delete backup\n";
    echo "   Error: {$data['message']}\n";
}
echo "\n";

// Test 6: Verify Backup List After Delete
echo "6. Verifying backup list after deletion...\n";
$response = $controller->getBackups();
$data = json_decode($response->getContent(), true);

if ($data['success']) {
    $count = count($data['data']);
    echo "✅ Backup list updated\n";
    echo "   - Total backups: {$count}\n";
} else {
    echo "❌ Failed to get backups\n";
}
echo "\n";

echo "=== All Tests Completed ===\n";
