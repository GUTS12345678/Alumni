<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class ComprehensiveAlumniSeeder extends Seeder
{
    // Filipino first names
    private array $firstNames = [
        'Juan', 'Maria', 'Jose', 'Anna', 'Pedro', 'Sofia', 'Miguel', 'Isabella',
        'Luis', 'Carmen', 'Antonio', 'Elena', 'Carlos', 'Rosa', 'Francisco', 'Lucia',
        'Manuel', 'Teresa', 'Rafael', 'Patricia', 'Diego', 'Andrea', 'Gabriel', 'Cristina',
        'Daniel', 'Laura', 'Javier', 'Beatriz', 'Ricardo', 'Monica', 'Fernando', 'Gabriela',
        'Roberto', 'Mariana', 'Eduardo', 'Valeria', 'Alejandro', 'Natalia', 'Jorge', 'Adriana',
        'Andres', 'Veronica', 'Marco', 'Diana', 'Pablo', 'Carolina', 'Sergio', 'Angela',
        'Oscar', 'Jessica', 'Ramon', 'Michelle', 'Victor', 'Nicole', 'Rodrigo', 'Melissa',
    ];

    private array $lastNames = [
        'Cruz', 'Santos', 'Reyes', 'Garcia', 'Ramos', 'Flores', 'Mendoza', 'Torres',
        'Gonzales', 'Lopez', 'Bautista', 'Fernandez', 'Domingo', 'Castro', 'Rivera',
        'Aquino', 'Villanueva', 'Martinez', 'Del Rosario', 'Romero', 'Hernandez', 'Morales',
        'Pascual', 'Santiago', 'Diaz', 'Gutierrez', 'Valdez', 'Perez', 'Rodriguez', 'Sanchez',
    ];

    private array $cities = [
        'Manila', 'Quezon City', 'Makati', 'Pasig', 'Taguig', 'Paranaque', 'Las Pinas',
        'Mandaluyong', 'Marikina', 'Caloocan', 'Bacoor', 'Dasmarinas', 'Imus', 'Cavite City',
        'Antipolo', 'San Juan', 'Muntinlupa', 'Pasay', 'Malabon', 'Navotas',
    ];

    private array $companies = [
        'Accenture Philippines', 'IBM Philippines', 'Smart Communications', 'Globe Telecom',
        'Ayala Corporation', 'SM Investments', 'Jollibee Foods Corporation', 'San Miguel Corporation',
        'Philippine Airlines', 'Meralco', 'BDO Unibank', 'BPI', 'Metrobank', 'Landbank',
        'PLDT', 'ABS-CBN', 'GMA Network', 'Converge ICT', 'Megaworld', 'Robinsons Land',
        'DMCI Holdings', 'Vista Land', 'Century Pacific', 'Universal Robina', 'Petron',
        'Shell Philippines', 'Chevron Philippines', 'Nestle Philippines', 'Unilever Philippines',
        'Procter & Gamble', 'Del Monte Philippines', 'Emperador Inc', 'LT Group',
    ];

    private array $jobTitles = [
        // IT/CS
        'Software Engineer', 'Web Developer', 'Mobile App Developer', 'Systems Analyst',
        'Database Administrator', 'Network Engineer', 'IT Support Specialist', 'DevOps Engineer',
        'Data Analyst', 'Cybersecurity Specialist', 'UI/UX Designer', 'Full Stack Developer',
        
        // Engineering
        'Civil Engineer', 'Mechanical Engineer', 'Electrical Engineer', 'Project Engineer',
        'Quality Assurance Engineer', 'Design Engineer', 'Maintenance Engineer', 'Safety Engineer',
        
        // Business
        'Marketing Manager', 'Sales Executive', 'Business Analyst', 'HR Manager',
        'Finance Officer', 'Accountant', 'Operations Manager', 'Customer Service Representative',
        'Brand Manager', 'Product Manager', 'Supply Chain Analyst', 'Purchasing Officer',
        
        // Entry Level
        'Junior Developer', 'Assistant Engineer', 'Staff Engineer', 'Junior Analyst',
        'Administrative Assistant', 'Sales Associate', 'Technical Support', 'Junior Accountant',
    ];

    private array $skills = [
        'Java, Python, SQL, Git',
        'JavaScript, React, Node.js, MongoDB',
        'C++, C#, .NET Framework, Azure',
        'PHP, Laravel, MySQL, Vue.js',
        'AutoCAD, STAAD Pro, Revit, MS Project',
        'MATLAB, PLC Programming, Industrial Automation',
        'Financial Analysis, QuickBooks, SAP, Excel',
        'Digital Marketing, SEO, Google Analytics, Social Media',
        'Project Management, Agile, Scrum, JIRA',
        'Data Analysis, Tableau, Power BI, Python',
    ];

    private array $certifications = [
        'CISCO Certified Network Associate (CCNA)',
        'Microsoft Certified Azure Developer',
        'AWS Certified Solutions Architect',
        'Oracle Certified Professional',
        'Certified Public Accountant (CPA)',
        'Project Management Professional (PMP)',
        'Professional Engineer (P.E.) License',
        'Civil Engineer License',
        'Electrical Engineer License',
        'Google Analytics Certification',
    ];

    /**
     * Run the comprehensive alumni seeder
     */
    public function run(): void
    {
        echo "\n╔══════════════════════════════════════════════════════════════╗\n";
        echo "║         COMPREHENSIVE ALUMNI DATA SEEDING                    ║\n";
        echo "╚══════════════════════════════════════════════════════════════╝\n\n";

        // Get campus data
        $mainCampusId = 1;
        $caviteCampusId = 2;

        // Get departments and courses for each campus
        $mainDepts = DB::table('departments')->where('campus_id', $mainCampusId)->pluck('id', 'code');
        $caviteDepts = DB::table('departments')->where('campus_id', $caviteCampusId)->pluck('id', 'code');

        $mainCourses = DB::table('courses')->where('campus_id', $mainCampusId)->pluck('id', 'code');
        $caviteCourses = DB::table('courses')->where('campus_id', $caviteCampusId)->pluck('id', 'code');

        $mainBatches = DB::table('batches')->where('campus_id', $mainCampusId)->pluck('id', 'graduation_year');
        $caviteBatches = DB::table('batches')->where('campus_id', $caviteCampusId)->pluck('id', 'graduation_year');

        if ($mainDepts->isEmpty() || $caviteDepts->isEmpty()) {
            echo "❌ ERROR: Departments not found! Run CaviteCampusInfrastructureSeeder first.\n";
            return;
        }

        echo "✅ Found {$mainDepts->count()} Main Campus departments\n";
        echo "✅ Found {$caviteDepts->count()} Cavite Campus departments\n";
        echo "✅ Found {$mainCourses->count()} Main Campus courses\n";
        echo "✅ Found {$caviteCourses->count()} Cavite Campus courses\n\n";

        // Seed Main Campus Alumni (100 alumni)
        echo "⏳ Seeding Main Campus Alumni (100 alumni)...\n";
        $this->seedCampusAlumni($mainCampusId, 100, $mainDepts, $mainCourses, $mainBatches);
        echo "✅ Main Campus seeding complete\n\n";

        // Seed Cavite Campus Alumni (100 alumni)
        echo "⏳ Seeding Cavite Campus Alumni (100 alumni)...\n";
        $this->seedCampusAlumni($caviteCampusId, 100, $caviteDepts, $caviteCourses, $caviteBatches);
        echo "✅ Cavite Campus seeding complete\n\n";

        // Summary
        echo "╔══════════════════════════════════════════════════════════════╗\n";
        echo "║                SEEDING COMPLETE                              ║\n";
        echo "╚══════════════════════════════════════════════════════════════╝\n\n";

        $totalUsers = DB::table('users')->where('role', 'alumni')->count();
        $totalProfiles = DB::table('alumni_profiles')->count();
        $totalEmployments = DB::table('employments')->count();

        echo "Final Statistics:\n";
        echo "- Total Alumni Users: {$totalUsers}\n";
        echo "- Total Alumni Profiles: {$totalProfiles}\n";
        echo "- Total Employment Records: {$totalEmployments}\n\n";

        $mainCount = DB::table('alumni_profiles')->where('campus_id', 1)->count();
        $caviteCount = DB::table('alumni_profiles')->where('campus_id', 2)->count();
        
        echo "Campus Distribution:\n";
        echo "- Main Campus: {$mainCount} alumni\n";
        echo "- Cavite Campus: {$caviteCount} alumni\n\n";

        echo "✅ All alumni data seeded successfully!\n\n";
    }

    /**
     * Seed alumni for a specific campus
     */
    private function seedCampusAlumni(int $campusId, int $count, $departments, $courses, $batches): void
    {
        $campusName = $campusId == 1 ? 'MAIN' : 'CAV';
        
        // Distribution by graduation year
        $yearDistribution = [
            2018 => (int)($count * 0.10), // 10%
            2019 => (int)($count * 0.15), // 15%
            2020 => (int)($count * 0.20), // 20%
            2021 => (int)($count * 0.20), // 20%
            2022 => (int)($count * 0.15), // 15%
            2023 => (int)($count * 0.12), // 12%
            2024 => (int)($count * 0.08), // 8%
        ];

        $createdCount = 0;

        foreach ($yearDistribution as $year => $yearCount) {
            for ($i = 0; $i < $yearCount; $i++) {
                $this->createAlumnus($campusId, $campusName, $year, $departments, $courses, $batches, $createdCount);
                $createdCount++;
            }
        }

        // Create remaining to reach exact count
        while ($createdCount < $count) {
            $randomYear = array_rand($yearDistribution);
            $this->createAlumnus($campusId, $campusName, $randomYear, $departments, $courses, $batches, $createdCount);
            $createdCount++;
        }
    }

    /**
     * Create a single alumnus with complete data
     */
    private function createAlumnus(int $campusId, string $campusName, int $gradYear, $departments, $courses, $batches, int $index): void
    {
        // Generate name
        $firstName = $this->firstNames[array_rand($this->firstNames)];
        $lastName = $this->lastNames[array_rand($this->lastNames)];
        $middleName = $this->lastNames[array_rand($this->lastNames)];
        
        // Generate email and student ID
        $emailPrefix = strtolower($firstName . '.' . $lastName . $index);
        $email = $emailPrefix . '@alumni.earist.edu.ph';
        $studentId = $gradYear . '-' . str_pad($index + 1, 5, '0', STR_PAD_LEFT) . '-' . $campusName;

        // Select random department and course
        $deptId = $departments->random();
        $courseId = $courses->random();
        $batchId = $batches[$gradYear] ?? $batches->first();

        // Determine employment status (realistic distribution)
        $statusRand = mt_rand(1, 100);
        if ($statusRand <= 60) {
            $employmentStatus = 'employed_full_time';
        } elseif ($statusRand <= 75) {
            $employmentStatus = 'employed_part_time';
        } elseif ($statusRand <= 85) {
            $employmentStatus = 'self_employed';
        } elseif ($statusRand <= 93) {
            $employmentStatus = 'unemployed_seeking';
        } elseif ($statusRand <= 97) {
            $employmentStatus = 'unemployed_not_seeking';
        } else {
            $employmentStatus = 'pursuing_higher_education';
        }

        $isEmployed = in_array($employmentStatus, ['employed_full_time', 'employed_part_time', 'self_employed']);

        // Calculate job start date (if employed)
        $jobStartDate = null;
        $daysToJob = null;
        if ($isEmployed) {
            // Graduation date (assume June 1st)
            $graduationDate = Carbon::create($gradYear, 6, 1);
            
            // Random days to get job (realistic distribution)
            $daysRand = mt_rand(1, 100);
            if ($daysRand <= 20) {
                $daysToJob = mt_rand(0, 30); // 0-30 days (20%)
            } elseif ($daysRand <= 45) {
                $daysToJob = mt_rand(31, 60); // 31-60 days (25%)
            } elseif ($daysRand <= 65) {
                $daysToJob = mt_rand(61, 90); // 61-90 days (20%)
            } elseif ($daysRand <= 80) {
                $daysToJob = mt_rand(91, 120); // 91-120 days (15%)
            } elseif ($daysRand <= 92) {
                $daysToJob = mt_rand(121, 180); // 121-180 days (12%)
            } else {
                $daysToJob = mt_rand(181, 365); // 181-365 days (8%)
            }

            $jobStartDate = $graduationDate->copy()->addDays($daysToJob);
        }

        // Determine job mismatch (if employed)
        $jobMismatchReason = null;
        $jobRelatedToDegree = false;
        $jobSatisfaction = null;

        if ($isEmployed) {
            $mismatchRand = mt_rand(1, 100);
            if ($mismatchRand <= 68) { // 68% good match
                $jobMismatchReason = 'none';
                $jobRelatedToDegree = true;
                $jobSatisfaction = mt_rand(7, 10);
            } elseif ($mismatchRand <= 86) { // 18% overqualified
                $jobMismatchReason = 'overqualified';
                $jobRelatedToDegree = false;
                $jobSatisfaction = mt_rand(4, 7);
            } elseif ($mismatchRand <= 94) { // 8% unfit
                $jobMismatchReason = 'unfit';
                $jobRelatedToDegree = false;
                $jobSatisfaction = mt_rand(3, 6);
            } else { // 6% underqualified
                $jobMismatchReason = 'underqualified';
                $jobRelatedToDegree = true;
                $jobSatisfaction = mt_rand(5, 8);
            }
        }

        // Job details
        $currentJobTitle = $isEmployed ? $this->jobTitles[array_rand($this->jobTitles)] : null;
        $currentEmployer = $isEmployed ? $this->companies[array_rand($this->companies)] : null;
        $currentSalary = $isEmployed ? mt_rand(20000, 80000) : null;

        // Other fields
        $gender = mt_rand(0, 1) == 0 ? 'male' : 'female';
        $birthDate = Carbon::create($gradYear - mt_rand(22, 28), mt_rand(1, 12), mt_rand(1, 28));
        $phone = '09' . mt_rand(100000000, 999999999);
        $city = $this->cities[array_rand($this->cities)];
        $gpa = mt_rand(150, 400) / 100; // 1.50 to 4.00

        // Create user account
        $userId = DB::table('users')->insertGetId([
            'email' => $email,
            'password' => Hash::make('password123'), // Default password
            'role' => 'alumni',
            'status' => 'active',
            'campus_id' => $campusId,
            'email_verified_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Create alumni profile
        $profileId = DB::table('alumni_profiles')->insertGetId([
            'user_id' => $userId,
            'batch_id' => $batchId,
            'department_id' => $deptId,
            'course_id' => $courseId,
            'campus_id' => $campusId,
            'profile_complete' => true,
            'first_name' => $firstName,
            'last_name' => $lastName,
            'middle_name' => $middleName,
            'student_id' => $studentId,
            'birth_date' => $birthDate,
            'gender' => $gender,
            'phone' => $phone,
            'current_address' => mt_rand(1, 999) . ' ' . $city . ' Street',
            'city' => $city,
            'state_province' => 'Metro Manila',
            'postal_code' => mt_rand(1000, 9999),
            'country' => 'Philippines',
            'graduation_year' => $gradYear,
            'graduation_date' => Carbon::create($gradYear, 6, 1),
            'gpa' => $gpa,
            'employment_status' => $employmentStatus,
            'current_job_title' => $currentJobTitle,
            'current_employer' => $currentEmployer,
            'current_salary' => $currentSalary,
            'salary_currency' => 'PHP',
            'job_start_date' => $jobStartDate,
            'job_related_to_degree' => $jobRelatedToDegree,
            'job_mismatch_reason' => $jobMismatchReason,
            'job_satisfaction' => $jobSatisfaction,
            'skills' => $this->skills[array_rand($this->skills)],
            'certifications' => $isEmployed ? $this->certifications[array_rand($this->certifications)] : null,
            'willing_to_mentor' => mt_rand(0, 1) == 1,
            'willing_to_hire_alumni' => mt_rand(0, 1) == 1,
            'profile_completed' => true,
            'profile_completed_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Create employment record (if employed)
        if ($isEmployed && $jobStartDate) {
            DB::table('employments')->insert([
                'alumni_id' => $profileId,
                'company_name' => $currentEmployer,
                'position' => $currentJobTitle,
                'start_date' => $jobStartDate,
                'end_date' => null,
                'is_current' => true,
                'salary' => $currentSalary,
                'industry' => $this->getIndustry($currentJobTitle),
                'location' => $city . ', Philippines',
                'employment_type' => $employmentStatus == 'employed_full_time' ? 'full_time' : ($employmentStatus == 'employed_part_time' ? 'part_time' : 'self_employed'),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Get industry based on job title
     */
    private function getIndustry(string $jobTitle): string
    {
        if (str_contains($jobTitle, 'Software') || str_contains($jobTitle, 'Developer') || str_contains($jobTitle, 'IT')) {
            return 'Information Technology';
        } elseif (str_contains($jobTitle, 'Engineer')) {
            return 'Engineering';
        } elseif (str_contains($jobTitle, 'Manager') || str_contains($jobTitle, 'Business')) {
            return 'Business Management';
        } elseif (str_contains($jobTitle, 'Accountant') || str_contains($jobTitle, 'Finance')) {
            return 'Finance';
        } elseif (str_contains($jobTitle, 'Marketing') || str_contains($jobTitle, 'Sales')) {
            return 'Marketing & Sales';
        } else {
            return 'General';
        }
    }
}
