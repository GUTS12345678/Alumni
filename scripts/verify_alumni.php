<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\AlumniProfile;
use App\Models\User;

$totalAlumni = AlumniProfile::count();
$totalAlumniUsers = User::where('role', 'alumni')->count();

echo "Total alumni profiles: {$totalAlumni}\n";
echo "Total alumni users: {$totalAlumniUsers}\n\n";

// By campus
$byCampus = AlumniProfile::selectRaw('campus_id, COUNT(*) as cnt')->groupBy('campus_id')->get();
echo "By campus:\n";
foreach ($byCampus as $row) {
    echo "  Campus {$row->campus_id}: {$row->cnt}\n";
}

// By employment status
echo "\nBy employment status:\n";
$byStatus = AlumniProfile::selectRaw('employment_status, COUNT(*) as cnt')->groupBy('employment_status')->orderByDesc('cnt')->get();
foreach ($byStatus as $row) {
    echo "  {$row->employment_status}: {$row->cnt}\n";
}

// By graduation year
echo "\nBy graduation year:\n";
$byYear = AlumniProfile::selectRaw('graduation_year, COUNT(*) as cnt')->groupBy('graduation_year')->orderBy('graduation_year')->get();
foreach ($byYear as $row) {
    echo "  {$row->graduation_year}: {$row->cnt}\n";
}

// Salary range distribution (employed only)
echo "\nSalary range (employed):\n";
$bySalary = AlumniProfile::whereNotNull('salary_range')->selectRaw('salary_range, COUNT(*) as cnt')->groupBy('salary_range')->orderByDesc('cnt')->get();
foreach ($bySalary as $row) {
    echo "  {$row->salary_range}: {$row->cnt}\n";
}

echo "\nOrphans (users without profile): " . User::where('role', 'alumni')->whereDoesntHave('alumniProfile')->count() . "\n";
