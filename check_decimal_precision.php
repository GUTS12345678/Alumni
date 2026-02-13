<?php

require __DIR__ . '/vendor/autoload.php';

use Illuminate\Support\Facades\DB;

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "\n";
echo "═══════════════════════════════════════════════════════════════\n";
echo "  DECIMAL PRECISION & ROUNDING CONSISTENCY CHECK\n";
echo "═══════════════════════════════════════════════════════════════\n\n";

$totalAlumni = 548;
$totalEmployed = 486;
$goodMatch = 41;
$employedWithin2Years = 486;

// Check different rounding approaches
echo "━━━ Employment Rate ━━━\n";
$empRate1 = round(($totalEmployed / $totalAlumni) * 100, 1);
$empRate2 = round(($totalEmployed / $totalAlumni) * 100, 2);
echo "1 decimal: {$empRate1}%\n";
echo "2 decimals: {$empRate2}%\n";
echo "Difference: " . abs($empRate1 - $empRate2) . "\n";
echo ($empRate1 != $empRate2 ? "⚠ INCONSISTENT - Use uniform precision\n" : "✓ CONSISTENT\n");
echo "\n";

echo "━━━ Performance Rate ━━━\n";
$perfRate1 = round(($employedWithin2Years / $totalAlumni) * 100, 1);
$perfRate2 = round(($employedWithin2Years / $totalAlumni) * 100, 2);
echo "1 decimal: {$perfRate1}%\n";
echo "2 decimals: {$perfRate2}%\n";
echo "Difference: " . abs($perfRate1 - $perfRate2) . "\n";
echo ($perfRate1 != $perfRate2 ? "⚠ INCONSISTENT - Use uniform precision\n" : "✓ CONSISTENT\n");
echo "\n";

echo "━━━ Job Alignment Rate ━━━\n";
$alignRate1 = round(($goodMatch / $totalEmployed) * 100, 1);
$alignRate2 = round(($goodMatch / $totalEmployed) * 100, 2);
echo "1 decimal: {$alignRate1}%\n";
echo "2 decimals: {$alignRate2}%\n";
echo "Difference: " . abs($alignRate1 - $alignRate2) . "\n";
echo ($alignRate1 != $alignRate2 ? "⚠ INCONSISTENT - Use uniform precision\n" : "✓ CONSISTENT\n");
echo "\n";

echo "═══════════════════════════════════════════════════════════════\n";
echo "  PRECISION RECOMMENDATIONS\n";
echo "═══════════════════════════════════════════════════════════════\n\n";

echo "Current Backend Precision:\n";
echo "  - AdminController (Dashboard): Uses 2 decimals for job_alignment_rate\n";
echo "  - AnalyticsController: Uses 1 decimal for alignment_rate\n";
echo "\n";

echo "Current Frontend Precision:\n";
echo "  - Dashboard: Uses .toFixed(1) → displays 1 decimal\n";
echo "  - Analytics: Uses raw value → depends on backend\n";
echo "\n";

if ($alignRate1 != $alignRate2) {
    echo "⚠ RECOMMENDATION:\n";
    echo "  Issue: AdminController returns 8.44%, AnalyticsController returns 8.4%\n";
    echo "  Solution: Standardize to 1 decimal place across all APIs\n";
    echo "\n";
    echo "  Change AdminController line ~223:\n";
    echo "    FROM: round((\$alignedJobs / \$totalEmployed) * 100, 2)\n";
    echo "    TO:   round((\$alignedJobs / \$totalEmployed) * 100, 1)\n";
    echo "\n";
    echo "  This will make:\n";
    echo "    - Dashboard API: 8.4%\n";
    echo "    - Analytics API: 8.4%\n";
    echo "    - Frontend display: 8.4%\n";
} else {
    echo "✓ All calculations use consistent precision\n";
}

echo "\n";
