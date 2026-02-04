<?php

/**
 * Data Cleanup Script - Alumni Tracer System
 * 
 * This script fixes common data inconsistencies identified by the audit script.
 * 
 * ⚠️  WARNING: This script modifies data. Create a database backup first!
 * 
 * Usage: php scripts/cleanup_alumni_data.php [--dry-run]
 */

require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use App\Models\AlumniProfile;
use App\Models\Employment;
use App\Models\Course;
use App\Models\Batch;
use Illuminate\Support\Facades\DB;

// Check for dry-run flag
$dryRun = in_array('--dry-run', $argv);

echo "\n╔════════════════════════════════════════════════════════════════╗\n";
echo "║       ALUMNI TRACER SYSTEM - DATA CLEANUP                      ║\n";
echo "║       Date: " . date('Y-m-d H:i:s') . "                            ║\n";
if ($dryRun) {
    echo "║       MODE: DRY RUN (No changes will be made)                  ║\n";
} else {
    echo "║       MODE: LIVE (Changes will be saved to database)           ║\n";
}
echo "╚════════════════════════════════════════════════════════════════╝\n\n";

if (!$dryRun) {
    echo "⚠️  WARNING: This will modify your database!\n";
    echo "Press Ctrl+C to cancel, or Enter to continue...\n";
    fgets(STDIN);
}

$fixed = [];
$totalFixed = 0;

// ============================================================================
// 1. REMOVE ORPHANED PROFILES
// ============================================================================
echo "🔧 [1/8] Cleaning orphaned alumni profiles...\n";

$orphanedProfiles = AlumniProfile::whereDoesntHave('user')->get();
$count = $orphanedProfiles->count();

if ($count > 0) {
    echo "   Found {$count} orphaned profiles\n";
    if (!$dryRun) {
        foreach ($orphanedProfiles as $profile) {
            $profile->delete();
        }
        echo "   ✓ Deleted {$count} orphaned profiles\n";
    } else {
        echo "   [DRY RUN] Would delete {$count} orphaned profiles\n";
    }
    $fixed['orphaned_profiles'] = $count;
    $totalFixed += $count;
} else {
    echo "   ✓ No orphaned profiles found\n";
}
echo "\n";

// ============================================================================
// 2. FIX INVALID EMPLOYMENT DATES
// ============================================================================
echo "🔧 [2/8] Fixing invalid employment dates...\n";

$invalidDates = Employment::whereNotNull('end_date')
    ->whereRaw('end_date < start_date')
    ->get();
$count = $invalidDates->count();

if ($count > 0) {
    echo "   Found {$count} records with end_date before start_date\n";
    if (!$dryRun) {
        foreach ($invalidDates as $record) {
            // Swap the dates
            $temp = $record->start_date;
            $record->start_date = $record->end_date;
            $record->end_date = $temp;
            $record->save();
        }
        echo "   ✓ Swapped dates for {$count} employment records\n";
    } else {
        echo "   [DRY RUN] Would swap dates for {$count} employment records\n";
    }
    $fixed['invalid_employment_dates'] = $count;
    $totalFixed += $count;
} else {
    echo "   ✓ No invalid employment dates found\n";
}
echo "\n";

// ============================================================================
// 3. FIX FUTURE START DATES
// ============================================================================
echo "🔧 [3/8] Fixing future employment start dates...\n";

$futureDates = Employment::where('start_date', '>', now())->get();
$count = $futureDates->count();

if ($count > 0) {
    echo "   Found {$count} records with future start dates\n";
    if (!$dryRun) {
        foreach ($futureDates as $record) {
            // Set to current date
            $record->start_date = now();
            $record->save();
        }
        echo "   ✓ Updated {$count} future start dates to current date\n";
    } else {
        echo "   [DRY RUN] Would update {$count} future start dates\n";
    }
    $fixed['future_start_dates'] = $count;
    $totalFixed += $count;
} else {
    echo "   ✓ No future start dates found\n";
}
echo "\n";

// ============================================================================
// 4. FIX INVALID GRADUATION YEARS
// ============================================================================
echo "🔧 [4/8] Fixing invalid graduation years...\n";

$invalidYears = AlumniProfile::where(function($q) {
    $q->where('graduation_year', '<', 1978)
      ->orWhere('graduation_year', '>', date('Y') + 1);
})->get();
$count = $invalidYears->count();

if ($count > 0) {
    echo "   Found {$count} invalid graduation years\n";
    if (!$dryRun) {
        foreach ($invalidYears as $profile) {
            // Set to null for manual review
            $profile->graduation_year = null;
            $profile->save();
        }
        echo "   ✓ Reset {$count} invalid graduation years (requires manual update)\n";
    } else {
        echo "   [DRY RUN] Would reset {$count} invalid graduation years\n";
    }
    $fixed['invalid_graduation_years'] = $count;
    $totalFixed += $count;
} else {
    echo "   ✓ No invalid graduation years found\n";
}
echo "\n";

// ============================================================================
// 5. REMOVE INVALID COURSE ASSIGNMENTS
// ============================================================================
echo "🔧 [5/7] Fixing invalid course assignments...\n";

$validCourseIds = Course::pluck('id')->toArray();
$invalidCourses = AlumniProfile::whereNotNull('course_id')
    ->whereNotIn('course_id', $validCourseIds)
    ->get();
$count = $invalidCourses->count();

if ($count > 0) {
    echo "   Found {$count} invalid course assignments\n";
    if (!$dryRun) {
        foreach ($invalidCourses as $profile) {
            $profile->course_id = null;
            $profile->save();
        }
        echo "   ✓ Reset {$count} invalid course assignments (requires manual update)\n";
    } else {
        echo "   [DRY RUN] Would reset {$count} invalid course assignments\n";
    }
    $fixed['invalid_course_assignments'] = $count;
    $totalFixed += $count;
} else {
    echo "   ✓ No invalid course assignments found\n";
}
echo "\n";

// ============================================================================
// 6. REMOVE INVALID BATCH ASSIGNMENTS
// ============================================================================
echo "🔧 [6/7] Fixing invalid batch assignments...\n";

$validBatchIds = Batch::pluck('id')->toArray();
$invalidBatches = AlumniProfile::whereNotNull('batch_id')
    ->whereNotIn('batch_id', $validBatchIds)
    ->get();
$count = $invalidBatches->count();

if ($count > 0) {
    echo "   Found {$count} invalid batch assignments\n";
    if (!$dryRun) {
        foreach ($invalidBatches as $profile) {
            $profile->batch_id = null;
            $profile->save();
        }
        echo "   ✓ Reset {$count} invalid batch assignments (requires manual update)\n";
    } else {
        echo "   [DRY RUN] Would reset {$count} invalid batch assignments\n";
    }
    $fixed['invalid_batch_assignments'] = $count;
    $totalFixed += $count;
} else {
    echo "   ✓ No invalid batch assignments found\n";
}
echo "\n";

// ============================================================================
// 7. REMOVE ORPHANED EMPLOYMENT RECORDS
// ============================================================================
echo "🔧 [7/7] Cleaning orphaned employment records...\n";

$orphanedEmployment = Employment::whereDoesntHave('alumni')->get();
$count = $orphanedEmployment->count();

if ($count > 0) {
    echo "   Found {$count} orphaned employment records\n";
    if (!$dryRun) {
        foreach ($orphanedEmployment as $record) {
            $record->delete();
        }
        echo "   ✓ Deleted {$count} orphaned employment records\n";
    } else {
        echo "   [DRY RUN] Would delete {$count} orphaned employment records\n";
    }
    $fixed['orphaned_employment'] = $count;
    $totalFixed += $count;
} else {
    echo "   ✓ No orphaned employment records found\n";
}
echo "\n";

// ============================================================================
// SUMMARY
// ============================================================================
echo "═══════════════════════════════════════════════════════════════════\n";
echo "                        CLEANUP SUMMARY                             \n";
echo "═══════════════════════════════════════════════════════════════════\n";

if ($totalFixed === 0) {
    echo "✅ No issues needed fixing. Database is clean!\n";
} else {
    if ($dryRun) {
        echo "📊 Issues that would be fixed: {$totalFixed}\n\n";
    } else {
        echo "✅ Successfully fixed {$totalFixed} issues!\n\n";
    }
    
    echo "Details:\n";
    echo "─────────────────────────────────────────────────────────────────\n";
    foreach ($fixed as $issue => $count) {
        $label = str_replace('_', ' ', ucfirst($issue));
        echo sprintf("  %-35s : %5d\n", $label, $count);
    }
}

echo "═══════════════════════════════════════════════════════════════════\n\n";

if ($dryRun) {
    echo "💡 This was a dry run. No changes were made.\n";
    echo "   Run without --dry-run to apply these fixes.\n\n";
} else {
    echo "💡 NEXT STEPS:\n";
    echo "   1. Run audit script again to verify fixes\n";
    echo "   2. Manually review records that were set to NULL\n";
    echo "   3. Contact alumni to fill in missing information\n\n";
    
    // Save cleanup log
    $logData = [
        'cleanup_date' => date('Y-m-d H:i:s'),
        'total_fixed' => $totalFixed,
        'fixes' => $fixed,
    ];
    
    $logPath = __DIR__ . '/cleanup_log_' . date('Y-m-d_His') . '.json';
    file_put_contents($logPath, json_encode($logData, JSON_PRETTY_PRINT));
    echo "📄 Cleanup log saved to: {$logPath}\n\n";
}

echo "Cleanup complete!\n";
