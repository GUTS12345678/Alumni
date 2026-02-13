<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$slow = Illuminate\Support\Facades\DB::select("SHOW VARIABLES LIKE 'slow_query_log'");
$thresh = Illuminate\Support\Facades\DB::select("SHOW VARIABLES LIKE 'long_query_time'");
$noIdx = Illuminate\Support\Facades\DB::select("SHOW VARIABLES LIKE 'log_queries_not_using_indexes'");

echo "slow_query_log:             " . ($slow[0]->Value ?? 'N/A') . "\n";
echo "long_query_time:            " . ($thresh[0]->Value ?? 'N/A') . "\n";
echo "log_queries_not_using_idx:  " . ($noIdx[0]->Value ?? 'N/A') . "\n";
