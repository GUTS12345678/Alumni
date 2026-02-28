<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

$col = DB::select("SHOW COLUMNS FROM alumni_profiles WHERE Field = 'current_salary'");
echo "current_salary: {$col[0]->Type}\n";
