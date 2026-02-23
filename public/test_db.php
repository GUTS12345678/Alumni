<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Default connection: " . config('database.default') . "\n";
echo "Cache store: " . config('cache.default') . "\n";

try {
    $pdo = DB::connection('mysql')->getPdo();
    echo "MySQL connection: OK\n";
    echo "DB name: " . $pdo->query("SELECT DATABASE()")->fetchColumn() . "\n";
} catch (\Exception $e) {
    echo "MySQL FAILED: " . $e->getMessage() . "\n";
}

try {
    Cache::store('database')->put('test_web', 'works', 60);
    echo "Cache write: " . Cache::store('database')->get('test_web') . "\n";
} catch (\Exception $e) {
    echo "Cache FAILED: " . $e->getMessage() . "\n";
}
