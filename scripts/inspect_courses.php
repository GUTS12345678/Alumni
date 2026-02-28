<?php
require_once __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Course;
use App\Models\Batch;
use App\Models\Department;

// Get all courses with departments
$courses = Course::with('department:id,name,campus_id')->get();
echo "Total courses: " . $courses->count() . "\n";

// Group by campus
$mainCourses = $courses->filter(fn($c) => $c->department && $c->department->campus_id == 1);
$cavCourses = $courses->filter(fn($c) => $c->department && $c->department->campus_id == 2);
echo "Main campus courses: " . $mainCourses->count() . "\n";
echo "Cavite campus courses: " . $cavCourses->count() . "\n";

echo "\n=== MAIN CAMPUS COURSES (unique names) ===\n";
$seen = [];
foreach ($mainCourses as $c) {
    $key = $c->name . '|' . $c->department->id;
    if (!isset($seen[$key])) {
        echo "  ID:{$c->id} - {$c->name} (Dept: {$c->department->name})\n";
        $seen[$key] = true;
    }
}

echo "\n=== CAVITE CAMPUS COURSES ===\n";
$seen = [];
foreach ($cavCourses as $c) {
    $key = $c->name . '|' . $c->department->id;
    if (!isset($seen[$key])) {
        echo "  ID:{$c->id} - {$c->name} (Dept: {$c->department->name})\n";
        $seen[$key] = true;
    }
}

// Get Cavite departments
echo "\n=== CAVITE DEPARTMENTS ===\n";
$cavDepts = Department::where('campus_id', 2)->get();
foreach ($cavDepts as $d) {
    echo "  ID:{$d->id} - {$d->name}\n";
    $dCourses = Course::where('department_id', $d->id)->get();
    foreach ($dCourses as $c) {
        echo "    Course ID:{$c->id} - {$c->name}\n";
    }
}

// Count existing alumni (should be 0 after clear)
echo "\n=== CURRENT STATE ===\n";
echo "Alumni profiles: " . \App\Models\AlumniProfile::count() . "\n";
echo "Users with alumni role: " . \App\Models\User::where('role', 'alumni')->count() . "\n";

// AlumniProfile fillable fields
echo "\n=== FILLABLE FIELDS ===\n";
$fillable = (new \App\Models\AlumniProfile())->getFillable();
echo implode(', ', $fillable) . "\n";
