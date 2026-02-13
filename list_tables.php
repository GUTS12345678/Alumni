<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== survey_responses columns ===\n";
foreach (Illuminate\Support\Facades\DB::select('DESCRIBE survey_responses') as $c) {
    echo $c->Field . " (" . $c->Type . ") " . ($c->Key ? "KEY:" . $c->Key : "") . "\n";
}
echo "\n=== career_history columns ===\n";
foreach (Illuminate\Support\Facades\DB::select('DESCRIBE career_history') as $c) {
    echo $c->Field . " (" . $c->Type . ") " . ($c->Key ? "KEY:" . $c->Key : "") . "\n";
}
