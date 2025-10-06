<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AnalyticsDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * This seeder populates sample employment and graduation data for analytics testing.
     * It updates existing alumni profiles with graduation dates and job start dates.
     */
    public function run(): void
    {
        // Update existing alumni profiles with graduation dates and job information
        $existingAlumni = DB::table('alumni_profiles')->get();
        
        foreach ($existingAlumni as $alumni) {
            // Set graduation date based on graduation year
            if ($alumni->graduation_year) {
                $graduationDate = Carbon::create($alumni->graduation_year, rand(5, 6), rand(1, 30));
                
                // Set job start date (30-180 days after graduation for employed alumni)
                $jobStartDate = null;
                if (in_array($alumni->employment_status, ['employed_full_time', 'employed_part_time', 'self_employed'])) {
                    $daysAfterGraduation = rand(30, 180);
                    $jobStartDate = $graduationDate->copy()->addDays($daysAfterGraduation);
                }
                
                DB::table('alumni_profiles')
                    ->where('id', $alumni->id)
                    ->update([
                        'graduation_date' => $graduationDate->format('Y-m-d'),
                        'job_start_date' => $jobStartDate ? $jobStartDate->format('Y-m-d') : null,
                        'updated_at' => now()
                    ]);
            }
        }
        
        // Generate sample alumni data for analytics testing (multiple years and programs)
        $programs = [
            'Bachelor of Science In Computer Science',
            'Bachelor of Science in Information Technology',
            'Bachelor of Science in Business Administration',
            'Bachelor of Science in Engineering',
            'Bachelor of Arts in Education',
            'Bachelor of Science in Nursing',
        ];
        
        $employmentStatuses = [
            'employed_full_time',
            'employed_part_time',
            'self_employed',
            'unemployed_seeking',
            'continuing_education',
        ];
        
        $companies = [
            'Tech Solutions Inc',
            'Global Systems Corp',
            'Innovation Labs',
            'Digital Ventures',
            'Enterprise Solutions',
            'Startup Hub',
            'Industry Leaders Co',
        ];
        
        $jobTitles = [
            'Software Developer',
            'Senior Engineer',
            'Data Analyst',
            'Project Manager',
            'Business Analyst',
            'System Administrator',
            'IT Consultant',
        ];
        
        $sampleDataCount = 0;
        
        // Get highest student ID number to avoid conflicts
        $maxStudentId = DB::table('alumni_profiles')
            ->whereRaw("student_id LIKE '224-%'")
            ->max(DB::raw("CAST(SUBSTRING(student_id, 5, 6) AS UNSIGNED)")) ?? 0;
        
        $nextStudentNumber = $maxStudentId + 1;
        
        // Generate sample data for years 2020-2025
        for ($year = 2020; $year <= 2025; $year++) {
            // Generate 15-25 alumni per year
            $alumniCount = rand(15, 25);
            
            for ($i = 0; $i < $alumniCount; $i++) {
                $program = $programs[array_rand($programs)];
                $employmentStatus = $employmentStatuses[array_rand($employmentStatuses)];
                $isEmployed = in_array($employmentStatus, ['employed_full_time', 'employed_part_time', 'self_employed']);
                
                // Set graduation date
                $graduationDate = Carbon::create($year, rand(5, 6), rand(1, 28));
                
                // Set job start date for employed alumni (varying by year and program)
                $jobStartDate = null;
                if ($isEmployed) {
                    // Vary time-to-job based on year (showing improvement trend)
                    $baseDays = 120; // Base: 4 months
                    $yearFactor = (2025 - $year) * 10; // Earlier years took longer
                    
                    // Program-specific variations
                    $programFactor = 0;
                    if (str_contains($program, 'Computer Science') || str_contains($program, 'Information Technology')) {
                        $programFactor = -20; // Tech grads find jobs faster
                    } elseif (str_contains($program, 'Engineering')) {
                        $programFactor = -10;
                    } elseif (str_contains($program, 'Education')) {
                        $programFactor = 15; // Takes slightly longer
                    }
                    
                    $daysAfterGraduation = max(30, $baseDays + $yearFactor + $programFactor + rand(-30, 30));
                    $jobStartDate = $graduationDate->copy()->addDays($daysAfterGraduation);
                }
                
                // Check if user exists for this alumni (to avoid foreign key issues)
                // For sample data, we'll create without user_id or use existing users
                $userId = DB::table('users')->where('role', 'alumni')->inRandomOrder()->value('id');
                
                DB::table('alumni_profiles')->insert([
                    'user_id' => $userId,
                    'batch_id' => DB::table('batches')->where('graduation_year', $year)->value('id'),
                    'first_name' => 'Sample',
                    'last_name' => 'Alumni' . $nextStudentNumber,
                    'student_id' => '224-' . str_pad($nextStudentNumber, 6, '0', STR_PAD_LEFT) . 'M',
                    'birth_date' => Carbon::create($year - 22, rand(1, 12), rand(1, 28))->format('Y-m-d'),
                    'gender' => rand(0, 1) ? 'male' : 'female',
                    'phone' => '09' . rand(100000000, 999999999),
                    'current_address' => 'Sample Address ' . $nextStudentNumber,
                    'city' => 'Sample City',
                    'country' => 'Philippines',
                    'degree_program' => $program,
                    'major' => 'N/A',
                    'gpa' => round(rand(150, 400) / 100, 2),
                    'graduation_year' => $year,
                    'graduation_date' => $graduationDate->format('Y-m-d'),
                    'employment_status' => $employmentStatus,
                    'current_job_title' => $isEmployed ? $jobTitles[array_rand($jobTitles)] : null,
                    'current_employer' => $isEmployed ? $companies[array_rand($companies)] : null,
                    'current_salary' => $isEmployed ? rand(30000, 150000) : null,
                    'salary_currency' => 'USD', // Set default for all
                    'job_start_date' => $jobStartDate ? $jobStartDate->format('Y-m-d') : null,
                    'profile_completed' => 1,
                    'profile_completed_at' => $graduationDate->copy()->addDays(rand(1, 60)),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                
                $nextStudentNumber++;
                $sampleDataCount++;
            }
        }
        
        $this->command->info("✅ Updated {$existingAlumni->count()} existing alumni profiles with dates");
        $this->command->info("✅ Created {$sampleDataCount} sample alumni profiles for analytics");
        $this->command->info("📊 Total employment records: " . DB::table('alumni_profiles')->whereIn('employment_status', ['employed_full_time', 'employed_part_time', 'self_employed'])->count());
    }
}
