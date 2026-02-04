<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Campus;
use App\Models\Department;
use App\Models\Course;
use App\Models\Batch;

class CaviteCampusDataSeeder extends Seeder
{
    /**
     * Seed data for Cavite Campus - departments, courses, and batches.
     * This seeder creates the necessary academic structure for the Cavite campus
     * to enable proper campus filtering and analytics.
     */
    public function run(): void
    {
        $this->command->info('Seeding Cavite Campus data...');

        // Get Cavite campus - create if not exists
        $caviteCampus = Campus::firstOrCreate(
            ['code' => 'CAV'],
            [
                'name' => 'EARIST Cavite Campus',
                'display_name' => 'Cavite Campus',
                'address' => 'Rosario, Cavite',
                'contact_email' => 'cavite@earist.edu.ph',
                'contact_phone' => '+63 46 123 4567',
                'is_active' => true,
            ]
        );

        $this->command->info("Using campus: {$caviteCampus->display_name} (ID: {$caviteCampus->id})");

        // Seed Departments for Cavite Campus
        $departments = $this->seedDepartments($caviteCampus->id);
        
        // Seed Courses for each department
        $this->seedCourses($departments, $caviteCampus->id);
        
        // Seed Batches for Cavite Campus
        $this->seedBatches($caviteCampus->id);

        $this->command->info('Cavite Campus data seeding completed!');
    }

    /**
     * Seed departments for Cavite campus
     */
    private function seedDepartments(int $campusId): array
    {
        $departmentsData = [
            [
                'name' => 'College of Engineering - Cavite',
                'code' => 'COE-CAV',
                'description' => 'Engineering programs at Cavite Campus',
                'status' => 'active',
            ],
            [
                'name' => 'College of Industrial Technology - Cavite',
                'code' => 'CIT-CAV',
                'description' => 'Industrial Technology programs at Cavite Campus',
                'status' => 'active',
            ],
            [
                'name' => 'College of Business Administration - Cavite',
                'code' => 'CBA-CAV',
                'description' => 'Business Administration programs at Cavite Campus',
                'status' => 'active',
            ],
            [
                'name' => 'College of Arts and Sciences - Cavite',
                'code' => 'CAS-CAV',
                'description' => 'Arts and Sciences programs at Cavite Campus',
                'status' => 'active',
            ],
            [
                'name' => 'College of Education - Cavite',
                'code' => 'CED-CAV',
                'description' => 'Education programs at Cavite Campus',
                'status' => 'active',
            ],
        ];

        $departments = [];
        foreach ($departmentsData as $deptData) {
            $department = Department::firstOrCreate(
                ['code' => $deptData['code'], 'campus_id' => $campusId],
                array_merge($deptData, ['campus_id' => $campusId])
            );
            $departments[$deptData['code']] = $department;
            $this->command->info("  Created/Found department: {$department->name}");
        }

        return $departments;
    }

    /**
     * Seed courses for each department
     */
    private function seedCourses(array $departments, int $campusId): void
    {
        $coursesData = [
            'COE-CAV' => [
                ['code' => 'BSEE-CAV', 'name' => 'BS Electrical Engineering', 'duration_years' => 5],
                ['code' => 'BSME-CAV', 'name' => 'BS Mechanical Engineering', 'duration_years' => 5],
                ['code' => 'BSCE-CAV', 'name' => 'BS Civil Engineering', 'duration_years' => 5],
                ['code' => 'BSECE-CAV', 'name' => 'BS Electronics Engineering', 'duration_years' => 5],
                ['code' => 'BSCPE-CAV', 'name' => 'BS Computer Engineering', 'duration_years' => 5],
            ],
            'CIT-CAV' => [
                ['code' => 'BSIT-CAV', 'name' => 'BS Information Technology', 'duration_years' => 4],
                ['code' => 'BSCS-CAV', 'name' => 'BS Computer Science', 'duration_years' => 4],
                ['code' => 'BSFT-CAV', 'name' => 'BS Food Technology', 'duration_years' => 4],
                ['code' => 'BSIET-CAV', 'name' => 'BS Industrial Engineering Technology', 'duration_years' => 4],
                ['code' => 'BSEET-CAV', 'name' => 'BS Electrical Engineering Technology', 'duration_years' => 4],
                ['code' => 'BSMET-CAV', 'name' => 'BS Mechanical Engineering Technology', 'duration_years' => 4],
            ],
            'CBA-CAV' => [
                ['code' => 'BSBA-FM-CAV', 'name' => 'BS Business Administration - Financial Management', 'duration_years' => 4],
                ['code' => 'BSBA-MM-CAV', 'name' => 'BS Business Administration - Marketing Management', 'duration_years' => 4],
                ['code' => 'BSBA-HRM-CAV', 'name' => 'BS Business Administration - Human Resource Management', 'duration_years' => 4],
                ['code' => 'BSOA-CAV', 'name' => 'BS Office Administration', 'duration_years' => 4],
                ['code' => 'BSA-CAV', 'name' => 'BS Accountancy', 'duration_years' => 5],
            ],
            'CAS-CAV' => [
                ['code' => 'BSMATH-CAV', 'name' => 'BS Mathematics', 'duration_years' => 4],
                ['code' => 'BSPHY-CAV', 'name' => 'BS Physics', 'duration_years' => 4],
                ['code' => 'BSCHEM-CAV', 'name' => 'BS Chemistry', 'duration_years' => 4],
                ['code' => 'BSBIO-CAV', 'name' => 'BS Biology', 'duration_years' => 4],
                ['code' => 'ABENG-CAV', 'name' => 'AB English', 'duration_years' => 4],
                ['code' => 'ABCOMM-CAV', 'name' => 'AB Communication', 'duration_years' => 4],
            ],
            'CED-CAV' => [
                ['code' => 'BSED-ENG-CAV', 'name' => 'BS Secondary Education - English', 'duration_years' => 4],
                ['code' => 'BSED-MATH-CAV', 'name' => 'BS Secondary Education - Mathematics', 'duration_years' => 4],
                ['code' => 'BSED-SCI-CAV', 'name' => 'BS Secondary Education - Science', 'duration_years' => 4],
                ['code' => 'BEED-CAV', 'name' => 'BS Elementary Education', 'duration_years' => 4],
            ],
        ];

        foreach ($coursesData as $deptCode => $courses) {
            if (!isset($departments[$deptCode])) {
                continue;
            }
            
            $department = $departments[$deptCode];
            
            foreach ($courses as $courseData) {
                Course::firstOrCreate(
                    ['code' => $courseData['code'], 'campus_id' => $campusId],
                    [
                        'department_id' => $department->id,
                        'name' => $courseData['name'],
                        'code' => $courseData['code'],
                        'description' => "{$courseData['name']} program at Cavite Campus",
                        'duration_years' => $courseData['duration_years'],
                        'status' => 'active',
                        'campus_id' => $campusId,
                    ]
                );
            }
            
            $this->command->info("  Created courses for {$department->name}");
        }
    }

    /**
     * Seed graduation batches for Cavite campus
     */
    private function seedBatches(int $campusId): void
    {
        $currentYear = (int) date('Y');
        $batchesData = [];

        // Create batches from 2015 to current year + 2 (for upcoming graduates)
        for ($year = 2015; $year <= $currentYear + 2; $year++) {
            $batchesData[] = [
                'name' => "Cavite Class of {$year}",
                'graduation_year' => $year,
                'description' => "Cavite Campus graduates of {$year}",
                'status' => $year > $currentYear ? 'inactive' : 'active',
            ];
        }

        foreach ($batchesData as $batchData) {
            Batch::firstOrCreate(
                [
                    'graduation_year' => $batchData['graduation_year'],
                    'campus_id' => $campusId,
                ],
                array_merge($batchData, ['campus_id' => $campusId])
            );
        }

        $this->command->info("  Created " . count($batchesData) . " batches for Cavite Campus");
    }
}
