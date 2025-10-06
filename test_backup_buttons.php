<?php

/**
 * Test Script for Backup Button Functionality
 * Tests all three backup types: full, partial, structure
 */

$baseUrl = 'http://127.0.0.1:8000/api/v1/admin';
$token = 'your_auth_token_here'; // Replace with actual token from localStorage

// Get token from user
echo "=== Backup Button Functionality Test ===\n\n";
echo "Enter your auth token (from browser localStorage): ";
$token = trim(fgets(STDIN));

if (empty($token)) {
    echo "❌ Token is required!\n";
    exit(1);
}

$headers = [
    'Authorization: Bearer ' . $token,
    'Accept: application/json',
    'Content-Type: application/json'
];

/**
 * Helper function to make API requests
 */
function makeRequest($url, $method, $headers, $data = null) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    
    if ($data) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return [
        'code' => $httpCode,
        'body' => json_decode($response, true)
    ];
}

// Test 1: Create Full Backup
echo "\n1. Testing 'Create Full Backup' button...\n";
$response = makeRequest("$baseUrl/backups", 'POST', $headers, ['type' => 'full']);

if ($response['code'] === 200 && $response['body']['success']) {
    echo "✅ Full backup created successfully\n";
    echo "   - Filename: {$response['body']['data']['filename']}\n";
    echo "   - Size: {$response['body']['data']['size']}\n";
    echo "   - Type: {$response['body']['data']['type']}\n";
    $fullBackupId = $response['body']['data']['id'];
} else {
    echo "❌ FAILED: " . ($response['body']['message'] ?? 'Unknown error') . "\n";
    exit(1);
}

sleep(2); // Wait before next backup

// Test 2: Create Data Only (Partial) Backup
echo "\n2. Testing 'Create Data Backup' button...\n";
$response = makeRequest("$baseUrl/backups", 'POST', $headers, ['type' => 'partial']);

if ($response['code'] === 200 && $response['body']['success']) {
    echo "✅ Partial backup created successfully\n";
    echo "   - Filename: {$response['body']['data']['filename']}\n";
    echo "   - Size: {$response['body']['data']['size']}\n";
    echo "   - Type: {$response['body']['data']['type']}\n";
    $partialBackupId = $response['body']['data']['id'];
} else {
    echo "❌ FAILED: " . ($response['body']['message'] ?? 'Unknown error') . "\n";
}

sleep(2);

// Test 3: Create Structure Only Backup
echo "\n3. Testing 'Create Structure Backup' button...\n";
$response = makeRequest("$baseUrl/backups", 'POST', $headers, ['type' => 'structure']);

if ($response['code'] === 200 && $response['body']['success']) {
    echo "✅ Structure backup created successfully\n";
    echo "   - Filename: {$response['body']['data']['filename']}\n";
    echo "   - Size: {$response['body']['data']['size']}\n";
    echo "   - Type: {$response['body']['data']['type']}\n";
    $structureBackupId = $response['body']['data']['id'];
} else {
    echo "❌ FAILED: " . ($response['body']['message'] ?? 'Unknown error') . "\n";
}

// Test 4: List All Backups
echo "\n4. Testing backup list display...\n";
$response = makeRequest("$baseUrl/backups", 'GET', $headers);

if ($response['code'] === 200 && $response['body']['success']) {
    $backups = $response['body']['data'];
    echo "✅ Found " . count($backups) . " backups\n";
    
    echo "\nBackup Details:\n";
    foreach ($backups as $index => $backup) {
        echo "   " . ($index + 1) . ". {$backup['filename']}\n";
        echo "      Type: {$backup['type']} | Size: {$backup['size']} | Status: {$backup['status']}\n";
    }
} else {
    echo "❌ FAILED to fetch backups\n";
}

// Test 5: Test Download Button (verify URL)
echo "\n5. Testing 'Download' button functionality...\n";
if (isset($fullBackupId)) {
    // Verify the backup file exists physically
    $backupPath = "C:\\xampp\\htdocs\\storage\\app\\backups\\{$fullBackupId}.sql";
    if (file_exists($backupPath)) {
        echo "✅ Backup file exists and can be downloaded\n";
        echo "   - Path: {$backupPath}\n";
        echo "   - Size: " . filesize($backupPath) . " bytes\n";
    } else {
        echo "❌ Backup file not found at: {$backupPath}\n";
    }
}

// Test 6: Test Delete Button
echo "\n6. Testing 'Delete' button functionality...\n";
if (isset($partialBackupId)) {
    $response = makeRequest("$baseUrl/backups/{$partialBackupId}", 'DELETE', $headers);
    
    if ($response['code'] === 200 && $response['body']['success']) {
        echo "✅ Backup deleted successfully\n";
        
        // Verify file is gone
        $backupPath = "C:\\xampp\\htdocs\\storage\\app\\backups\\{$partialBackupId}.sql";
        if (!file_exists($backupPath)) {
            echo "✅ Backup file removed from disk\n";
        } else {
            echo "❌ Backup file still exists!\n";
        }
    } else {
        echo "❌ FAILED to delete backup\n";
    }
}

// Test 7: Test Refresh Button (fetch system info)
echo "\n7. Testing 'Refresh' button functionality...\n";
$response = makeRequest("$baseUrl/system/info", 'GET', $headers);

if ($response['code'] === 200 && $response['body']['success']) {
    $info = $response['body']['data'];
    echo "✅ System info refreshed successfully\n";
    echo "   - Database Size: {$info['database_size']}\n";
    echo "   - Total Tables: {$info['total_tables']}\n";
    echo "   - Total Records: {$info['total_records']}\n";
    echo "   - Available Space: {$info['available_space']}\n";
    echo "   - Last Backup: {$info['last_backup']}\n";
} else {
    echo "❌ FAILED to fetch system info\n";
}

echo "\n=== All Button Tests Completed ===\n";
echo "\nNote: The Download button actually streams the file via the browser.\n";
echo "To test it fully, click the Download button in the browser interface.\n";

