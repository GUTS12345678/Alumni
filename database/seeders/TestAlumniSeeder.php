<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\AlumniProfile;
use App\Models\Department;
use App\Models\Course;
use App\Models\Batch;
use Carbon\Carbon;

class TestAlumniSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Creates test alumni with realistic employment data for analytics testing.
     */
    public function run(): void
    {
        // Get first available department, course, and batch
        $department = Department::first();
        $course = Course::where('department_id', $department->id)->first();
        $batch = Batch::first();

        if (!$department || !$course || !$batch) {
            $this->command->error('Please ensure at least one department, course, and batch exist before running this seeder.');
            return;
        }

        $this->command->info("Creating test alumni for {$department->name} - {$course->name}");

        // Define realistic test data
        $employmentStatuses = [
            'employed_full_time' => 7,  // 70% employed full-time
            'employed_part_time' => 1,  // 10% part-time
            'self_employed' => 1,       // 10% self-employed
            'unemployed_seeking' => 1,  // 10% unemployed seeking
        ];

        $salaryRanges = [
            'below_15k', '15k_25k', '25k_35k', '35k_50k', 
            '50k_75k', '75k_100k', 'above_100k'
        ];

        $careerFields = [
            'information_technology', 'education', 'business_management',
            'healthcare', 'engineering', 'government', 'finance'
        ];

        $companies = [
            'Accenture Philippines', 'Smart Communications', 'Ayala Corporation',
            'BDO Unibank', 'Jollibee Foods Corporation', 'SM Investments',
            'Globe Telecom', 'San Miguel Corporation', 'Self-Employed', 'Government Agency'
        ];

        $count = 0;
        $graduationDate = Carbon::now()->subYears(2); // Graduated 2 years ago

        // Create alumni based on employment distribution
        foreach ($employmentStatuses as $status => $quantity) {
            for ($i = 0; $i < $quantity; $i++) {
                $count++;
                
                // Calculate job start date (1-12 months after graduation for employed)
                $jobStartDate = null;
                $employer = null;
                $salary = null;
                $field = null;
                $jobTitle = null;

                if (str_contains($status, 'employed') || $status === 'self_employed') {
                    $monthsToEmployment = rand(1, 12);
                    $jobStartDate = $graduationDate->copy()->addMonths($monthsToEmployment);
                    $employer = $companies[array_rand($companies)];
                    $salary = $salaryRanges[array_rand($salaryRanges)];
                    $field = $careerFields[array_rand($careerFields)];
                    $jobTitle = $status === 'employed_full_time' ? 'Software Developer' : 
                               ($status === 'employed_part_time' ? 'Junior Developer' : 
                               ($status === 'self_employed' ? 'Freelance Consultant' : null));
                }

                AlumniProfile::create([
                    'department_id' => $department->id,
                    'course_id' => $course->id,
                    'batch_id' => $batch->id,
                    'first_name' => 'TestAlumni' . $count,
                    'last_name' => 'User',
                    'middle_name' => 'Sample',
                    'phone' => '09' . str_pad(rand(100000000, 999999999), 9, '0', STR_PAD_LEFT),
                    'graduation_date' => $graduationDate,
                    'employment_status' => $status,
                    'current_employer' => $employer,
                    'current_job_title' => $jobTitle,
                    'job_start_date' => $jobStartDate,
                    'salary_range' => $salary,
                    'career_field' => $field,
                    'willing_to_mentor' => rand(0, 1) === 1,
                    'survey_participation_count' => rand(0, 3),
                    'profile_completed_at' => Carbon::now()->subDays(rand(1, 30)),
                    'last_profile_update' => Carbon::now()->subDays(rand(1, 7)),
                ]);
            }
        }

        $this->command->info("✅ Successfully created {$count} test alumni profiles");
        $this->command->info("   Department: {$department->name}");
        $this->command->info("   Course: {$course->name}");
        $this->command->info("   Employment Rate: 90% (9 employed / 10 total)");
    }
}
