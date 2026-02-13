<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Http\Controllers\Api\AdminController;
use Illuminate\Http\Request;

$controller = app()->make(AdminController::class);
$response = $controller->dashboard(new Request());
$data = json_decode($response->getContent(), true)['data'];

echo "═══════════════════════════════════════════════════════\n";
echo "  DASHBOARD API VERIFICATION\n";
echo "═══════════════════════════════════════════════════════\n\n";

echo "Employment Rate: {$data['employment_metrics']['employment_rate']}%\n";
echo "Total Employed: {$data['employment_metrics']['total_employed']}\n";
echo "Avg Days to Job: {$data['employment_metrics']['avg_days_to_job']} (" . round($data['employment_metrics']['avg_days_to_job'] / 30, 1) . " months)\n";
echo "Job Alignment: {$data['employment_metrics']['job_alignment_rate']}%\n";
echo "Aligned Count: {$data['employment_metrics']['aligned_jobs_count']}\n\n";

echo "Mismatch Stats:\n";
foreach ($data['mismatch_stats'] as $k => $v) {
    echo "  $k: $v\n";
}

echo "\nLocation Stats:\n";
foreach ($data['employment_location_stats'] as $k => $v) {
    echo "  $k: $v\n";
}

echo "\nUnemployment Stats:\n";
foreach ($data['unemployment_stats'] as $k => $v) {
    echo "  $k: $v\n";
}

echo "\nOverview:\n";
echo "  Total Alumni: {$data['overview']['total_alumni']}\n";
echo "  Total Surveys: {$data['overview']['total_surveys']}\n";
echo "\n═══════════════════════════════════════════════════════\n";
