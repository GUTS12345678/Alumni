<?php
require_once __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$cols = ['salary_range', 'unemployment_reason', 'employment_location_type', 'job_mismatch_reason', 'employment_status'];
foreach ($cols as $col) {
    $info = Illuminate\Support\Facades\DB::select("SHOW COLUMNS FROM alumni_profiles WHERE Field='{$col}'");
    if ($info) {
        echo "{$col}: {$info[0]->Type}\n";
    } else {
        echo "{$col}: NOT FOUND\n";
    }
}
