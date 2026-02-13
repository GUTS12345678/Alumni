<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$controller = new App\Http\Controllers\Api\V1\Admin\AnalyticsController();
$request = new Illuminate\Http\Request();
$response = $controller->getTimeToJobAnalytics($request);
$data = json_decode($response->getContent(), true);

echo "Program breakdown per year:\n";
foreach ($data['data']['yearly_data'] as $year) {
    echo $year['graduation_year'] . ': ' . count($year['program_breakdown']) . " programs\n";
}
