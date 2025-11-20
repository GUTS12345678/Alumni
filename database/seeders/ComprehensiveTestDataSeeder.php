<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Department;
use App\Models\Course;
use App\Models\Batch;
use App\Models\AlumniProfile;
use App\Models\Survey;
use App\Models\SurveyQuestion;
use App\Models\SurveyResponse;
use App\Models\Employment;
use Faker\Factory as Faker;

class ComprehensiveTestDataSeeder extends Seeder
{
    private $faker;
    
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->faker = Faker::create();
        
        $this->command->info('🌱 Starting alumni profiles seeding...');
        
        // Only seed alumni using existing departments and courses
        $this->seedBatches();
        $this->seedAlumniProfiles();
        $this->seedEmploymentHistory();
        
        $this->command->info('✅ Alumni seeding completed successfully!');
    }

    /**
     * Seed batches (graduation years)
     */
    private function seedBatches(): void
    {
        $this->command->info('Seeding batches...');

        $currentYear = now()->year;
        $startYear = $currentYear - 10; // Last 10 years

        for ($year = $startYear; $year <= $currentYear; $year++) {
            Batch::firstOrCreate(
                ['graduation_year' => $year],
                [
                    'name' => "Batch $year",
                    'description' => "Graduating class of $year",
                    'status' => 'active'
                ]
            );
        }

        $this->command->info('✓ Created ' . (($currentYear - $startYear) + 1) . ' batches');
    }

    /**
     * Seed diverse alumni profiles using EXISTING departments and courses
     */
    private function seedAlumniProfiles(): void
    {
        $this->command->info('Seeding alumni profiles...');

        // Use ONLY existing departments and courses
        $departments = Department::with('courses')->get();
        
        if ($departments->isEmpty()) {
            $this->command->error('No departments found! Please create departments first.');
            return;
        }

        $batches = Batch::all();
        $employmentStatuses = ['employed', 'unemployed', 'self-employed', 'pursuing_further_studies'];
        
        // Generic skills pool
        $skillsPool = ['Communication', 'Teamwork', 'Problem Solving', 'Time Management', 'Leadership', 
                      'Critical Thinking', 'Adaptability', 'Project Management', 'Technical Skills', 
                      'Research', 'Data Analysis', 'Microsoft Office', 'Presentation Skills'];

        $alumniCount = 200; // Create 200 diverse alumni profiles

        for ($i = 1; $i <= $alumniCount; $i++) {
            // Pick a random department that has courses
            $department = $departments->filter(function($d) {
                return $d->courses->count() > 0;
            })->random();
            
            if (!$department || $department->courses->isEmpty()) {
                $this->command->warn("Skipping - no courses found for department");
                continue;
            }

            $course = $department->courses->random();
            $batch = $batches->random();
            $gender = $this->faker->randomElement(['male', 'female', 'other']);
            
            // Generate realistic Filipino names
            $firstName = $gender === 'female' 
                ? $this->faker->randomElement(['Maria', 'Ana', 'Rosa', 'Elena', 'Sofia', 'Isabella', 'Gabriela', 'Nicole', 'Andrea', 'Patricia'])
                : $this->faker->randomElement(['Juan', 'Jose', 'Miguel', 'Carlos', 'Antonio', 'Rafael', 'Gabriel', 'Daniel', 'Luis', 'Pedro']);
            
            $lastName = $this->faker->randomElement(['Santos', 'Reyes', 'Cruz', 'Bautista', 'Garcia', 'Fernandez', 'Mendoza', 'Torres', 'Rivera', 'Flores']);
            
            $email = strtolower($firstName . '.' . $lastName . $i . '@example.com');
            
            // Create user first
            $user = User::firstOrCreate(
                ['email' => $email],
                [
                    'name' => $firstName . ' ' . $lastName,
                    'password' => Hash::make('password123'),
                    'email_verified_at' => now(),
                    'role' => 'alumni',
                    'status' => 'active'
                ]
            );

            // Select random skills
            $selectedSkills = $this->faker->randomElements($skillsPool, $this->faker->numberBetween(3, 7));

            // Map employment status to actual enum values
            $employmentStatusMap = [
                'employed' => 'employed_full_time',
                'unemployed' => 'unemployed_seeking',
                'self-employed' => 'self_employed',
                'pursuing_further_studies' => 'continuing_education'
            ];
            $randomStatus = $this->faker->randomElement($employmentStatuses);
            $mappedStatus = $employmentStatusMap[$randomStatus] ?? 'employed_full_time';

            // Create alumni profile
            $alumniProfile = AlumniProfile::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'department_id' => $department->id,
                    'course_id' => $course->id,
                    'batch_id' => $batch->id,
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'middle_name' => $this->faker->randomElement(['M.', 'A.', 'G.', 'S.', 'L.']),
                    'phone' => '09' . $this->faker->numerify('#########'),
                    'alternate_email' => $email,
                    'birth_date' => $this->faker->dateTimeBetween('-35 years', '-22 years'),
                    'gender' => $gender,
                    'current_address' => $this->faker->address,
                    'city' => $this->faker->city,
                    'state_province' => $this->faker->state,
                    'country' => 'Philippines',
                    'postal_code' => $this->faker->numerify('####'),
                    
                    // Education info (make truly unique with timestamp)
                    'student_id' => $batch->graduation_year . '-' . $department->code . '-' . uniqid(),
                    'graduation_year' => $batch->graduation_year,
                    'graduation_date' => $this->faker->dateTimeBetween($batch->graduation_year . '-03-01', $batch->graduation_year . '-06-30'),
                    'degree_program' => $course->name,
                    'gpa' => $this->faker->randomFloat(2, 1.5, 4.0),
                    
                    // Employment info
                    'employment_status' => $mappedStatus,
                    'current_job_title' => $this->faker->jobTitle,
                    'current_employer' => $this->faker->company,
                    'company_industry' => $this->faker->randomElement(['Technology', 'Healthcare', 'Education', 'Finance', 'Manufacturing', 'Retail', 'Government', 'Consulting']),
                    'company_size' => $this->faker->randomElement(['1-10', '11-50', '51-200', '201-500', '500+']),
                    'current_salary' => $this->faker->numberBetween(20000, 100000),
                    'salary_currency' => 'PHP',
                    'job_start_date' => $this->faker->dateTimeBetween('-5 years', 'now'),
                    'job_related_to_degree' => $this->faker->boolean(75),
                    'job_mismatch_reason' => $mappedStatus === 'employed_full_time' || $mappedStatus === 'employed_part_time' || $mappedStatus === 'self_employed' 
                        ? $this->faker->randomElement([null, null, null, 'overqualified', 'underqualified', 'unfit']) // 50% have no mismatch
                        : null,
                    'job_satisfaction' => $mappedStatus === 'employed_full_time' || $mappedStatus === 'employed_part_time' || $mappedStatus === 'self_employed'
                        ? $this->faker->numberBetween(1, 10)
                        : null,
                    'unemployment_reason' => !in_array($mappedStatus, ['employed_full_time', 'employed_part_time', 'self_employed', 'continuing_education'])
                        ? $this->faker->randomElement(['lack_of_opportunities', 'job_mismatch', 'health_issues', 'family_responsibilities', 'pursuing_business'])
                        : null,
                    
                    // Skills
                    'skills' => json_encode($selectedSkills),
                    'certifications' => json_encode($this->faker->randomElements(['PMP', 'ITIL', 'AWS Certified', 'Cisco CCNA', 'CPA'], $this->faker->numberBetween(0, 2))),
                    
                    // Professional info
                    'career_goals' => $this->faker->paragraph,
                    'willing_to_mentor' => $this->faker->boolean(40),
                    'willing_to_hire_alumni' => $this->faker->boolean(30),
                    
                    // Profile completion
                    'profile_completed' => $this->faker->boolean(70), // 70% have completed profiles
                    'profile_completed_at' => $this->faker->boolean(70) ? now()->subDays($this->faker->numberBetween(1, 365)) : null
                ]
            );

            if ($i % 50 == 0) {
                $this->command->info("  - Created $i alumni profiles...");
            }
        }

        $this->command->info('✓ Created ' . $alumniCount . ' alumni profiles');
    }

    /**
     * Seed employment history for alumni with realistic dates based on graduation
     */
    private function seedEmploymentHistory(): void
    {
        $this->command->info('Seeding employment history...');

        $alumni = AlumniProfile::with('batch')->get();
        $employmentTypes = ['full-time', 'part-time', 'contract', 'freelance', 'internship'];

        $employmentCount = 0;

        foreach ($alumni as $alum) {
            if (!$alum->batch) continue;

            // Get graduation date (June of graduation year)
            $graduationDate = \Carbon\Carbon::create($alum->batch->graduation_year, 6, 1);
            
            // Only create employment for employed alumni
            $isEmployed = in_array($alum->employment_status, ['employed_full_time', 'employed_part_time', 'self_employed']);
            
            if ($isEmployed && $this->faker->boolean(85)) { // 85% of employed alumni have employment records
                $numberOfJobs = $this->faker->numberBetween(1, 2);
                
                // Calculate realistic job start dates
                // Most alumni find jobs 1-6 months after graduation
                // Some find jobs before graduation (internships)
                $timeToFirstJob = $this->faker->numberBetween(-180, 180); // -6 months to +6 months from graduation
                $firstJobStartDate = $graduationDate->copy()->addDays($timeToFirstJob);
                
                // Don't create jobs in the future
                if ($firstJobStartDate->isFuture()) {
                    $firstJobStartDate = now()->subMonths($this->faker->numberBetween(1, 12));
                }
                
                for ($j = 0; $j < $numberOfJobs; $j++) {
                    $isCurrentJob = ($j == $numberOfJobs - 1);
                    
                    if ($j === 0) {
                        // First job
                        $jobStartDate = $firstJobStartDate;
                    } else {
                        // Subsequent jobs start after previous job
                        $jobStartDate = $firstJobStartDate->copy()->addMonths($this->faker->numberBetween(12, 36));
                    }
                    
                    // Calculate end date for past jobs
                    $jobEndDate = null;
                    if (!$isCurrentJob) {
                        $jobEndDate = $jobStartDate->copy()->addMonths($this->faker->numberBetween(6, 24));
                        // Make sure end date is not in the future
                        if ($jobEndDate->isFuture()) {
                            $jobEndDate = now()->subMonths($this->faker->numberBetween(1, 6));
                        }
                    }
                    
                    Employment::create([
                        'alumni_id' => $alum->id,
                        'company_name' => $this->faker->company,
                        'position' => $this->faker->jobTitle,
                        'employment_type' => $this->faker->randomElement($employmentTypes),
                        'industry' => $this->faker->randomElement(['Technology', 'Healthcare', 'Education', 'Finance', 'Manufacturing', 'Retail', 'Government']),
                        'location' => $this->faker->city . ', Philippines',
                        'start_date' => $jobStartDate,
                        'end_date' => $jobEndDate,
                        'is_current' => $isCurrentJob,
                        'salary' => $this->faker->randomFloat(2, 20000, 100000)
                    ]);
                    
                    $employmentCount++;
                }
            }
        }

        $this->command->info('✓ Created ' . $employmentCount . ' employment records');
    }
}
