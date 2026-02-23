<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$cols = \Illuminate\Support\Facades\Schema::getColumnListing('alumni_profiles');
sort($cols);
echo implode("\n", $cols) . "\n";
