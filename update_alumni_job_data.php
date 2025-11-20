<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\AlumniProfile;
use Illuminate\Support\Facades\DB;

echo "Updating Alumni with Job Mismatch and Satisfaction Data\n";
echo str_repeat("=", 80) . "\n\n";

DB::beginTransaction();

try {
    // Update employed alumni with job mismatch and satisfaction data
    $employed = AlumniProfile::whereIn('employment_status', ['employed_full_time', 'employed_part_time', 'self_employed'])->get();
    
    $mismatchReasons = [null, null, null, 'overqualified', 'underqualified', 'unfit']; // 50% no mismatch
    $updated = 0;
    
    foreach ($employed as $alum) {
        $mismatchReason = $mismatchReasons[array_rand($mismatchReasons)];
        
        $alum->job_mismatch_reason = $mismatchReason;
        $alum->job_satisfaction = rand(5, 10); // Job satisfaction 5-10
        $alum->job_related_to_degree = (rand(1, 100) <= 70); // 70% job related to degree
        $alum->save();
        $updated++;
    }
    
    echo "✓ Updated {$updated} employed alumni profiles with job mismatch data\n\n";
    
    // Update unemployed alumni with unemployment reasons
    $unemployed = AlumniProfile::whereIn('employment_status', ['unemployed_seeking', 'unemployed_not_seeking'])->get();
    $reasons = ['lack_of_opportunities', 'overqualified', 'underqualified', 'location_constraints', 'health_reasons', 'family_obligations', 'other'];
    
    $unemployedUpdated = 0;
    foreach ($unemployed as $alum) {
        $alum->unemployment_reason = $reasons[array_rand($reasons)];
        $alum->save();
        $unemployedUpdated++;
    }
    
    echo "✓ Updated {$unemployedUpdated} unemployed alumni profiles with unemployment reasons\n\n";
    
    DB::commit();
    
    // Show statistics
    echo "Job Mismatch Statistics:\n";
    echo str_repeat("-", 80) . "\n";
    
    $stats = DB::select("
        SELECT 
            job_mismatch_reason,
            COUNT(*) as count,
            ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM alumni_profiles WHERE employment_status IN ('employed_full_time', 'employed_part_time', 'self_employed')), 1) as percentage
        FROM alumni_profiles
        WHERE employment_status IN ('employed_full_time', 'employed_part_time', 'self_employed')
        GROUP BY job_mismatch_reason
        ORDER BY count DESC
    ");
    
    foreach ($stats as $stat) {
        $reason = $stat->job_mismatch_reason ?? 'No Mismatch (Good Match)';
        echo sprintf("%-30s: %3d (%5.1f%%)\n", $reason, $stat->count, $stat->percentage);
    }
    
    echo "\n✅ Successfully updated all alumni profiles!\n";
    echo "Refresh your analytics dashboard to see the changes.\n";
    
} catch (\Exception $e) {
    DB::rollBack();
    echo "❌ Error: " . $e->getMessage() . "\n";
}
