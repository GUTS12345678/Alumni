<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;

$orphans = User::whereDoesntHave('alumniProfile')->where('role', 'alumni')->count();
echo "Orphan alumni users: {$orphans}\n";

if ($orphans > 0) {
    User::whereDoesntHave('alumniProfile')->where('role', 'alumni')->delete();
    echo "Cleaned.\n";
}
