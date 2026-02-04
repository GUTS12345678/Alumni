<?php

/**
 * Database Backup Script
 * 
 * Creates a full MySQL dump of the alumni_tracer_system database
 * Run this BEFORE any data deletion operations
 * 
 * Usage: php scripts/backup_database.php
 */

require __DIR__ . '/../vendor/autoload.php';

use Illuminate\Support\Facades\Artisan;

// Bootstrap Laravel
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Configuration
$backupDir = storage_path('backups');
$timestamp = date('Y-m-d_H-i-s');
$backupFile = "{$backupDir}/alumni_tracer_backup_{$timestamp}.sql";
$csvFile = "{$backupDir}/alumni_export_{$timestamp}.csv";

// Create backup directory if it doesn't exist
if (!file_exists($backupDir)) {
    mkdir($backupDir, 0755, true);
    echo "✅ Created backup directory: {$backupDir}\n";
}

// Get database configuration
$host = env('DB_HOST', 'localhost');
$port = env('DB_PORT', '3306');
$database = env('DB_DATABASE', 'alumni_tracer_system');
$username = env('DB_USERNAME', 'root');
$password = env('DB_PASSWORD', '');

echo "\n╔══════════════════════════════════════════════════════════════╗\n";
echo "║          ALUMNI TRACER SYSTEM - DATABASE BACKUP             ║\n";
echo "╚══════════════════════════════════════════════════════════════╝\n\n";

echo "Database: {$database}\n";
echo "Host: {$host}:{$port}\n";
echo "Backup file: {$backupFile}\n\n";

echo "⏳ Creating SQL backup...\n";

// Build mysqldump command
$command = "mysqldump --host={$host} --port={$port} --user={$username}";
if (!empty($password)) {
    $command .= " --password={$password}";
}
$command .= " --databases {$database}";
$command .= " --add-drop-database";
$command .= " --add-drop-table";
$command .= " --routines --triggers --events";
$command .= " --single-transaction";
$command .= " --result-file=\"{$backupFile}\"";

// Execute backup
exec($command, $output, $returnCode);

if ($returnCode === 0) {
    $fileSize = filesize($backupFile);
    $fileSizeMB = number_format($fileSize / 1024 / 1024, 2);
    echo "✅ SQL backup created successfully!\n";
    echo "   Size: {$fileSizeMB} MB\n";
    echo "   Location: {$backupFile}\n\n";
} else {
    echo "❌ SQL backup failed with error code: {$returnCode}\n";
    echo "   Command: {$command}\n";
    exit(1);
}

// Export alumni data to CSV for reference
echo "⏳ Exporting alumni data to CSV...\n";

try {
    $alumni = \DB::table('alumni_profiles as ap')
        ->join('users as u', 'ap.user_id', '=', 'u.id')
        ->leftJoin('departments as d', 'ap.department_id', '=', 'd.id')
        ->leftJoin('courses as c', 'ap.course_id', '=', 'c.id')
        ->leftJoin('batches as b', 'ap.batch_id', '=', 'b.id')
        ->select(
            'u.email',
            'ap.student_id',
            'ap.first_name',
            'ap.last_name',
            'ap.campus_id',
            'd.name as department',
            'c.name as course',
            'b.name as batch',
            'ap.graduation_year',
            'ap.employment_status',
            'ap.current_job_title',
            'ap.current_employer',
            'ap.job_start_date',
            'ap.job_related_to_degree',
            'ap.job_mismatch_reason',
            'ap.job_satisfaction'
        )
        ->get();

    $fp = fopen($csvFile, 'w');
    
    // Write header
    fputcsv($fp, [
        'Email', 'Student ID', 'First Name', 'Last Name', 'Campus ID',
        'Department', 'Course', 'Batch', 'Graduation Year', 'Employment Status',
        'Job Title', 'Employer', 'Job Start Date', 'Job Related to Degree',
        'Job Mismatch Reason', 'Job Satisfaction'
    ]);

    // Write data
    foreach ($alumni as $alum) {
        fputcsv($fp, (array) $alum);
    }

    fclose($fp);

    $csvSize = filesize($csvFile);
    $csvSizeKB = number_format($csvSize / 1024, 2);
    
    echo "✅ CSV export created successfully!\n";
    echo "   Records: " . count($alumni) . "\n";
    echo "   Size: {$csvSizeKB} KB\n";
    echo "   Location: {$csvFile}\n\n";

} catch (Exception $e) {
    echo "⚠️ CSV export failed: " . $e->getMessage() . "\n";
    echo "   (SQL backup is still safe)\n\n";
}

// Summary
echo "╔══════════════════════════════════════════════════════════════╗\n";
echo "║                     BACKUP COMPLETE                          ║\n";
echo "╚══════════════════════════════════════════════════════════════╝\n\n";

echo "Backup Summary:\n";
echo "- SQL Dump: {$backupFile}\n";
echo "- CSV Export: {$csvFile}\n";
echo "- Timestamp: {$timestamp}\n\n";

echo "⚠️ IMPORTANT: Keep these files safe before proceeding with data deletion!\n";
echo "💾 To restore: mysql -u {$username} -p {$database} < {$backupFile}\n\n";
