<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$r = DB::select("SHOW COLUMNS FROM alumni_profiles WHERE Field = 'employment_status'");
echo $r[0]->Type . "\n";
