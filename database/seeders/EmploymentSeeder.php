<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\AlumniProfile;
use App\Models\Employment;
use Carbon\Carbon;

class EmploymentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get existing alumni profiles or create some if none exist
        $alumni = AlumniProfile::all();
        
        if ($alumni->isEmpty()) {
            // Create some sample alumni profiles if none exist
            $alumni = $this->createSampleAlumni();
        }

        // Create employment records for alumni
        foreach ($alumni as $alumnus) {
            if ($alumnus->graduation_date) {
                // Some alumni might not have employment records (realistic scenario)
                if (rand(1, 100) <= 85) { // 85% employment rate
                    $this->createEmploymentForAlumnus($alumnus);
                }
            }
        }
    }

    private function createSampleAlumni(): \Illuminate\Database\Eloquent\Collection
    {
        $programs = [
            'Computer Science',
            'Information Technology', 
            'Business Administration',
            'Engineering',
            'Education',
            'Nursing',
            'Marketing',
            'Psychology'
        ];

        $alumni = collect();
        
        // Create alumni for multiple years (2019-2024)
        for ($year = 2019; $year <= 2024; $year++) {
            for ($i = 1; $i <= rand(15, 25); $i++) {
                $graduationDate = Carbon::create($year, rand(5, 6), rand(1, 30));
                
                $alumnus = AlumniProfile::create([
                    'user_id' => null, // For testing purposes
                    'first_name' => 'Test' . $i,
                    'last_name' => 'Alumni' . $year,
                    'student_id' => $year . '000' . str_pad($i, 3, '0', STR_PAD_LEFT),
                    'degree_program' => $programs[array_rand($programs)],
                    'major' => $programs[array_rand($programs)],
                    'graduation_year' => $year,
                    'graduation_date' => $graduationDate,
                    'employment_status' => 'employed',
                    'profile_completed' => true,
                    'profile_completed_at' => now(),
                ]);
                
                $alumni->push($alumnus);
            }
        }

        return $alumni;
    }

    private function createEmploymentForAlumnus(AlumniProfile $alumnus): void
    {
        $companies = [
            'Tech Corp', 'Global Solutions Inc', 'Innovation Labs',
            'Digital Dynamics', 'Future Systems', 'Smart Technologies',
            'DataFlow Systems', 'CloudTech Solutions', 'NextGen Software',
            'Microsoft', 'Google', 'Amazon', 'Meta', 'Apple'
        ];

        $positions = [
            'Software Developer', 'System Analyst', 'Project Manager',
            'Business Analyst', 'Marketing Specialist', 'Sales Representative',
            'Data Analyst', 'IT Support Specialist', 'Network Administrator',
            'Product Manager', 'UX Designer', 'Quality Assurance Engineer'
        ];

        $industries = [
            'Technology', 'Healthcare', 'Finance', 'Education',
            'Manufacturing', 'Retail', 'Consulting', 'Government'
        ];

        // Calculate days after graduation when they got their first job
        // Vary this realistically: some get jobs quickly, others take longer
        $daysAfterGraduation = $this->getRealisticDaysToJob($alumnus->degree_program);
        
        $startDate = $alumnus->graduation_date->addDays($daysAfterGraduation);
        
        // Some positions might have ended, others are current
        $isCurrent = rand(1, 100) <= 60; // 60% still in their first job
        $endDate = $isCurrent ? null : $startDate->copy()->addDays(rand(180, 1095)); // 6 months to 3 years

        Employment::create([
            'alumni_id' => $alumnus->id,
            'company_name' => $companies[array_rand($companies)],
            'position' => $positions[array_rand($positions)],
            'start_date' => $startDate,
            'end_date' => $endDate,
            'is_current' => $isCurrent,
            'salary' => rand(25000, 80000),
            'industry' => $industries[array_rand($industries)],
            'location' => 'Philippines',
            'employment_type' => 'full-time'
        ]);
    }

    private function getRealisticDaysToJob(string $program): int
    {
        // Different programs have different job market realities
        $programMultipliers = [
            'Computer Science' => 0.7,
            'Information Technology' => 0.8,
            'Engineering' => 0.9,
            'Business Administration' => 1.2,
            'Marketing' => 1.4,
            'Education' => 1.6,
            'Psychology' => 1.8,
            'Nursing' => 0.6, // High demand
        ];

        $baseDays = rand(30, 120); // 1-4 months base
        $multiplier = $programMultipliers[$program] ?? 1.0;
        
        return (int) ($baseDays * $multiplier);
    }
}
