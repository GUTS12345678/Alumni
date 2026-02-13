<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Carbon\Carbon;

class CaviteCampusSeeder extends Seeder
{
    public function run(): void
    {
        $caviteCampusId = 2; // EARIST Cavite Campus
        $now = Carbon::now();
        $password = Hash::make('password');

        $this->command->info('Seeding Cavite Campus data...');

        // ===== 1. DEPARTMENTS =====
        $departments = [
            ['name' => 'College of Industrial Technology - Cavite', 'code' => 'CIT-CAV', 'description' => 'Industrial Technology programs at Cavite Campus'],
            ['name' => 'College of Engineering - Cavite', 'code' => 'COE-CAV', 'description' => 'Engineering programs at Cavite Campus'],
            ['name' => 'College of Arts & Sciences - Cavite', 'code' => 'CAS-CAV', 'description' => 'Arts and Sciences programs at Cavite Campus'],
            ['name' => 'College of Education - Cavite', 'code' => 'COED-CAV', 'description' => 'Education programs at Cavite Campus'],
            ['name' => 'College of Business Administration - Cavite', 'code' => 'CBA-CAV', 'description' => 'Business Administration programs at Cavite Campus'],
        ];

        $departmentIds = [];
        foreach ($departments as $dept) {
            $id = DB::table('departments')->insertGetId([
                'campus_id' => $caviteCampusId,
                'name' => $dept['name'],
                'code' => $dept['code'],
                'description' => $dept['description'],
                'primary_color' => '#7C2529',
                'secondary_color' => '#B89968',
                'status' => 'active',
                'created_at' => $now,
                'updated_at' => $now,
            ]);
            $departmentIds[$dept['code']] = $id;
        }
        $this->command->info('  Created ' . count($departmentIds) . ' departments');

        // ===== 2. COURSES =====
        $courses = [
            // CIT-CAV
            ['dept' => 'CIT-CAV', 'name' => 'Bachelor of Science in Industrial Technology Major in Electrical Technology', 'code' => 'BSIT-ET-CAV', 'duration' => 4],
            ['dept' => 'CIT-CAV', 'name' => 'Bachelor of Science in Industrial Technology Major in Electronics Technology', 'code' => 'BSIT-ELEC-CAV', 'duration' => 4],
            ['dept' => 'CIT-CAV', 'name' => 'Bachelor of Science in Industrial Technology Major in Automotive Technology', 'code' => 'BSIT-AT-CAV', 'duration' => 4],
            ['dept' => 'CIT-CAV', 'name' => 'Bachelor of Science in Industrial Technology Major in Mechanical Technology', 'code' => 'BSIT-MT-CAV', 'duration' => 4],
            // COE-CAV
            ['dept' => 'COE-CAV', 'name' => 'Bachelor of Science in Civil Engineering', 'code' => 'BSCE-CAV', 'duration' => 5],
            ['dept' => 'COE-CAV', 'name' => 'Bachelor of Science in Electrical Engineering', 'code' => 'BSEE-CAV', 'duration' => 5],
            ['dept' => 'COE-CAV', 'name' => 'Bachelor of Science in Mechanical Engineering', 'code' => 'BSME-CAV', 'duration' => 5],
            // CAS-CAV
            ['dept' => 'CAS-CAV', 'name' => 'Bachelor of Science in Mathematics', 'code' => 'BSM-CAV', 'duration' => 4],
            ['dept' => 'CAS-CAV', 'name' => 'Bachelor of Arts in Communication', 'code' => 'BAC-CAV', 'duration' => 4],
            // COED-CAV
            ['dept' => 'COED-CAV', 'name' => 'Bachelor of Secondary Education Major in Mathematics', 'code' => 'BSED-MATH-CAV', 'duration' => 4],
            ['dept' => 'COED-CAV', 'name' => 'Bachelor of Secondary Education Major in English', 'code' => 'BSED-ENG-CAV', 'duration' => 4],
            ['dept' => 'COED-CAV', 'name' => 'Bachelor of Elementary Education', 'code' => 'BEED-CAV', 'duration' => 4],
            // CBA-CAV
            ['dept' => 'CBA-CAV', 'name' => 'Bachelor of Science in Business Administration Major in Financial Management', 'code' => 'BSBA-FM-CAV', 'duration' => 4],
            ['dept' => 'CBA-CAV', 'name' => 'Bachelor of Science in Business Administration Major in Marketing Management', 'code' => 'BSBA-MM-CAV', 'duration' => 4],
            ['dept' => 'CBA-CAV', 'name' => 'Bachelor of Science in Entrepreneurship', 'code' => 'BSE-CAV', 'duration' => 4],
        ];

        $courseIds = [];
        foreach ($courses as $course) {
            $id = DB::table('courses')->insertGetId([
                'campus_id' => $caviteCampusId,
                'department_id' => $departmentIds[$course['dept']],
                'name' => $course['name'],
                'code' => $course['code'],
                'duration_years' => $course['duration'],
                'status' => 'active',
                'created_at' => $now,
                'updated_at' => $now,
            ]);
            $courseIds[] = $id;
        }
        $this->command->info('  Created ' . count($courseIds) . ' courses');

        // ===== 3. ADMIN USER FOR CAVITE =====
        $caviteAdminId = DB::table('users')->insertGetId([
            'name' => 'Cavite Campus Admin',
            'email' => 'admin@cavite.earist.edu',
            'password' => $password,
            'role_id' => 2, // admin
            'campus_id' => $caviteCampusId,
            'email_verified_at' => $now,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $this->command->info('  Created Cavite admin: admin@cavite.earist.edu / password');

        // ===== 4. ALUMNI USERS & PROFILES =====
        $firstNames = ['Maria', 'Jose', 'Juan', 'Ana', 'Pedro', 'Rosa', 'Carlo', 'Lea', 'Mark', 'Jen',
            'Rico', 'Sarah', 'Paolo', 'Nica', 'Drew', 'Mia', 'Renz', 'Kath', 'Jay', 'Lyn',
            'Ariel', 'Faith', 'Bryan', 'Grace', 'Neil', 'Diane', 'Kevin', 'Iris', 'Ramon', 'April',
            'Leo', 'Joy', 'Rex', 'Mae', 'Ian', 'Ella', 'Dan', 'Pia', 'Ken', 'Ruby',
            'Art', 'Beth', 'Gino', 'Liz', 'Vic', 'Tina', 'Ron', 'Cher', 'Ed', 'Ivy',
            'Noel', 'Sue', 'Gil', 'Kim', 'Roy', 'Amy', 'Max', 'Faye', 'Ben', 'Zoe',
            'Chris', 'Angel', 'Tom', 'Mika', 'Luis', 'Via', 'Joel', 'Shy', 'Raf', 'Erica',
            'Jude', 'Camille', 'Mike', 'Nicole', 'Sam', 'Bea', 'Alvin', 'Trish', 'Dale', 'Hazel',
            'Vince', 'Donna', 'Manny', 'Chloe', 'Ray', 'Gwen', 'Toby', 'Aira', 'Phil', 'Yza',
            'Fritz', 'Lara', 'Jun', 'Dina', 'Jed', 'Kate', 'Carl', 'Abby', 'Walt', 'Bianca'];

        $lastNames = ['Santos', 'Reyes', 'Cruz', 'Bautista', 'Garcia', 'Flores', 'Rivera', 'Torres', 'Gonzales', 'Ramos',
            'Lopez', 'Martinez', 'Hernandez', 'Diaz', 'Morales', 'Castillo', 'Aquino', 'Mendoza', 'Villanueva', 'Castro',
            'Dela Cruz', 'Manalo', 'Aguilar', 'Santiago', 'Soriano', 'David', 'Rosario', 'Navarro', 'Pascual', 'Salazar',
            'Gutierrez', 'Mercado', 'Tolentino', 'Valencia', 'Panganiban', 'Perez', 'Miranda', 'Fernandez', 'Ocampo', 'Enriquez',
            'Lim', 'Tan', 'Go', 'Chua', 'Sy', 'Uy', 'Ong', 'Co', 'Ang', 'Lee'];

        $employmentStatuses = ['employed_full_time', 'employed_part_time', 'self_employed', 'unemployed_seeking', 'continuing_education'];
        $employmentWeights = [35, 10, 15, 25, 15]; // percentage distribution

        $industries = ['Information Technology', 'Engineering', 'Education', 'Manufacturing', 'Construction',
            'Financial Services', 'Healthcare', 'Government', 'Telecommunications', 'Retail'];

        $jobTitles = [
            'employed_full_time' => ['Software Developer', 'Civil Engineer', 'Teacher', 'Electrical Engineer', 'Mechanical Engineer',
                'Quality Assurance Engineer', 'Network Administrator', 'Marketing Specialist', 'Accountant', 'Project Manager',
                'Systems Analyst', 'Production Supervisor', 'HR Specialist', 'Technical Writer', 'Business Analyst'],
            'employed_part_time' => ['Freelance Developer', 'Tutorial Instructor', 'Research Assistant', 'Part-time Lecturer', 'Consultant'],
            'self_employed' => ['Freelancer', 'Contractor', 'Business Owner', 'Online Seller', 'Technical Consultant'],
        ];

        $companySizes = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];

        $totalAlumni = 150;
        $createdUsers = 0;
        $deptKeys = array_keys($departmentIds);

        for ($i = 0; $i < $totalAlumni; $i++) {
            $firstName = $firstNames[$i % count($firstNames)];
            $lastName = $lastNames[$i % count($lastNames)];
            $gradYear = rand(2015, 2025);
            $email = strtolower($firstName) . '.' . strtolower(str_replace(' ', '', $lastName)) . '.cav' . $i . '@alumni.earist.edu';
            $studentId = 'CAV-' . $gradYear . '-' . str_pad($i + 1, 4, '0', STR_PAD_LEFT);

            // Pick department and course
            $deptCode = $deptKeys[array_rand($deptKeys)];
            $deptId = $departmentIds[$deptCode];

            // Find courses for this department
            $deptCourses = DB::table('courses')->where('department_id', $deptId)->pluck('id')->toArray();
            $courseId = !empty($deptCourses) ? $deptCourses[array_rand($deptCourses)] : $courseIds[array_rand($courseIds)];
            $courseName = DB::table('courses')->where('id', $courseId)->value('name');

            // Weighted random employment status
            $rand = rand(1, 100);
            $cumulative = 0;
            $empStatus = 'employed_full_time';
            foreach ($employmentStatuses as $idx => $status) {
                $cumulative += $employmentWeights[$idx];
                if ($rand <= $cumulative) {
                    $empStatus = $status;
                    break;
                }
            }

            // Create user
            $userId = DB::table('users')->insertGetId([
                'name' => "$firstName $lastName",
                'email' => $email,
                'password' => $password,
                'role_id' => 3, // alumni
                'campus_id' => $caviteCampusId,
                'email_verified_at' => $now,
                'created_at' => Carbon::create($gradYear, rand(1, 12), rand(1, 28)),
                'updated_at' => $now,
            ]);

            // Build profile data
            $profileData = [
                'user_id' => $userId,
                'campus_id' => $caviteCampusId,
                'student_id' => $studentId,
                'first_name' => $firstName,
                'last_name' => $lastName,
                'phone' => '+639' . rand(100000000, 999999999),
                'birth_date' => Carbon::create(rand(1990, 2003), rand(1, 12), rand(1, 28))->format('Y-m-d'),
                'gender' => ['male', 'female'][rand(0, 1)],
                'current_address' => ['Rosario, Cavite', 'Noveleta, Cavite', 'Kawit, Cavite', 'Imus, Cavite', 'Bacoor, Cavite',
                    'Dasmariñas, Cavite', 'General Trias, Cavite', 'Silang, Cavite', 'Tagaytay, Cavite', 'Trece Martires, Cavite'][rand(0, 9)],
                'city' => ['Rosario', 'Noveleta', 'Kawit', 'Imus', 'Bacoor', 'Dasmariñas', 'General Trias', 'Silang'][rand(0, 7)],
                'state_province' => 'Cavite',
                'country' => 'Philippines',
                'department_id' => $deptId,
                'course_id' => $courseId,
                'degree_program' => $courseName,
                'graduation_year' => $gradYear,
                'graduation_date' => Carbon::create($gradYear, rand(4, 6), rand(1, 28))->format('Y-m-d'),
                'employment_status' => $empStatus,
                'profile_completed' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ];

            // Add employment-specific data
            if (in_array($empStatus, ['employed_full_time', 'employed_part_time', 'self_employed'])) {
                $titles = $jobTitles[$empStatus] ?? $jobTitles['employed_full_time'];
                $profileData['current_job_title'] = $titles[array_rand($titles)];
                $profileData['company_industry'] = $industries[array_rand($industries)];
                $profileData['company_size'] = $companySizes[array_rand($companySizes)];
                $profileData['salary_range'] = ['below_15k', '15k_25k', '25k_35k', '35k_50k', '50k_75k', '75k_100k'][rand(0, 5)];
                $profileData['job_related_to_degree'] = [true, true, true, false][rand(0, 3)]; // 75% related
            }

            if ($empStatus === 'unemployed_seeking') {
                $profileData['unemployment_reason'] = ['lack_of_opportunities', 'location_constraints', 'continuing_education', 'other'][rand(0, 3)];
            }

            DB::table('alumni_profiles')->insert($profileData);
            $createdUsers++;
        }

        $this->command->info("  Created {$createdUsers} alumni users & profiles for Cavite Campus");

        // ===== 5. SURVEY RESPONSES FOR CAVITE ALUMNI =====
        // Get existing surveys
        $surveys = DB::table('surveys')->where('status', 'active')->get();
        $caviteAlumniIds = DB::table('users')
            ->where('campus_id', $caviteCampusId)
            ->where('role_id', 3)
            ->pluck('id')
            ->toArray();

        $responseCount = 0;
        foreach ($surveys as $survey) {
            // 30% of Cavite alumni respond to each survey
            $respondents = array_slice($caviteAlumniIds, 0, (int)(count($caviteAlumniIds) * 0.3));
            shuffle($respondents);

            $questions = DB::table('survey_questions')->where('survey_id', $survey->id)->get();

            foreach ($respondents as $alumniId) {
                $responseId = DB::table('survey_responses')->insertGetId([
                    'survey_id' => $survey->id,
                    'user_id' => $alumniId,
                    'response_token' => Str::uuid()->toString(),
                    'status' => 'completed',
                    'completed_at' => $now->copy()->subDays(rand(1, 60)),
                    'created_at' => $now->copy()->subDays(rand(60, 90)),
                    'updated_at' => $now,
                ]);

                // Answer each question
                foreach ($questions as $question) {
                    $answer = $this->generateAnswer($question);
                    if ($answer !== null) {
                        DB::table('survey_answers')->insert([
                            'survey_response_id' => $responseId,
                            'survey_question_id' => $question->id,
                            'answer_text' => $answer,
                            'answered_at' => $now,
                            'created_at' => $now,
                            'updated_at' => $now,
                        ]);
                    }
                }
                $responseCount++;
            }
        }
        $this->command->info("  Created {$responseCount} survey responses from Cavite alumni");

        $this->command->info('Cavite Campus seeding complete!');
    }

    private function generateAnswer($question): ?string
    {
        $type = $question->type ?? 'text';

        switch ($type) {
            case 'multiple_choice':
            case 'radio':
            case 'select':
                $options = json_decode($question->options ?? '[]', true);
                if (!empty($options)) {
                    return is_array($options[0]) ? ($options[array_rand($options)]['value'] ?? 'N/A') : $options[array_rand($options)];
                }
                return 'N/A';

            case 'checkbox':
                $options = json_decode($question->options ?? '[]', true);
                if (!empty($options)) {
                    $selected = array_slice($options, 0, rand(1, min(3, count($options))));
                    $vals = array_map(fn($o) => is_array($o) ? ($o['value'] ?? '') : $o, $selected);
                    return json_encode($vals);
                }
                return json_encode(['N/A']);

            case 'rating':
            case 'scale':
                return (string) rand(3, 5);

            case 'number':
                return (string) rand(1, 100);

            case 'textarea':
            case 'long_text':
                $responses = [
                    'The program provided good foundational knowledge for my career.',
                    'I am satisfied with the quality of education I received.',
                    'The campus facilities were adequate for our learning needs.',
                    'I would recommend this institution to others.',
                    'More industry partnerships would benefit future students.',
                ];
                return $responses[array_rand($responses)];

            default:
                $shortAnswers = ['Good', 'Satisfactory', 'Yes', 'Adequate', 'Would recommend'];
                return $shortAnswers[array_rand($shortAnswers)];
        }
    }
}
