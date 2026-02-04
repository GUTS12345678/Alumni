<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CaviteCampusInfrastructureSeeder extends Seeder
{
    /**
     * Create departments, courses, and batches for Cavite Campus
     * Run this BEFORE seeding alumni data
     */
    public function run(): void
    {
        echo "\n╔══════════════════════════════════════════════════════════════╗\n";
        echo "║      CAVITE CAMPUS INFRASTRUCTURE SETUP                     ║\n";
        echo "╚══════════════════════════════════════════════════════════════╝\n\n";

        // 1. Create Departments for Cavite Campus
        echo "⏳ Creating departments for Cavite Campus...\n";
        
        $departments = [
            ['name' => 'College of Engineering', 'code' => 'COE-CAV', 'campus_id' => 2],
            ['name' => 'College of Computer Studies', 'code' => 'CCS-CAV', 'campus_id' => 2],
            ['name' => 'College of Business Administration', 'code' => 'CBA-CAV', 'campus_id' => 2],
            ['name' => 'College of Industrial Education', 'code' => 'CIE-CAV', 'campus_id' => 2],
            ['name' => 'College of Science', 'code' => 'CS-CAV', 'campus_id' => 2],
        ];

        foreach ($departments as $dept) {
            DB::table('departments')->insert([
                'name' => $dept['name'],
                'code' => $dept['code'],
                'campus_id' => $dept['campus_id'],
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
        
        echo "✅ Created " . count($departments) . " departments\n\n";

        // 2. Get department IDs
        $coeDeptId = DB::table('departments')->where('code', 'COE-CAV')->value('id');
        $ccsDeptId = DB::table('departments')->where('code', 'CCS-CAV')->value('id');
        $cbaDeptId = DB::table('departments')->where('code', 'CBA-CAV')->value('id');
        $cieDeptId = DB::table('departments')->where('code', 'CIE-CAV')->value('id');
        $csDeptId = DB::table('departments')->where('code', 'CS-CAV')->value('id');

        // 3. Create Courses for Cavite Campus
        echo "⏳ Creating courses for Cavite Campus...\n";
        
        $courses = [
            // CCS Courses
            ['name' => 'Bachelor of Science in Computer Science', 'code' => 'BSCS-CAV', 'department_id' => $ccsDeptId, 'campus_id' => 2],
            ['name' => 'Bachelor of Science in Information Technology', 'code' => 'BSIT-CAV', 'department_id' => $ccsDeptId, 'campus_id' => 2],
            ['name' => 'Bachelor of Science in Computer Engineering', 'code' => 'BSCpE-CAV', 'department_id' => $ccsDeptId, 'campus_id' => 2],
            
            // COE Courses
            ['name' => 'Bachelor of Science in Civil Engineering', 'code' => 'BSCE-CAV', 'department_id' => $coeDeptId, 'campus_id' => 2],
            ['name' => 'Bachelor of Science in Mechanical Engineering', 'code' => 'BSME-CAV', 'department_id' => $coeDeptId, 'campus_id' => 2],
            ['name' => 'Bachelor of Science in Electrical Engineering', 'code' => 'BSEE-CAV', 'department_id' => $coeDeptId, 'campus_id' => 2],
            ['name' => 'Bachelor of Science in Electronics Engineering', 'code' => 'BSEcE-CAV', 'department_id' => $coeDeptId, 'campus_id' => 2],
            
            // CBA Courses
            ['name' => 'Bachelor of Science in Business Administration', 'code' => 'BSBA-CAV', 'department_id' => $cbaDeptId, 'campus_id' => 2],
            ['name' => 'Bachelor of Science in Accountancy', 'code' => 'BSA-CAV', 'department_id' => $cbaDeptId, 'campus_id' => 2],
            ['name' => 'Bachelor of Science in Entrepreneurship', 'code' => 'BSEntrep-CAV', 'department_id' => $cbaDeptId, 'campus_id' => 2],
            
            // CIE Courses
            ['name' => 'Bachelor of Science in Industrial Technology', 'code' => 'BSIT-Ind-CAV', 'department_id' => $cieDeptId, 'campus_id' => 2],
            ['name' => 'Bachelor of Technical Teacher Education', 'code' => 'BTTE-CAV', 'department_id' => $cieDeptId, 'campus_id' => 2],
            
            // CS Courses
            ['name' => 'Bachelor of Science in Applied Mathematics', 'code' => 'BSAM-CAV', 'department_id' => $csDeptId, 'campus_id' => 2],
            ['name' => 'Bachelor of Science in Statistics', 'code' => 'BSStat-CAV', 'department_id' => $csDeptId, 'campus_id' => 2],
        ];

        foreach ($courses as $course) {
            DB::table('courses')->insert([
                'name' => $course['name'],
                'code' => $course['code'],
                'department_id' => $course['department_id'],
                'campus_id' => $course['campus_id'],
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
        
        echo "✅ Created " . count($courses) . " courses\n\n";

        // 4. Create Batches for Cavite Campus
        echo "⏳ Creating batches for Cavite Campus...\n";
        
        $batches = [
            ['name' => 'Class of 2018 - Cavite', 'graduation_year' => 2018, 'campus_id' => 2],
            ['name' => 'Class of 2019 - Cavite', 'graduation_year' => 2019, 'campus_id' => 2],
            ['name' => 'Class of 2020 - Cavite', 'graduation_year' => 2020, 'campus_id' => 2],
            ['name' => 'Class of 2021 - Cavite', 'graduation_year' => 2021, 'campus_id' => 2],
            ['name' => 'Class of 2022 - Cavite', 'graduation_year' => 2022, 'campus_id' => 2],
            ['name' => 'Class of 2023 - Cavite', 'graduation_year' => 2023, 'campus_id' => 2],
            ['name' => 'Class of 2024 - Cavite', 'graduation_year' => 2024, 'campus_id' => 2],
        ];

        foreach ($batches as $batch) {
            DB::table('batches')->insert([
                'name' => $batch['name'],
                'graduation_year' => $batch['graduation_year'],
                'campus_id' => $batch['campus_id'],
                'status' => 'active',
                'description' => 'Cavite Campus - ' . $batch['name'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
        
        echo "✅ Created " . count($batches) . " batches\n\n";

        // 5. Also ensure Main Campus has proper batches (if missing)
        echo "⏳ Ensuring Main Campus has batches...\n";
        
        $mainBatches = [
            ['name' => 'Class of 2018 - Main', 'graduation_year' => 2018, 'campus_id' => 1],
            ['name' => 'Class of 2019 - Main', 'graduation_year' => 2019, 'campus_id' => 1],
            ['name' => 'Class of 2020 - Main', 'graduation_year' => 2020, 'campus_id' => 1],
            ['name' => 'Class of 2021 - Main', 'graduation_year' => 2021, 'campus_id' => 1],
            ['name' => 'Class of 2022 - Main', 'graduation_year' => 2022, 'campus_id' => 1],
            ['name' => 'Class of 2023 - Main', 'graduation_year' => 2023, 'campus_id' => 1],
            ['name' => 'Class of 2024 - Main', 'graduation_year' => 2024, 'campus_id' => 1],
        ];

        foreach ($mainBatches as $batch) {
            $exists = DB::table('batches')
                ->where('campus_id', 1)
                ->where('graduation_year', $batch['graduation_year'])
                ->exists();
            
            if (!$exists) {
                DB::table('batches')->insert([
                    'name' => $batch['name'],
                    'graduation_year' => $batch['graduation_year'],
                    'campus_id' => $batch['campus_id'],
                    'status' => 'active',
                    'description' => 'Main Campus - ' . $batch['name'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
        
        echo "✅ Main Campus batches verified\n\n";

        // Summary
        echo "╔══════════════════════════════════════════════════════════════╗\n";
        echo "║            INFRASTRUCTURE SETUP COMPLETE                     ║\n";
        echo "╚══════════════════════════════════════════════════════════════╝\n\n";

        $totalDepts = DB::table('departments')->count();
        $totalCourses = DB::table('courses')->count();
        $totalBatches = DB::table('batches')->count();

        echo "System Summary:\n";
        echo "- Total Departments: {$totalDepts}\n";
        echo "- Total Courses: {$totalCourses}\n";
        echo "- Total Batches: {$totalBatches}\n\n";

        echo "Cavite Campus:\n";
        echo "- Departments: " . DB::table('departments')->where('campus_id', 2)->count() . "\n";
        echo "- Courses: " . DB::table('courses')->where('campus_id', 2)->count() . "\n";
        echo "- Batches: " . DB::table('batches')->where('campus_id', 2)->count() . "\n\n";

        echo "✅ Ready for alumni data seeding!\n\n";
    }
}
