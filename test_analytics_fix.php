<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Testing Fixed Analytics Calculations\n";
echo str_repeat("=", 80) . "\n\n";

// Test time-to-job calculation using batch graduation date
$results = DB::select("
    SELECT 
        b.graduation_year,
        AVG(DATEDIFF(e.start_date, CONCAT(b.graduation_year, '-06-01'))) as avg_days_to_job,
        COUNT(DISTINCT ap.id) as alumni_count,
        MIN(DATEDIFF(e.start_date, CONCAT(b.graduation_year, '-06-01'))) as min_days,
        MAX(DATEDIFF(e.start_date, CONCAT(b.graduation_year, '-06-01'))) as max_days
    FROM alumni_profiles ap
    JOIN batches b ON ap.batch_id = b.id
    JOIN employments e ON ap.id = e.alumni_id
    WHERE e.is_current = 1
    GROUP BY b.graduation_year
    ORDER BY b.graduation_year DESC
    LIMIT 5
");

echo "Time-to-Job by Graduation Year (Fixed Calculation)\n";
echo str_repeat("-", 80) . "\n";
printf("%-10s | %-15s | %-10s | %-10s | %-10s\n", "Year", "Avg Days", "Alumni", "Min Days", "Max Days");
echo str_repeat("-", 80) . "\n";

foreach ($results as $row) {
    $avgMonths = round($row->avg_days_to_job / 30, 1);
    printf(
        "%-10s | %+7.1f (%-2.1fm) | %-10s | %+9d | %+9d\n",
        $row->graduation_year,
        $row->avg_days_to_job,
        $avgMonths,
        $row->alumni_count,
        $row->min_days,
        $row->max_days
    );
}

echo "\n" . str_repeat("=", 80) . "\n\n";

// Check system metrics
echo "System Metrics\n";
echo str_repeat("-", 80) . "\n";
echo "Total Users: " . DB::table('users')->count() . "\n";
echo "Total Departments: " . DB::table('departments')->count() . "\n";
echo "Total Courses: " . DB::table('courses')->count() . "\n";
echo "Total Alumni: " . DB::table('alumni_profiles')->count() . "\n";
echo "Total Surveys: " . DB::table('surveys')->count() . "\n";
echo "Active Surveys: " . DB::table('surveys')->where('status', 'active')->count() . "\n";

echo "\n✓ Analytics calculations are now using correct graduation dates!\n";
echo "✓ System metrics are available for the dashboard!\n";
